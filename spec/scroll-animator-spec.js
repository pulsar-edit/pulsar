const { Emitter } = require("event-kit");
const ScrollAnimator = require("../src/scroll-animator");
const { calculateTimeBasedStep } = ScrollAnimator;

const FRAME = 1000 / 60;

describe("ScrollAnimator", () => {
  describe("calculateTimeBasedStep", () => {
    it("returns the full pending distance below the completion threshold", () => {
      expect(calculateTimeBasedStep(0, 8, FRAME)).toBe(0);
      expect(calculateTimeBasedStep(0.005, 8, FRAME)).toBe(0.005);
      expect(calculateTimeBasedStep(-0.005, 8, FRAME)).toBe(-0.005);
    });

    it("returns the full pending distance when smoothness is 1 or less", () => {
      expect(calculateTimeBasedStep(100, 1, FRAME)).toBe(100);
      expect(calculateTimeBasedStep(-42, 0.5, FRAME)).toBe(-42);
    });

    it("advances by an exponential fraction of the pending distance", () => {
      // frameFactor = 2/8 = 0.25; one 60fps frame => step = pending * 0.25
      expect(calculateTimeBasedStep(100, 8, FRAME)).toBeCloseTo(25, 6);
      expect(calculateTimeBasedStep(-100, 8, FRAME)).toBeCloseTo(-25, 6);
    });

    it("scales the step with elapsed time", () => {
      // two 60fps frames => 1 - 0.75^2 = 0.4375
      expect(calculateTimeBasedStep(100, 8, 2 * FRAME)).toBeCloseTo(43.75, 6);
    });

    it("clamps the frame ratio to avoid huge jumps after a stall", () => {
      const cappedStep = calculateTimeBasedStep(100, 8, 6 * FRAME);
      expect(calculateTimeBasedStep(100, 8, 5000)).toBeCloseTo(cappedStep, 6);
      expect(calculateTimeBasedStep(100, 8, -50)).toBe(0);
    });

    it("returns the full pending distance when the computed step is negligible", () => {
      // pending 0.02 at smoothness 50 => step 0.0008, below the threshold
      expect(calculateTimeBasedStep(0.02, 50, FRAME)).toBe(0.02);
    });
  });

  describe("animation against a component", () => {
    let component, animator, rafCallbacks, canceledHandles;

    function buildMockComponent() {
      return {
        scrollTop: 0,
        scrollLeft: 0,
        maxScrollTop: 1000,
        maxScrollLeft: 500,
        updateSyncCount: 0,
        element: { emitter: new Emitter() },
        getScrollTop() {
          return this.scrollTop;
        },
        getScrollLeft() {
          return this.scrollLeft;
        },
        getMaxScrollTop() {
          return this.maxScrollTop;
        },
        getMaxScrollLeft() {
          return this.maxScrollLeft;
        },
        // Mirrors the real component: clamps, rounds to a pixel boundary, and
        // reports whether the position changed.
        setScrollTop(value) {
          value = Math.ceil(Math.max(0, Math.min(this.maxScrollTop, value)));
          if (value === this.scrollTop) return false;
          this.scrollTop = value;
          return true;
        },
        setScrollLeft(value) {
          value = Math.round(Math.max(0, Math.min(this.maxScrollLeft, value)));
          if (value === this.scrollLeft) return false;
          this.scrollLeft = value;
          return true;
        },
        updateSync() {
          this.updateSyncCount++;
        },
      };
    }

    function runUntilDone(maxFrames = 1000) {
      let frames = 0;
      while (animator.isAnimating() && frames < maxFrames) {
        animator.advance(FRAME);
        frames++;
      }
      expect(animator.isAnimating()).toBe(false);
      return frames;
    }

    beforeEach(() => {
      component = buildMockComponent();
      rafCallbacks = [];
      canceledHandles = [];
      animator = new ScrollAnimator(component, {
        requestAnimationFrame: (callback) => rafCallbacks.push(callback),
        cancelAnimationFrame: (handle) => canceledHandles.push(handle),
      });
    });

    it("glides to the requested position and lands exactly on target", () => {
      expect(animator.scrollBy({ y: 100, smoothness: 8 })).toBe(true);
      expect(animator.isAnimating()).toBe(true);
      expect(component.scrollTop).toBe(0);

      const frames = runUntilDone();
      expect(frames).toBeGreaterThan(1);
      expect(component.scrollTop).toBe(100);
      expect(animator.targetScrollTop).toBe(100);
      expect(component.updateSyncCount).toBeGreaterThan(0);
    });

    it("approaches the target monotonically", () => {
      animator.scrollBy({ y: 200, smoothness: 8 });
      let previous = component.scrollTop;
      while (animator.isAnimating()) {
        animator.advance(FRAME);
        expect(component.scrollTop).toBeGreaterThanOrEqual(previous);
        expect(component.scrollTop).toBeLessThanOrEqual(200);
        previous = component.scrollTop;
      }
      expect(component.scrollTop).toBe(200);
    });

    it("animates both axes simultaneously", () => {
      animator.scrollBy({ x: 60, y: 90, smoothness: 8 });
      runUntilDone();
      expect(component.scrollLeft).toBe(60);
      expect(component.scrollTop).toBe(90);
    });

    it("rejects requests that cannot scroll in the requested direction", () => {
      expect(animator.scrollBy({ y: -10, smoothness: 8 })).toBe(false);
      expect(animator.isAnimating()).toBe(false);

      component.scrollTop = component.maxScrollTop;
      expect(animator.scrollBy({ y: 10, smoothness: 8 })).toBe(false);

      // Room on the other axis is enough to accept the request.
      expect(animator.scrollBy({ x: 10, y: 10, smoothness: 8 })).toBe(true);
    });

    it("accumulates targets across requests while animating", () => {
      animator.scrollBy({ y: 100, smoothness: 8 });
      animator.advance(FRAME);
      expect(animator.scrollBy({ y: 100, smoothness: 8 })).toBe(true);
      expect(animator.targetScrollTop).toBe(200);
      runUntilDone();
      expect(component.scrollTop).toBe(200);
    });

    it("keeps accepting requests at the edge while a glide is active", () => {
      animator.scrollBy({ y: component.maxScrollTop, smoothness: 8 });
      animator.advance(FRAME);
      expect(animator.scrollBy({ y: 50, smoothness: 8 })).toBe(true);
      expect(animator.targetScrollTop).toBe(component.maxScrollTop);
    });

    it("restarts from the current position when reset is true", () => {
      animator.scrollBy({ y: 400, smoothness: 8 });
      animator.advance(FRAME);
      const positionAtReset = component.scrollTop;
      animator.scrollBy({ y: 100, smoothness: 8, reset: true });
      expect(animator.targetScrollTop).toBeCloseTo(positionAtReset + 100, 6);
      runUntilDone();
      expect(component.scrollTop).toBe(positionAtReset + 100);
    });

    it("re-clamps the target when the scrollable area shrinks mid-glide", () => {
      animator.scrollBy({ y: 800, smoothness: 8 });
      animator.advance(FRAME);
      component.maxScrollTop = 100;
      runUntilDone();
      expect(component.scrollTop).toBeLessThanOrEqual(100);
      expect(animator.targetScrollTop).toBeLessThanOrEqual(100);
    });

    it("supports absolute targets via scrollTo", () => {
      component.scrollTop = 300;
      expect(animator.scrollTo({ top: 100, smoothness: 8 })).toBe(true);
      runUntilDone();
      expect(component.scrollTop).toBe(100);
    });

    it("stops without moving when cancelled and ignores further frames", () => {
      animator.scrollBy({ y: 300, smoothness: 8 });
      animator.advance(FRAME);
      const positionAtCancel = component.scrollTop;

      animator.cancel();
      expect(animator.isAnimating()).toBe(false);
      expect(component.scrollTop).toBe(positionAtCancel);
      expect(animator.targetScrollTop).toBe(positionAtCancel);

      animator.advance(FRAME);
      expect(component.scrollTop).toBe(positionAtCancel);
    });

    it("cancels the scheduled animation frame on cancel", () => {
      animator.scrollBy({ y: 300, smoothness: 8 });
      expect(rafCallbacks.length).toBe(1);
      animator.cancel();
      expect(canceledHandles.length).toBe(1);
    });

    describe("events", () => {
      let started, ended;

      beforeEach(() => {
        started = 0;
        ended = 0;
        component.element.emitter.on("did-start-scroll-animation", () => started++);
        component.element.emitter.on("did-end-scroll-animation", () => ended++);
      });

      it("emits start and end exactly once per glide", () => {
        animator.scrollBy({ y: 100, smoothness: 8 });
        expect(started).toBe(1);
        expect(ended).toBe(0);

        // Additional requests during the glide don't re-emit start.
        animator.scrollBy({ y: 50, smoothness: 8 });
        expect(started).toBe(1);

        runUntilDone();
        expect(ended).toBe(1);
      });

      it("emits end when cancelled mid-glide, and not when already idle", () => {
        animator.scrollBy({ y: 100, smoothness: 8 });
        animator.cancel();
        expect(ended).toBe(1);
        animator.cancel();
        expect(ended).toBe(1);
      });
    });
  });
});
