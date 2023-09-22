const etch = require('etch');
const $ = etch.dom;

module.exports = class LineNumberComponent {
  constructor(props) {
    const {
      className,
      width,
      marginTop,
      bufferRow,
      screenRow,
      number,
      nodePool
    } = props;
    this.props = props;
    const style = {};
    if (width != null && width > 0) style.width = width + 'px';
    if (marginTop != null && marginTop > 0) style.marginTop = marginTop + 'px';
    this.element = nodePool.getElement('DIV', className, style);
    this.element.dataset.bufferRow = bufferRow;
    this.element.dataset.screenRow = screenRow;
    if (number) this.element.appendChild(nodePool.getTextNode(number));
    this.element.appendChild(nodePool.getElement('DIV', 'icon-right', null));
  }

  destroy() {
    this.element.remove();
    this.props.nodePool.release(this.element);
  }

  update(props) {
    const {
      nodePool,
      className,
      width,
      marginTop,
      bufferRow,
      screenRow,
      number
    } = props;

    if (this.props.bufferRow !== bufferRow)
      this.element.dataset.bufferRow = bufferRow;
    if (this.props.screenRow !== screenRow)
      this.element.dataset.screenRow = screenRow;
    if (this.props.className !== className) this.element.className = className;
    if (this.props.width !== width) {
      if (width != null && width > 0) {
        this.element.style.width = width + 'px';
      } else {
        this.element.style.width = '';
      }
    }
    if (this.props.marginTop !== marginTop) {
      if (marginTop != null && marginTop > 0) {
        this.element.style.marginTop = marginTop + 'px';
      } else {
        this.element.style.marginTop = '';
      }
    }

    if (this.props.number !== number) {
      if (this.props.number != null) {
        const numberNode = this.element.firstChild;
        numberNode.remove();
        nodePool.release(numberNode);
      }

      if (number != null) {
        this.element.insertBefore(
          nodePool.getTextNode(number),
          this.element.firstChild
        );
      }
    }

    this.props = props;
  }
}
