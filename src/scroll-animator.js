const COMPLETION_THRESHOLD = 0.01; // px
const FRAME_DURATION = 1000 / 60;
const MAX_FRAME_RATIO = 6;

// Computes how far a pending scroll distance should advance this frame.
// Exponential approach toward the target, normalized against a 60fps frame so
// the glide speed is independent of the actual frame rate. Returns the full
// pending distance once it (or the computed step) falls below the completion
// threshold, which guarantees the animation terminates exactly on target.
function calculateTimeBasedStep(pending, smoothness, elapsed) {
  if (pending === 0 || Math.abs(pending) < COMPLETION_THRESHOLD) return pending;
  if (smoothness <= 1) return pending;
  if (elapsed <= 0) return 0;
  const frameRatio = Math.min(Math.max(elapsed / FRAME_DURATION, 0), MAX_FRAME_RATIO);
  const frameFactor = Math.min(1, 2 / smoothness);
  const step = pending * (1 - Math.pow(1 - frameFactor, frameRatio));
  if (Math.abs(step) < COMPLETION_THRESHOLD) return pending;
  return step;
}

// Animates the scroll position of a TextEditorComponent toward a target via
// requestAnimationFrame. Positions are tracked in float space independently of
// the component's physical-pixel-rounded scrollTop/scrollLeft; convergence is
// always tested against the float state so rounding can't stall the glide.
class ScrollAnimator {
  constructor(component, { requestAnimationFrame, cancelAnimationFrame } = {}) {
    this.component = component;
    this.raf = requestAnimationFrame || ((callback) => window.requestAnimationFrame(callback));
    this.caf = cancelAnimationFrame || ((handle) => window.cancelAnimationFrame(handle));
    this.animating = false;
    this.frameHandle = null;
    this.lastFrameTime = null;
    this.smoothness = 1;
    this.targetScrollTop = 0;
    this.targetScrollLeft = 0;
    this.virtualScrollTop = 0;
    this.virtualScrollLeft = 0;
    // While true, component.setScrollTop/Left calls originate from our own
    // frame and must not trigger cancellation.
    this.applyingFrame = false;
    this.step = this.step.bind(this);
  }

  isAnimating() {
    return this.animating;
  }

  // Requests a scroll by a relative distance. Returns whether the request was
  // accepted: a request is rejected when idle and no axis has room to move in
  // the requested direction, so wheel events can chain to outer containers.
  // `reset: true` restarts the glide from the current scroll position instead
  // of extending the previous target.
  scrollBy({ x = 0, y = 0, smoothness, reset = false } = {}) {
    if (reset || !this.animating) this.syncToComponent();
    return this.requestScroll(x, y, smoothness);
  }

  // Absolute variant of scrollBy; `top`/`left` may each be omitted.
  scrollTo({ top, left, smoothness, reset = false } = {}) {
    if (reset || !this.animating) this.syncToComponent();
    const x = left != null ? left - this.targetScrollLeft : 0;
    const y = top != null ? top - this.targetScrollTop : 0;
    return this.requestScroll(x, y, smoothness);
  }

  // Stops the animation without moving the scroll position and without
  // scheduling any further frames.
  cancel() {
    if (this.frameHandle != null) {
      this.caf(this.frameHandle);
      this.frameHandle = null;
    }
    this.lastFrameTime = null;
    const wasAnimating = this.animating;
    this.animating = false;
    this.syncToComponent();
    if (wasAnimating) this.component.element.emitter.emit("did-end-scroll-animation");
  }

  requestScroll(x, y, smoothness) {
    if (!this.animating && !this.canScrollBy(x, y)) return false;
    if (smoothness != null) this.smoothness = smoothness;
    this.targetScrollLeft = clamp(this.targetScrollLeft + x, 0, this.component.getMaxScrollLeft());
    this.targetScrollTop = clamp(this.targetScrollTop + y, 0, this.component.getMaxScrollTop());
    if (this.pendingX() === 0 && this.pendingY() === 0) return false;
    this.start();
    return true;
  }

  canScrollBy(x, y) {
    return (
      (x < 0 && this.component.getScrollLeft() > 0) ||
      (x > 0 && this.component.getScrollLeft() < this.component.getMaxScrollLeft()) ||
      (y < 0 && this.component.getScrollTop() > 0) ||
      (y > 0 && this.component.getScrollTop() < this.component.getMaxScrollTop())
    );
  }

  syncToComponent() {
    this.targetScrollTop = this.virtualScrollTop = this.component.getScrollTop();
    this.targetScrollLeft = this.virtualScrollLeft = this.component.getScrollLeft();
  }

  start() {
    if (this.animating) return;
    this.animating = true;
    this.lastFrameTime = null;
    this.component.element.emitter.emit("did-start-scroll-animation");
    this.frameHandle = this.raf(this.step);
  }

  step(timestamp) {
    const elapsed = this.lastFrameTime == null ? FRAME_DURATION : timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    this.advance(elapsed);
  }

  // Advances the animation by the given elapsed milliseconds. Separated from
  // step() so specs can drive the animation deterministically.
  advance(elapsed) {
    if (!this.animating) return;
    this.frameHandle = null;

    // A reflow mid-glide can shrink the scrollable area; re-clamp so the glide
    // never targets or occupies a position past the end.
    const maxScrollTop = this.component.getMaxScrollTop();
    const maxScrollLeft = this.component.getMaxScrollLeft();
    this.targetScrollTop = clamp(this.targetScrollTop, 0, maxScrollTop);
    this.targetScrollLeft = clamp(this.targetScrollLeft, 0, maxScrollLeft);
    const previousVirtualScrollTop = this.virtualScrollTop;
    const previousVirtualScrollLeft = this.virtualScrollLeft;
    this.virtualScrollTop = clamp(this.virtualScrollTop, 0, maxScrollTop);
    this.virtualScrollLeft = clamp(this.virtualScrollLeft, 0, maxScrollLeft);

    this.virtualScrollTop += calculateTimeBasedStep(this.pendingY(), this.smoothness, elapsed);
    this.virtualScrollLeft += calculateTimeBasedStep(this.pendingX(), this.smoothness, elapsed);

    // The clamp alone may have moved the virtual position, so movement is
    // detected on the position rather than the step.
    this.applyingFrame = true;
    const changedY =
      this.virtualScrollTop !== previousVirtualScrollTop &&
      this.component.setScrollTop(this.virtualScrollTop);
    const changedX =
      this.virtualScrollLeft !== previousVirtualScrollLeft &&
      this.component.setScrollLeft(this.virtualScrollLeft);
    // Cleared before updateSync: scrolls performed inside the update
    // (autoscroll, anchor restore) are external takeovers and must cancel us.
    this.applyingFrame = false;
    if (changedX || changedY) this.component.updateSync();
    if (!this.animating) return;

    if (
      Math.abs(this.pendingX()) >= COMPLETION_THRESHOLD ||
      Math.abs(this.pendingY()) >= COMPLETION_THRESHOLD
    ) {
      this.frameHandle = this.raf(this.step);
    } else {
      this.animating = false;
      this.lastFrameTime = null;
      // Absorb the residue between the float virtual position and the
      // component's physical-pixel-rounded scroll position.
      this.syncToComponent();
      this.component.element.emitter.emit("did-end-scroll-animation");
    }
  }

  pendingY() {
    return this.targetScrollTop - this.virtualScrollTop;
  }

  pendingX() {
    return this.targetScrollLeft - this.virtualScrollLeft;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

ScrollAnimator.calculateTimeBasedStep = calculateTimeBasedStep;
module.exports = ScrollAnimator;
