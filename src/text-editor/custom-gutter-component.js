const etch = require('etch');
const $ = etch.dom;

module.exports = class CustomGutterComponent {
  constructor(props) {
    this.props = props;
    this.element = this.props.element;
    this.virtualNode = $.div(null);
    this.virtualNode.domNode = this.element;
    etch.updateSync(this);
  }

  update(props) {
    this.props = props;
    etch.updateSync(this);
  }

  destroy() {
    etch.destroy(this);
  }

  render() {
    let className = 'gutter';
    if (this.props.className) {
      className += ' ' + this.props.className;
    }
    return $.div(
      {
        className,
        attributes: { 'gutter-name': this.props.name },
        style: {
          display: this.props.visible ? '' : 'none'
        }
      },
      $.div(
        {
          className: 'custom-decorations',
          style: { height: this.props.height + 'px' }
        },
        this.renderDecorations()
      )
    );
  }

  renderDecorations() {
    if (!this.props.decorations) return null;

    return this.props.decorations.map(({ className, element, top, height }) => {
      return $(CustomGutterDecorationComponent, {
        className,
        element,
        top,
        height
      });
    });
  }
}

class CustomGutterDecorationComponent {
  constructor(props) {
    this.props = props;
    this.element = document.createElement('div');
    const { top, height, className, element } = this.props;

    this.element.style.position = 'absolute';
    this.element.style.top = top + 'px';
    this.element.style.height = height + 'px';
    if (className != null) this.element.className = className;
    if (element != null) {
      this.element.appendChild(element);
      element.style.height = height + 'px';
    }
  }

  update(newProps) {
    const oldProps = this.props;
    this.props = newProps;

    if (newProps.top !== oldProps.top)
      this.element.style.top = newProps.top + 'px';
    if (newProps.height !== oldProps.height) {
      this.element.style.height = newProps.height + 'px';
      if (newProps.element)
        newProps.element.style.height = newProps.height + 'px';
    }
    if (newProps.className !== oldProps.className)
      this.element.className = newProps.className || '';
    if (newProps.element !== oldProps.element) {
      if (this.element.firstChild) this.element.firstChild.remove();
      if (newProps.element != null) {
        this.element.appendChild(newProps.element);
        newProps.element.style.height = newProps.height + 'px';
      }
    }
  }
}
