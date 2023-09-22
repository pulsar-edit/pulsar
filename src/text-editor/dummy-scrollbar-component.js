const etch = require('etch');
const $ = etch.dom;

module.exports = class DummyScrollbarComponent {
  constructor(props) {
    this.props = props;
    etch.initialize(this);
  }

  update(newProps) {
    const oldProps = this.props;
    this.props = newProps;
    etch.updateSync(this);

    const shouldFlushScrollPosition =
      newProps.scrollTop !== oldProps.scrollTop ||
      newProps.scrollLeft !== oldProps.scrollLeft;
    if (shouldFlushScrollPosition) this.flushScrollPosition();
  }

  flushScrollPosition() {
    if (this.props.orientation === 'horizontal') {
      this.element.scrollLeft = this.props.scrollLeft;
    } else {
      this.element.scrollTop = this.props.scrollTop;
    }
  }

  render() {
    const {
      orientation,
      scrollWidth,
      scrollHeight,
      verticalScrollbarWidth,
      horizontalScrollbarHeight,
      canScroll,
      forceScrollbarVisible,
      didScroll
    } = this.props;

    const outerStyle = {
      position: 'absolute',
      contain: 'content',
      zIndex: 1,
      willChange: 'transform'
    };
    if (!canScroll) outerStyle.visibility = 'hidden';

    const innerStyle = {};
    if (orientation === 'horizontal') {
      let right = verticalScrollbarWidth || 0;
      outerStyle.bottom = 0;
      outerStyle.left = 0;
      outerStyle.right = right + 'px';
      outerStyle.height = '15px';
      outerStyle.overflowY = 'hidden';
      outerStyle.overflowX = forceScrollbarVisible ? 'scroll' : 'auto';
      outerStyle.cursor = 'default';
      innerStyle.height = '15px';
      innerStyle.width = (scrollWidth || 0) + 'px';
    } else {
      let bottom = horizontalScrollbarHeight || 0;
      outerStyle.right = 0;
      outerStyle.top = 0;
      outerStyle.bottom = bottom + 'px';
      outerStyle.width = '15px';
      outerStyle.overflowX = 'hidden';
      outerStyle.overflowY = forceScrollbarVisible ? 'scroll' : 'auto';
      outerStyle.cursor = 'default';
      innerStyle.width = '15px';
      innerStyle.height = (scrollHeight || 0) + 'px';
    }

    return $.div(
      {
        className: `${orientation}-scrollbar`,
        style: outerStyle,
        on: {
          scroll: didScroll,
          mousedown: this.didMouseDown
        }
      },
      $.div({ style: innerStyle })
    );
  }

  didMouseDown(event) {
    let { bottom, right } = this.element.getBoundingClientRect();
    const clickedOnScrollbar =
      this.props.orientation === 'horizontal'
        ? event.clientY >= bottom - this.getRealScrollbarHeight()
        : event.clientX >= right - this.getRealScrollbarWidth();
    if (!clickedOnScrollbar) this.props.didMouseDown(event);
  }

  getRealScrollbarWidth() {
    return this.element.offsetWidth - this.element.clientWidth;
  }

  getRealScrollbarHeight() {
    return this.element.offsetHeight - this.element.clientHeight;
  }
}
