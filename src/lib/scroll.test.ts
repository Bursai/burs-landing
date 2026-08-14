// src/lib/scroll.test.ts
import { describe, it, expect } from "vitest";
import { clamp01, ramp, mix, damp, progress } from "./scroll";

describe("clamp01", () => {
  it("passes values inside the range through", () => {
    expect(clamp01(0.42)).toBe(0.42);
  });
  it("clamps both ends", () => {
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(9)).toBe(1);
  });
});

describe("ramp", () => {
  it("is 0 before the window and 1 after it", () => {
    expect(ramp(0.1, 0.4, 0.6)).toBe(0);
    expect(ramp(0.9, 0.4, 0.6)).toBe(1);
  });
  it("interpolates inside the window", () => {
    expect(ramp(0.5, 0.4, 0.6)).toBeCloseTo(0.5, 6);
  });
  it("does not divide by zero on a zero-width window", () => {
    expect(ramp(0.3, 0.5, 0.5)).toBe(0);
    expect(ramp(0.7, 0.5, 0.5)).toBe(1);
    expect(Number.isNaN(ramp(0.5, 0.5, 0.5))).toBe(false);
  });
});

describe("mix", () => {
  it("interpolates between the endpoints", () => {
    expect(mix(10, 20, 0)).toBe(10);
    expect(mix(10, 20, 1)).toBe(20);
    expect(mix(10, 20, 0.25)).toBe(12.5);
  });
});

describe("damp", () => {
  it("covers exactly half the distance in one half-life", () => {
    expect(damp(0, 1, 100, 100)).toBeCloseTo(0.5, 10);
    expect(damp(0, 1, 100, 200)).toBeCloseTo(0.75, 10);
  });

  it("snaps when the half-life is zero or negative", () => {
    expect(damp(0, 1, 0, 16)).toBe(1);
    expect(damp(0, 1, -5, 16)).toBe(1);
  });

  it("is frame-rate independent", () => {
    // The whole point: 120Hz and 60Hz must land in the same place after the
    // same elapsed time. A naive `x += (t - x) * k` fails this.
    const step = (frames: number, dt: number) => {
      let x = 0;
      for (let i = 0; i < frames; i++) x = damp(x, 1, 90, dt);
      return x;
    };
    const dt60 = 1000 / 60;
    expect(step(120, dt60 / 2)).toBeCloseTo(step(60, dt60), 12);
    expect(step(240, dt60 / 4)).toBeCloseTo(step(60, dt60), 12);
  });

  it("converges toward the target from either side", () => {
    expect(damp(1, 0, 90, 16)).toBeLessThan(1);
    expect(damp(1, 0, 90, 16)).toBeGreaterThan(0);
    expect(damp(-1, 0, 90, 16)).toBeGreaterThan(-1);
  });

  it("never overshoots", () => {
    for (const dt of [1, 16, 64, 1000]) {
      const v = damp(0, 1, 90, dt);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("progress", () => {
  const VH = 800;

  describe("pin", () => {
    // A 4000px section pinned against an 800px viewport has a 3200px runway.
    const p = (y: number) => progress("pin", y, 1000, 4000, VH);

    it("is 0 until the section's top reaches the viewport top", () => {
      expect(p(0)).toBe(0);
      expect(p(1000)).toBe(0);
    });
    it("is 1 once the section's bottom reaches the viewport bottom", () => {
      expect(p(4200)).toBe(1);
      expect(p(9999)).toBe(1);
    });
    it("is half way across the middle of the runway", () => {
      expect(p(1000 + 1600)).toBeCloseTo(0.5, 6);
    });
    it("falls back to the element height when there is no runway", () => {
      // Section shorter than the viewport: still continuous, never NaN.
      const short = progress("pin", 1300, 1000, 400, VH);
      expect(short).toBeCloseTo(0.75, 6);
      expect(Number.isNaN(progress("pin", 1000, 1000, 0, VH))).toBe(false);
    });
  });

  describe("through", () => {
    const p = (y: number) => progress("through", y, 1000, 400, VH);

    it("is 0 as the element is about to enter from below", () => {
      expect(p(200)).toBe(0);
    });
    it("is 1 once the element has left above", () => {
      expect(p(1400)).toBe(1);
    });
    it("crosses 0.5 with the element centred", () => {
      expect(p(800)).toBeCloseTo(0.5, 6);
    });
  });

  describe("exit", () => {
    // A viewport-tall hero at the top of the page.
    const p = (y: number) => progress("exit", y, 0, VH, VH);

    it("is 0 at rest", () => {
      expect(p(0)).toBe(0);
    });
    it("reaches 1 after one element height of scroll", () => {
      expect(p(VH)).toBe(1);
    });
    it("is linear in between", () => {
      expect(p(VH / 4)).toBeCloseTo(0.25, 6);
    });
  });

  it("clamps every range to 0..1", () => {
    for (const range of ["pin", "through", "exit"] as const) {
      for (const y of [-5000, 0, 500, 5000, 50000]) {
        const v = progress(range, y, 1000, 4000, VH);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
