# The scroll engine

`src/lib/scroll.ts` — one scroll listener, one rAF loop, one measurement
cache for the whole page. Every scroll-driven scene on the home page runs
through it.

## Why not a smooth-scroll library

The obvious move for "make the scroll feel expensive" is Lenis or Locomotive.
Both work by **hijacking the scroll**: they cancel the browser's scroll and
re-drive `scrollTo` from their own eased value each frame. That buys fluidity
and costs a lot:

- Keyboard paging, `find-in-page`, scrollbar dragging and native momentum all
  route through the fake scroller and get worse or break.
- Safari is capped to 60fps under this approach, and 30fps in low-power mode.
- It misbehaves over iframes, and lags `position: fixed` on older macOS Safari.
- Screen readers and "scroll to focused element" fight the interception.

So this engine does the opposite trick: **keep the browser's scroll exactly as
it is, and damp the animation progress instead.** A scene's progress value
eases toward whatever the real scroll position implies. The page scrolls
natively; only the choreography is smoothed. A trackpad — already continuous —
is untouched. A mouse wheel, which arrives as ~100px steps, stops stepping the
animation with it.

That single decision is where most of the perceived quality comes from.

## The four rules it enforces

**1. Measure out of band.** Section geometry is read on load, on
`document.fonts.ready`, and on width change — never during a scroll. Scenes
with their own measurements (child offsets, canvas size) get a `measure` hook
called at the same moments. A frame therefore performs exactly one
layout-adjacent read (`window.scrollY`) no matter how many scenes are running.

Before this, each of the six scroll systems ran `getBoundingClientRect()` +
`offsetHeight` per frame, and `WeekReel` additionally read `offsetLeft` /
`offsetWidth` off two cards on every frame — reads interleaved with writes,
which is the textbook layout-thrash shape.

**2. Damp, frame-rate independently.** The common `x += (target - x) * 0.1`
runs twice as fast on a 120Hz display as on a 60Hz one. `damp()` is expressed
as a **half-life in milliseconds** — half the remaining distance every `half`
ms — so motion is identical on every device. Half-lives in use:

| Scene | half-life | why |
|---|---|---|
| Hero handoff | 70ms | short move, wants to feel attached to the scroll |
| The scan | 80ms | fine line-work; too much lag reads as sludge |
| Mark seal | 85ms | 100-frame sequence — damping is what makes it a stitch, not a slideshow |
| Ask / talk / real | 90–95ms | mostly fades, tolerant of lag |
| Week reel | 110ms | longest single move on the page; a wheel notch would otherwise jump most of a card |

A progress jump larger than `JUMP` (0.34) is treated as a teleport — anchor
link, scroll restoration, first paint — and snaps instead of easing.

**3. Only run what's visible, only run when moving.** Scenes are gated by an
`IntersectionObserver` and resolved to their exit edge when they leave, so
returning to one from either direction finds it in the right state. The loop
stops itself once every scene has settled: a parked page does zero work.
(Verified: 0 style writes in 400ms at rest.)

**4. Write-only renders.** A `render` callback receives everything it needs on
its `Frame` and must only write — transforms, opacity, custom properties. No
reads, so no read/write interleaving is possible by construction.

## Using it

```ts
import { scene, ramp, watch } from "../lib/scroll";

scene(document.querySelector('[data-thing]'), ({ p, raw, v }) => {
  el.style.setProperty('--draw', ramp(p, 0.2, 0.8).toFixed(3));
}, {
  range: 'pin',            // 'pin' | 'through' | 'exit'
  damp: 90,                // half-life in ms; 0 locks 1:1 to scroll
  measure: () => { … },    // re-read this scene's own layout
});

watch((scrollY, velocity) => { … });   // scroll-following state, not motion
```

`range` picks how the runway maps to 0..1:

- `pin` — a tall section with a sticky stage. 0 when its top reaches the
  viewport top, 1 when its bottom reaches the viewport bottom.
- `through` — 0 as the element enters from below, 1 as it leaves above.
- `exit` — 0 at rest, 1 once a full element height has scrolled past. For
  viewport-tall heroes.

`Frame` also carries `raw` (undamped — use where a value must land exactly on
a scroll position) and `v` (eased, signed scroll velocity normalised to
roughly -1..1).

## Accessibility and fallbacks

- **Reduced motion:** `scene()` is a no-op, so the static CSS fallback in each
  component is what renders. `watch()` still runs — it drives state, not motion.
- **No JS:** unchanged; each component keeps its `<noscript>` block collapsing
  the runways into a plain page.
- **Touch viewports:** `innerHeight` flickers as browser chrome shows and
  hides. Section runways are sized in `vh`, which does not move with it, so the
  engine tracks height only when the width moves too — otherwise every scene
  would jolt for a layout change that never happened.

## One rule for component CSS

If the engine scrubs a property, **that property must not be transitioned.**
A 550ms `transition: transform` on a value rewritten every frame lags behind
the scroll instead of following it. `WeekReel`'s day cards had exactly this
bug: the focus scale/opacity was a class flip on a 550ms ease, so a card could
still be easing into focus while the scroll had already carried it out. Those
two properties are now scrubbed continuously; the discrete treatment that
remains (border, background, shadow, the "worn" tick) still transitions,
because it flips between states rather than tracking the scroll.

## Measured

A 167-frame sweep of the whole home page at 1280×800 (Chrome CDP counters):

| | forced layouts | p95 frame | at rest |
|---|---|---|---|
| before | 0–11 per sweep | 16.9ms | — |
| after | **0** | 16.9ms | **0 writes** |

Both are 60fps-locked in this harness — the page was not slow before. What
changed is that forced layouts are gone by construction, the page costs
nothing when parked, and the motion is continuous instead of stepping with the
wheel. Style-recalc cost rose slightly (~7–11ms across the whole sweep, about
0.06ms/frame) because the week reel now scrubs its cards continuously rather
than flipping a class — that is the fix, not a regression.

Lighthouse assertions (`npm run test:lh`) still pass: performance,
accessibility and best-practices ≥ 0.95, SEO 1.0.

## Reference

- [Lenis](https://github.com/darkroomengineering/lenis) — smooth-scroll
  internals and its documented caveats (Safari fps caps, iframes, iOS touch).
- [MDN: CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
  and [Josh Comeau's guide](https://www.joshwcomeau.com/animation/scroll-driven-animations/)
  — `animation-timeline: scroll()/view()` runs on the compositor and is the
  right tool for scenes expressible as a single CSS animation. It cannot
  express these scenes (canvas frame selection, per-item choreography, derived
  text), and support is ~84%, so the engine stays in JS; individual simple
  reveals could migrate later.
- [Codrops: Sticky Grid Scroll](https://tympanus.net/codrops/2026/03/02/sticky-grid-scroll-building-a-scroll-driven-animated-grid/)
  — pinned-section progress patterns.
