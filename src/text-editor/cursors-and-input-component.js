const etch = require('etch');
const $ = etch.dom;

module.exports = class CursorsAndInputComponent {
  constructor(props) {
    this.props = props;
    etch.initialize(this);
  }

  update(props) {
    if (props.measuredContent) {
      this.props = props;
      etch.updateSync(this);
    }
  }

  updateCursorBlinkSync(cursorsBlinkedOff) {
    this.props.cursorsBlinkedOff = cursorsBlinkedOff;
    const className = this.getCursorsClassName();
    this.refs.cursors.className = className;
    this.virtualNode.props.className = className;
  }

  render() {
    const {
      lineHeight,
      decorationsToRender,
      scrollHeight,
      scrollWidth
    } = this.props;

    const className = this.getCursorsClassName();
    const cursorHeight = lineHeight + 'px';

    const children = [this.renderHiddenInput()];
    for (let i = 0; i < decorationsToRender.cursors.length; i++) {
      const {
        pixelLeft,
        pixelTop,
        pixelWidth,
        className: extraCursorClassName,
        style: extraCursorStyle
      } = decorationsToRender.cursors[i];
      let cursorClassName = 'cursor';
      if (extraCursorClassName) cursorClassName += ' ' + extraCursorClassName;

      const cursorStyle = {
        height: cursorHeight,
        width: Math.min(pixelWidth, scrollWidth - pixelLeft) + 'px',
        transform: `translate(${pixelLeft}px, ${pixelTop}px)`
      };
      if (extraCursorStyle) Object.assign(cursorStyle, extraCursorStyle);

      children.push(
        $.div({
          className: cursorClassName,
          style: cursorStyle
        })
      );
    }

    return $.div(
      {
        key: 'cursors',
        ref: 'cursors',
        className,
        style: {
          position: 'absolute',
          contain: 'strict',
          zIndex: 1,
          width: scrollWidth + 'px',
          height: scrollHeight + 'px',
          pointerEvents: 'none',
          userSelect: 'none'
        }
      },
      children
    );
  }

  getCursorsClassName() {
    return this.props.cursorsBlinkedOff ? 'cursors blink-off' : 'cursors';
  }

  renderHiddenInput() {
    const {
      lineHeight,
      hiddenInputPosition,
      didBlurHiddenInput,
      didFocusHiddenInput,
      didPaste,
      didTextInput,
      didKeydown,
      didKeyup,
      didKeypress,
      didCompositionStart,
      didCompositionUpdate,
      didCompositionEnd,
      tabIndex
    } = this.props;

    let top, left;
    if (hiddenInputPosition) {
      top = hiddenInputPosition.pixelTop;
      left = hiddenInputPosition.pixelLeft;
    } else {
      top = 0;
      left = 0;
    }

    return $.input({
      ref: 'hiddenInput',
      key: 'hiddenInput',
      className: 'hidden-input',
      on: {
        blur: didBlurHiddenInput,
        focus: didFocusHiddenInput,
        paste: didPaste,
        textInput: didTextInput,
        keydown: didKeydown,
        keyup: didKeyup,
        keypress: didKeypress,
        compositionstart: didCompositionStart,
        compositionupdate: didCompositionUpdate,
        compositionend: didCompositionEnd
      },
      tabIndex: tabIndex,
      style: {
        position: 'absolute',
        width: '1px',
        height: lineHeight + 'px',
        top: top + 'px',
        left: left + 'px',
        opacity: 0,
        padding: 0,
        border: 0
      }
    });
  }
}
