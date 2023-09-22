const etch = require('etch');
const $ = etch.dom;
const LineNumberGutterComponent = require('./line-gutter-component');
const CustomGutterComponent = require('./custom-gutter-component');
const { roundToPhysicalPixelBoundary } = require('./utils');

module.exports = class GutterContainerComponent {
  constructor(props) {
    this.props = props;
    etch.initialize(this);
  }

  update(props) {
    if (this.shouldUpdate(props)) {
      this.props = props;
      etch.updateSync(this);
    }
  }

  shouldUpdate(props) {
    return (
      !props.measuredContent ||
      props.lineNumberGutterWidth !== this.props.lineNumberGutterWidth
    );
  }

  render() {
    const {
      hasInitialMeasurements,
      scrollTop,
      scrollHeight,
      guttersToRender,
      decorationsToRender
    } = this.props;

    const innerStyle = {
      willChange: 'transform',
      display: 'flex'
    };

    if (hasInitialMeasurements) {
      innerStyle.transform = `translateY(${-roundToPhysicalPixelBoundary(
        scrollTop
      )}px)`;
    }

    return $.div(
      {
        ref: 'gutterContainer',
        key: 'gutterContainer',
        className: 'gutter-container',
        style: {
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'inherit'
        }
      },
      $.div(
        { style: innerStyle },
        guttersToRender.map(gutter => {
          if (gutter.type === 'line-number') {
            return this.renderLineNumberGutter(gutter);
          } else {
            return $(CustomGutterComponent, {
              key: gutter,
              element: gutter.getElement(),
              name: gutter.name,
              visible: gutter.isVisible(),
              height: scrollHeight,
              decorations: decorationsToRender.customGutter.get(gutter.name)
            });
          }
        })
      )
    );
  }

  renderLineNumberGutter(gutter) {
    const {
      rootComponent,
      showLineNumbers,
      hasInitialMeasurements,
      lineNumbersToRender,
      renderedStartRow,
      renderedEndRow,
      rowsPerTile,
      decorationsToRender,
      didMeasureVisibleBlockDecoration,
      scrollHeight,
      lineNumberGutterWidth,
      lineHeight
    } = this.props;

    if (!gutter.isVisible()) {
      return null;
    }

    const oneTrueLineNumberGutter = gutter.name === 'line-number';
    const ref = oneTrueLineNumberGutter ? 'lineNumberGutter' : undefined;
    const width = oneTrueLineNumberGutter ? lineNumberGutterWidth : undefined;

    if (hasInitialMeasurements) {
      const {
        maxDigits,
        keys,
        bufferRows,
        screenRows,
        softWrappedFlags,
        foldableFlags
      } = lineNumbersToRender;
      return $(LineNumberGutterComponent, {
        ref,
        element: gutter.getElement(),
        name: gutter.name,
        className: gutter.className,
        labelFn: gutter.labelFn,
        onMouseDown: gutter.onMouseDown,
        onMouseMove: gutter.onMouseMove,
        rootComponent: rootComponent,
        startRow: renderedStartRow,
        endRow: renderedEndRow,
        rowsPerTile: rowsPerTile,
        maxDigits: maxDigits,
        keys: keys,
        bufferRows: bufferRows,
        screenRows: screenRows,
        softWrappedFlags: softWrappedFlags,
        foldableFlags: foldableFlags,
        decorations: decorationsToRender.lineNumbers.get(gutter.name) || [],
        blockDecorations: decorationsToRender.blocks,
        didMeasureVisibleBlockDecoration: didMeasureVisibleBlockDecoration,
        height: scrollHeight,
        width,
        lineHeight: lineHeight,
        showLineNumbers
      });
    } else {
      return $(LineNumberGutterComponent, {
        ref,
        element: gutter.getElement(),
        name: gutter.name,
        className: gutter.className,
        onMouseDown: gutter.onMouseDown,
        onMouseMove: gutter.onMouseMove,
        maxDigits: lineNumbersToRender.maxDigits,
        showLineNumbers
      });
    }
  }
}
