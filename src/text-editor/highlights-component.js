const etch = require('etch');
const $ = etch.dom;

module.exports = class HighlightsComponent {
  constructor(props) {
    this.props = {};
    this.element = document.createElement('div');
    this.element.className = 'highlights';
    this.element.style.contain = 'strict';
    this.element.style.position = 'absolute';
    this.element.style.overflow = 'hidden';
    this.element.style.userSelect = 'none';
    this.highlightComponentsByKey = new Map();
    this.update(props);
  }

  destroy() {
    this.highlightComponentsByKey.forEach(highlightComponent => {
      highlightComponent.destroy();
    });
    this.highlightComponentsByKey.clear();
  }

  update(newProps) {
    if (this.shouldUpdate(newProps)) {
      this.props = newProps;
      const { height, width, lineHeight, highlightDecorations } = this.props;

      this.element.style.height = height + 'px';
      this.element.style.width = width + 'px';

      const visibleHighlightDecorations = new Set();
      if (highlightDecorations) {
        for (let i = 0; i < highlightDecorations.length; i++) {
          const highlightDecoration = highlightDecorations[i];
          const highlightProps = Object.assign(
            { lineHeight },
            highlightDecorations[i]
          );

          let highlightComponent = this.highlightComponentsByKey.get(
            highlightDecoration.key
          );
          if (highlightComponent) {
            highlightComponent.update(highlightProps);
          } else {
            highlightComponent = new HighlightComponent(highlightProps);
            this.element.appendChild(highlightComponent.element);
            this.highlightComponentsByKey.set(
              highlightDecoration.key,
              highlightComponent
            );
          }

          highlightDecorations[i].flashRequested = false;
          visibleHighlightDecorations.add(highlightDecoration.key);
        }
      }

      this.highlightComponentsByKey.forEach((highlightComponent, key) => {
        if (!visibleHighlightDecorations.has(key)) {
          highlightComponent.destroy();
          this.highlightComponentsByKey.delete(key);
        }
      });
    }
  }

  shouldUpdate(newProps) {
    const oldProps = this.props;

    if (!newProps.hasInitialMeasurements) return false;

    if (oldProps.width !== newProps.width) return true;
    if (oldProps.height !== newProps.height) return true;
    if (oldProps.lineHeight !== newProps.lineHeight) return true;
    if (!oldProps.highlightDecorations && newProps.highlightDecorations)
      return true;
    if (oldProps.highlightDecorations && !newProps.highlightDecorations)
      return true;
    if (oldProps.highlightDecorations && newProps.highlightDecorations) {
      if (
        oldProps.highlightDecorations.length !==
        newProps.highlightDecorations.length
      )
        return true;

      for (
        let i = 0, length = oldProps.highlightDecorations.length;
        i < length;
        i++
      ) {
        const oldHighlight = oldProps.highlightDecorations[i];
        const newHighlight = newProps.highlightDecorations[i];
        if (oldHighlight.className !== newHighlight.className) return true;
        if (newHighlight.flashRequested) return true;
        if (oldHighlight.startPixelTop !== newHighlight.startPixelTop)
          return true;
        if (oldHighlight.startPixelLeft !== newHighlight.startPixelLeft)
          return true;
        if (oldHighlight.endPixelTop !== newHighlight.endPixelTop) return true;
        if (oldHighlight.endPixelLeft !== newHighlight.endPixelLeft)
          return true;
        if (!oldHighlight.screenRange.isEqual(newHighlight.screenRange))
          return true;
      }
    }
  }
}

class HighlightComponent {
  constructor(props) {
    this.props = props;
    etch.initialize(this);
    if (this.props.flashRequested) this.performFlash();
  }

  destroy() {
    if (this.timeoutsByClassName) {
      this.timeoutsByClassName.forEach(timeout => {
        window.clearTimeout(timeout);
      });
      this.timeoutsByClassName.clear();
    }

    return etch.destroy(this);
  }

  update(newProps) {
    this.props = newProps;
    etch.updateSync(this);
    if (newProps.flashRequested) this.performFlash();
  }

  performFlash() {
    const { flashClass, flashDuration } = this.props;
    if (!this.timeoutsByClassName) this.timeoutsByClassName = new Map();

    // If a flash of this class is already in progress, clear it early and
    // flash again on the next frame to ensure CSS transitions apply to the
    // second flash.
    if (this.timeoutsByClassName.has(flashClass)) {
      window.clearTimeout(this.timeoutsByClassName.get(flashClass));
      this.timeoutsByClassName.delete(flashClass);
      this.element.classList.remove(flashClass);
      requestAnimationFrame(() => this.performFlash());
    } else {
      this.element.classList.add(flashClass);
      this.timeoutsByClassName.set(
        flashClass,
        window.setTimeout(() => {
          this.element.classList.remove(flashClass);
        }, flashDuration)
      );
    }
  }

  render() {
    const {
      className,
      screenRange,
      lineHeight,
      startPixelTop,
      startPixelLeft,
      endPixelTop,
      endPixelLeft
    } = this.props;
    const regionClassName = 'region ' + className;

    let children;
    if (screenRange.start.row === screenRange.end.row) {
      children = $.div({
        className: regionClassName,
        style: {
          position: 'absolute',
          boxSizing: 'border-box',
          top: startPixelTop + 'px',
          left: startPixelLeft + 'px',
          width: endPixelLeft - startPixelLeft + 'px',
          height: lineHeight + 'px'
        }
      });
    } else {
      children = [];
      children.push(
        $.div({
          className: regionClassName,
          style: {
            position: 'absolute',
            boxSizing: 'border-box',
            top: startPixelTop + 'px',
            left: startPixelLeft + 'px',
            right: 0,
            height: lineHeight + 'px'
          }
        })
      );

      if (screenRange.end.row - screenRange.start.row > 1) {
        children.push(
          $.div({
            className: regionClassName,
            style: {
              position: 'absolute',
              boxSizing: 'border-box',
              top: startPixelTop + lineHeight + 'px',
              left: 0,
              right: 0,
              height: endPixelTop - startPixelTop - lineHeight * 2 + 'px'
            }
          })
        );
      }

      if (endPixelLeft > 0) {
        children.push(
          $.div({
            className: regionClassName,
            style: {
              position: 'absolute',
              boxSizing: 'border-box',
              top: endPixelTop - lineHeight + 'px',
              left: 0,
              width: endPixelLeft + 'px',
              height: lineHeight + 'px'
            }
          })
        );
      }
    }

    return $.div({ className: 'highlight ' + className }, children);
  }
}
