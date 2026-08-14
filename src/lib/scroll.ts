// src/lib/scroll.ts
//
// The scroll engine.
//
// Every scroll-driven scene on the site runs through here: one scroll
// listener, one requestAnimationFrame loop, one measurement cache, one
// read-then-write phase per frame. The four rules it exists to enforce:
//
//   1. MEASURE OUT OF BAND.  Section geometry is read on load, on font-ready
//      and on width change — never during a scroll. Scenes that need their
//      own measurements (child offsets, canvas size) get a `measure` hook
//      called at the same moments. A frame therefore performs exactly one
//      layout-adjacent read (`window.scrollY`) no matter how many scenes are
//      running, instead of a `getBoundingClientRect()` per scene per frame.
//
//   2. DAMP THE PROGRESS, NOT THE PAGE.  Smooth-scroll libraries win their
//      fluidity by hijacking the scroll itself, which costs you keyboard
//      paging, find-in-page, scrollbar dragging and native momentum, and is
//      capped to 60fps on Safari besides. We keep the browser's scroll and
//      instead ease each scene's *progress value* toward the position the
//      scroll implies. A mouse wheel arrives as ~100px steps; undamped, every
//      garment stroke and card glide steps with it. Damped, the same input
//      reads as one continuous motion — and a trackpad, which is already
//      continuous, is untouched.
//
//   3. FRAME-RATE INDEPENDENCE.  The classic `x += (target - x) * 0.1` runs
//      twice as fast on a 120Hz display as on a 60Hz one. `damp()` below is
//      expressed as a half-life in milliseconds, so the motion is identical
//      on every device.
//
//   4. ONLY RUN WHAT'S VISIBLE, ONLY RUN WHEN MOVING.  Scenes are gated by an
//      IntersectionObserver and the loop stops itself once every scene has
//      settled, so a parked page costs nothing.
//
// Reduced motion: scenes are never registered, so the CSS static fallbacks in
// each component are what renders. Watchers (which drive state, not motion)
// still run.

export type Range = "pin" | "through" | "exit";

export interface Frame {
  /** Damped progress through the scene's range, 0..1. Use for motion. */
  p: number;
  /** Undamped progress. Use where a value must land exactly on a scroll position. */
  raw: number;
  /** Signed scroll velocity, normalised to roughly -1..1 and eased. */
  v: number;
  /** Cached viewport — never read from the DOM mid-frame. */
  vw: number;
  vh: number;
  /** Cached scene box, in document coordinates. */
  top: number;
  height: number;
  /** True on the first frame after the scene becomes live. */
  entered: boolean;
}

export interface SceneOptions {
  /**
   * How the scene's runway maps to 0..1:
   *   pin     — a tall section with a sticky stage. 0 when its top reaches the
   *             viewport top, 1 when its bottom reaches the viewport bottom.
   *   through — 0 as the element enters from below, 1 as it leaves above.
   *   exit    — 0 while the element is at rest, 1 once a full element height
   *             has scrolled past. For viewport-tall heroes.
   */
  range?: Range;
  /**
   * Damping half-life in ms — half the remaining distance is covered every
   * `damp` milliseconds, at any frame rate. ~0 is a hard 1:1 lock to scroll;
   * 70–110 is the range that smooths wheel steps without feeling laggy.
   */
  damp?: number;
  /** How far outside the viewport the scene stays live. */
  margin?: string;
  /** Re-read this scene's own layout. Called on every remeasure, never mid-scroll. */
  measure?: () => void;
}

/* ------------------------------------------------------------------ maths */

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Progress of `p` across the window [a, b], clamped to 0..1. */
export const ramp = (p: number, a: number, b: number): number =>
  a === b ? (p < a ? 0 : 1) : clamp01((p - a) / (b - a));

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Frame-rate independent exponential damping.
 *
 * `half` is a half-life in milliseconds: whatever the frame rate, half the
 * remaining distance to `target` is covered every `half` ms. Passing `half`
 * <= 0 snaps.
 */
export const damp = (
  current: number,
  target: number,
  half: number,
  dt: number,
): number => (half <= 0 ? target : target + (current - target) * Math.pow(2, -dt / half));

/**
 * Where a scroll position falls in a scene's runway, 0..1.
 * Pure — all four inputs come from the engine's cache.
 */
export function progress(
  range: Range,
  scrollY: number,
  top: number,
  height: number,
  vh: number,
): number {
  let total: number;
  let travelled: number;
  switch (range) {
    case "through":
      total = height + vh;
      travelled = scrollY + vh - top;
      break;
    case "exit":
      total = height;
      travelled = scrollY - top;
      break;
    default:
      total = height - vh;
      travelled = scrollY - top;
      break;
  }
  // A "pinned" section shorter than the viewport has no runway; fall back to
  // its own height so it still resolves to something continuous.
  if (total <= 0) total = height > 0 ? height : 1;
  return clamp01(travelled / total);
}

/* ----------------------------------------------------------------- engine */

interface Scene {
  el: HTMLElement;
  render: (f: Frame) => void;
  range: Range;
  half: number;
  measure?: () => void;
  top: number;
  height: number;
  p: number;
  live: boolean;
  entered: boolean;
  /** false until the first render, and after every remeasure, so we snap. */
  primed: boolean;
}

type Watcher = (scrollY: number, v: number) => void;

const scenes: Scene[] = [];
const watchers: Watcher[] = [];

let started = false;
let running = false;
let reduced = false;
let coarse = false;
let last = 0;
let scrollY = 0;
let vel = 0;
let vw = 0;
let vh = 0;
let io: IntersectionObserver | null = null;

/** Velocity above which `Frame.v` saturates, in px/s. */
const V_MAX = 2600;
/** A progress jump larger than this is a teleport (anchor link, restore) — snap. */
const JUMP = 0.34;
/** Below this, a scene is close enough to its target to call it arrived. */
const EPS = 0.0004;

export function reducedMotion(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readViewport(full: boolean): void {
  const w = window.innerWidth;
  const widthChanged = w !== vw;
  vw = w;
  // On touch devices the viewport height flickers as the browser chrome
  // shows and hides. Section runways are sized in `vh`, which does not move
  // with it, so re-reading `innerHeight` there would jolt every scene for a
  // change that never happened. Track height only when the width (i.e. a real
  // layout change) moves with it.
  if (full || widthChanged || vh === 0 || !coarse) vh = window.innerHeight;
}

/** Re-read every scene's geometry. All reads batched, no writes. */
function remeasure(full = false): void {
  readViewport(full);
  const y = window.scrollY;
  for (const s of scenes) {
    s.top = s.el.getBoundingClientRect().top + y;
    s.height = s.el.offsetHeight;
    s.measure?.();
    s.primed = false;
  }
  wake();
}

function onResize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w === vw && (coarse || h === vh)) return;
  remeasure();
}

function onIntersect(entries: IntersectionObserverEntry[]): void {
  for (const e of entries) {
    const s = scenes.find((c) => c.el === e.target);
    if (!s || s.live === e.isIntersecting) continue;
    s.live = e.isIntersecting;
    if (s.live) {
      s.entered = true;
      s.primed = false;
    } else {
      // Leave the scene resolved at the edge it exited through, so coming
      // back to it — from either direction — finds it in the right state.
      const end = progress(s.range, window.scrollY, s.top, s.height, vh);
      s.p = end;
      s.render({ p: end, raw: end, v: 0, vw, vh, top: s.top, height: s.height, entered: false });
    }
  }
  wake();
}

function frame(now: number): void {
  const dt = last ? Math.min(64, now - last) : 16;
  last = now;

  // ---- READ: exactly one, before any write this frame --------------------
  const y = window.scrollY;
  const moved = y - scrollY;
  scrollY = y;

  const instant = dt > 0 ? (moved / dt) * 1000 : 0;
  vel = damp(vel, Math.max(-1, Math.min(1, instant / V_MAX)), 60, dt);

  let busy = Math.abs(moved) > 0.05 || Math.abs(vel) > 0.002;

  // ---- WRITE -------------------------------------------------------------
  for (const s of scenes) {
    if (!s.live) continue;
    const raw = progress(s.range, y, s.top, s.height, vh);

    if (!s.primed || Math.abs(raw - s.p) > JUMP) {
      s.p = raw;
      s.primed = true;
    } else {
      s.p = damp(s.p, raw, s.half, dt);
      if (Math.abs(raw - s.p) < EPS) s.p = raw;
      else busy = true;
    }

    s.render({
      p: s.p, raw, v: vel, vw, vh, top: s.top, height: s.height, entered: s.entered,
    });
    s.entered = false;
  }

  for (const w of watchers) w(y, vel);

  // One final frame at rest, so velocity-driven effects unwind to zero
  // instead of freezing mid-flick.
  if (!busy && vel !== 0) {
    vel = 0;
    busy = true;
  }

  if (busy) requestAnimationFrame(frame);
  else {
    running = false;
    last = 0;
  }
}

function wake(): void {
  if (running) return;
  running = true;
  last = 0;
  requestAnimationFrame(frame);
}

function start(): void {
  if (started) return;
  started = true;
  reduced = reducedMotion();
  coarse = window.matchMedia("(pointer: coarse)").matches;
  readViewport(true);
  scrollY = window.scrollY;

  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", () => remeasure(true), { passive: true });

  // Webfonts and late images reflow the page under our cached geometry.
  document.fonts?.ready.then(() => remeasure(true)).catch(() => {});
  if (document.readyState === "complete") remeasure(true);
  else window.addEventListener("load", () => remeasure(true), { once: true });
}

/**
 * Register a scroll-driven scene. `render` is called once per frame while the
 * scene is on screen, and must only write (transforms, opacity, custom
 * properties) — every value it needs is on the `Frame` it is handed.
 *
 * Returns an unsubscribe function. A no-op under reduced motion, and when
 * `el` is null, so callers can pass a `querySelector` result straight in.
 */
export function scene(
  el: HTMLElement | null,
  render: (f: Frame) => void,
  opts: SceneOptions = {},
): () => void {
  if (!el || typeof window === "undefined") return () => {};
  start();
  if (reduced) return () => {};

  const s: Scene = {
    el,
    render,
    range: opts.range ?? "pin",
    half: opts.damp ?? 90,
    measure: opts.measure,
    top: 0,
    height: 0,
    p: 0,
    live: false,
    entered: true,
    primed: false,
  };
  scenes.push(s);

  readViewport(false);
  s.top = el.getBoundingClientRect().top + window.scrollY;
  s.height = el.offsetHeight;
  s.measure?.();

  if (!io) io = new IntersectionObserver(onIntersect, { rootMargin: "25% 0px" });
  io.observe(el);
  // The observer's first callback is async; if the scene is already on screen
  // at load, that's a visible frame of un-rendered state. Resolve it now.
  s.live = s.top < window.scrollY + vh && s.top + s.height > window.scrollY;
  wake();

  return () => {
    const i = scenes.indexOf(s);
    if (i >= 0) scenes.splice(i, 1);
    io?.unobserve(el);
  };
}

/**
 * Run `cb` every frame the engine is awake — for things that follow the
 * scroll without being tied to a section (nav state, progress rails).
 * Runs under reduced motion too: this drives state, not motion.
 */
export function watch(cb: Watcher): () => void {
  if (typeof window === "undefined") return () => {};
  start();
  watchers.push(cb);
  wake();
  return () => {
    const i = watchers.indexOf(cb);
    if (i >= 0) watchers.splice(i, 1);
  };
}

/** Force a re-measure — after an image loads, or a section changes height. */
export function refresh(): void {
  if (started) remeasure(true);
}
