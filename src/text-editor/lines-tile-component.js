const etch = require('etch');
const $ = etch.dom;
const {
  arraysEqual
} = require('./utils');


const ZERO_WIDTH_NBSP_CHARACTER = '\ufeff';
module.exports = class LinesTileComponent {
  constructor(props) {
    this.props = props;
    etch.initialize(this);
    this.createLines();
    this.updateBlockDecorations({}, props);
  }

  update(newProps) {
    if (this.shouldUpdate(newProps)) {
      const oldProps = this.props;
      this.props = newProps;
      etch.updateSync(this);
      if (!newProps.measuredContent) {
        this.updateLines(oldProps, newProps);
        this.updateBlockDecorations(oldProps, newProps);
      }
    }
  }

  destroy() {
    for (let i = 0; i < this.lineComponents.length; i++) {
      this.lineComponents[i].destroy();
    }
    this.lineComponents.length = 0;

    return etch.destroy(this);
  }

  render() {
    const { height, width, top } = this.props;

    return $.div(
      {
        style: {
          contain: 'layout style',
          position: 'absolute',
          height: height + 'px',
          width: width + 'px',
          transform: `translateY(${top}px)`
        }
      }
      // Lines and block decorations will be manually inserted here for efficiency
    );
  }

  createLines() {
    const {
      tileStartRow,
      screenLines,
      lineDecorations,
      textDecorations,
      nodePool,
      displayLayer,
      lineComponentsByScreenLineId
    } = this.props;

    this.lineComponents = [];
    for (let i = 0, length = screenLines.length; i < length; i++) {
      const component = new LineComponent({
        screenLine: screenLines[i],
        screenRow: tileStartRow + i,
        lineDecoration: lineDecorations[i],
        textDecorations: textDecorations[i],
        displayLayer,
        nodePool,
        lineComponentsByScreenLineId
      });
      this.element.appendChild(component.element);
      this.lineComponents.push(component);
    }
  }

  updateLines(oldProps, newProps) {
    const {
      screenLines,
      tileStartRow,
      lineDecorations,
      textDecorations,
      nodePool,
      displayLayer,
      lineComponentsByScreenLineId
    } = newProps;

    const oldScreenLines = oldProps.screenLines;
    const newScreenLines = screenLines;
    const oldScreenLinesEndIndex = oldScreenLines.length;
    const newScreenLinesEndIndex = newScreenLines.length;
    let oldScreenLineIndex = 0;
    let newScreenLineIndex = 0;
    let lineComponentIndex = 0;

    while (
      oldScreenLineIndex < oldScreenLinesEndIndex ||
      newScreenLineIndex < newScreenLinesEndIndex
    ) {
      const oldScreenLine = oldScreenLines[oldScreenLineIndex];
      const newScreenLine = newScreenLines[newScreenLineIndex];

      if (oldScreenLineIndex >= oldScreenLinesEndIndex) {
        var newScreenLineComponent = new LineComponent({
          screenLine: newScreenLine,
          screenRow: tileStartRow + newScreenLineIndex,
          lineDecoration: lineDecorations[newScreenLineIndex],
          textDecorations: textDecorations[newScreenLineIndex],
          displayLayer,
          nodePool,
          lineComponentsByScreenLineId
        });
        this.element.appendChild(newScreenLineComponent.element);
        this.lineComponents.push(newScreenLineComponent);

        newScreenLineIndex++;
        lineComponentIndex++;
      } else if (newScreenLineIndex >= newScreenLinesEndIndex) {
        this.lineComponents[lineComponentIndex].destroy();
        this.lineComponents.splice(lineComponentIndex, 1);

        oldScreenLineIndex++;
      } else if (oldScreenLine === newScreenLine) {
        const lineComponent = this.lineComponents[lineComponentIndex];
        lineComponent.update({
          screenRow: tileStartRow + newScreenLineIndex,
          lineDecoration: lineDecorations[newScreenLineIndex],
          textDecorations: textDecorations[newScreenLineIndex]
        });

        oldScreenLineIndex++;
        newScreenLineIndex++;
        lineComponentIndex++;
      } else {
        const oldScreenLineIndexInNewScreenLines = newScreenLines.indexOf(
          oldScreenLine
        );
        const newScreenLineIndexInOldScreenLines = oldScreenLines.indexOf(
          newScreenLine
        );
        if (
          newScreenLineIndex < oldScreenLineIndexInNewScreenLines &&
          oldScreenLineIndexInNewScreenLines < newScreenLinesEndIndex
        ) {
          const newScreenLineComponents = [];
          while (newScreenLineIndex < oldScreenLineIndexInNewScreenLines) {
            // eslint-disable-next-line no-redeclare
            var newScreenLineComponent = new LineComponent({
              screenLine: newScreenLines[newScreenLineIndex],
              screenRow: tileStartRow + newScreenLineIndex,
              lineDecoration: lineDecorations[newScreenLineIndex],
              textDecorations: textDecorations[newScreenLineIndex],
              displayLayer,
              nodePool,
              lineComponentsByScreenLineId
            });
            this.element.insertBefore(
              newScreenLineComponent.element,
              this.getFirstElementForScreenLine(oldProps, oldScreenLine)
            );
            newScreenLineComponents.push(newScreenLineComponent);

            newScreenLineIndex++;
          }

          this.lineComponents.splice(
            lineComponentIndex,
            0,
            ...newScreenLineComponents
          );
          lineComponentIndex =
            lineComponentIndex + newScreenLineComponents.length;
        } else if (
          oldScreenLineIndex < newScreenLineIndexInOldScreenLines &&
          newScreenLineIndexInOldScreenLines < oldScreenLinesEndIndex
        ) {
          while (oldScreenLineIndex < newScreenLineIndexInOldScreenLines) {
            this.lineComponents[lineComponentIndex].destroy();
            this.lineComponents.splice(lineComponentIndex, 1);

            oldScreenLineIndex++;
          }
        } else {
          const oldScreenLineComponent = this.lineComponents[
            lineComponentIndex
          ];
          // eslint-disable-next-line no-redeclare
          var newScreenLineComponent = new LineComponent({
            screenLine: newScreenLines[newScreenLineIndex],
            screenRow: tileStartRow + newScreenLineIndex,
            lineDecoration: lineDecorations[newScreenLineIndex],
            textDecorations: textDecorations[newScreenLineIndex],
            displayLayer,
            nodePool,
            lineComponentsByScreenLineId
          });
          this.element.insertBefore(
            newScreenLineComponent.element,
            oldScreenLineComponent.element
          );
          oldScreenLineComponent.destroy();
          this.lineComponents[lineComponentIndex] = newScreenLineComponent;

          oldScreenLineIndex++;
          newScreenLineIndex++;
          lineComponentIndex++;
        }
      }
    }
  }

  getFirstElementForScreenLine(oldProps, screenLine) {
    const blockDecorations = oldProps.blockDecorations
      ? oldProps.blockDecorations.get(screenLine.id)
      : null;
    if (blockDecorations) {
      const blockDecorationElementsBeforeOldScreenLine = [];
      for (let i = 0; i < blockDecorations.length; i++) {
        const decoration = blockDecorations[i];
        if (decoration.position !== 'after') {
          blockDecorationElementsBeforeOldScreenLine.push(
            TextEditor.viewForItem(decoration.item)
          );
        }
      }

      for (
        let i = 0;
        i < blockDecorationElementsBeforeOldScreenLine.length;
        i++
      ) {
        const blockDecorationElement =
          blockDecorationElementsBeforeOldScreenLine[i];
        if (
          !blockDecorationElementsBeforeOldScreenLine.includes(
            blockDecorationElement.previousSibling
          )
        ) {
          return blockDecorationElement;
        }
      }
    }

    return oldProps.lineComponentsByScreenLineId.get(screenLine.id).element;
  }

  updateBlockDecorations(oldProps, newProps) {
    const { blockDecorations, lineComponentsByScreenLineId } = newProps;

    if (oldProps.blockDecorations) {
      oldProps.blockDecorations.forEach((oldDecorations, screenLineId) => {
        const newDecorations = newProps.blockDecorations
          ? newProps.blockDecorations.get(screenLineId)
          : null;
        for (let i = 0; i < oldDecorations.length; i++) {
          const oldDecoration = oldDecorations[i];
          if (newDecorations && newDecorations.includes(oldDecoration))
            continue;

          const element = TextEditor.viewForItem(oldDecoration.item);
          if (element.parentElement !== this.element) continue;

          element.remove();
        }
      });
    }

    if (blockDecorations) {
      blockDecorations.forEach((newDecorations, screenLineId) => {
        const oldDecorations = oldProps.blockDecorations
          ? oldProps.blockDecorations.get(screenLineId)
          : null;
        const lineNode = lineComponentsByScreenLineId.get(screenLineId).element;
        let lastAfter = lineNode;

        for (let i = 0; i < newDecorations.length; i++) {
          const newDecoration = newDecorations[i];
          const element = TextEditor.viewForItem(newDecoration.item);

          if (oldDecorations && oldDecorations.includes(newDecoration)) {
            if (newDecoration.position === 'after') {
              lastAfter = element;
            }
            continue;
          }

          if (newDecoration.position === 'after') {
            this.element.insertBefore(element, lastAfter.nextSibling);
            lastAfter = element;
          } else {
            this.element.insertBefore(element, lineNode);
          }
        }
      });
    }
  }

  shouldUpdate(newProps) {
    const oldProps = this.props;
    if (oldProps.top !== newProps.top) return true;
    if (oldProps.height !== newProps.height) return true;
    if (oldProps.width !== newProps.width) return true;
    if (oldProps.lineHeight !== newProps.lineHeight) return true;
    if (oldProps.tileStartRow !== newProps.tileStartRow) return true;
    if (oldProps.tileEndRow !== newProps.tileEndRow) return true;
    if (!arraysEqual(oldProps.screenLines, newProps.screenLines)) return true;
    if (!arraysEqual(oldProps.lineDecorations, newProps.lineDecorations))
      return true;

    if (oldProps.blockDecorations && newProps.blockDecorations) {
      if (oldProps.blockDecorations.size !== newProps.blockDecorations.size)
        return true;

      let blockDecorationsChanged = false;

      oldProps.blockDecorations.forEach((oldDecorations, screenLineId) => {
        if (!blockDecorationsChanged) {
          const newDecorations = newProps.blockDecorations.get(screenLineId);
          blockDecorationsChanged =
            newDecorations == null ||
            !arraysEqual(oldDecorations, newDecorations);
        }
      });
      if (blockDecorationsChanged) return true;

      newProps.blockDecorations.forEach((_, screenLineId) => {
        if (!blockDecorationsChanged) {
          const oldDecorations = oldProps.blockDecorations.get(screenLineId);
          blockDecorationsChanged = oldDecorations == null;
        }
      });
      if (blockDecorationsChanged) return true;
    } else if (oldProps.blockDecorations) {
      return true;
    } else if (newProps.blockDecorations) {
      return true;
    }

    if (oldProps.textDecorations.length !== newProps.textDecorations.length)
      return true;
    for (let i = 0; i < oldProps.textDecorations.length; i++) {
      if (
        !textDecorationsEqual(
          oldProps.textDecorations[i],
          newProps.textDecorations[i]
        )
      )
        return true;
    }

    return false;
  }
}

class LineComponent {
  constructor(props) {
    const {
      nodePool,
      screenRow,
      screenLine,
      lineComponentsByScreenLineId,
      offScreen
    } = props;
    this.props = props;
    this.element = nodePool.getElement('DIV', this.buildClassName(), null);
    this.element.dataset.screenRow = screenRow;
    this.textNodes = [];

    if (offScreen) {
      this.element.style.position = 'absolute';
      this.element.style.visibility = 'hidden';
      this.element.dataset.offScreen = true;
    }

    this.appendContents();
    lineComponentsByScreenLineId.set(screenLine.id, this);
  }

  update(newProps) {
    if (this.props.lineDecoration !== newProps.lineDecoration) {
      this.props.lineDecoration = newProps.lineDecoration;
      this.element.className = this.buildClassName();
    }

    if (this.props.screenRow !== newProps.screenRow) {
      this.props.screenRow = newProps.screenRow;
      this.element.dataset.screenRow = newProps.screenRow;
    }

    if (
      !textDecorationsEqual(
        this.props.textDecorations,
        newProps.textDecorations
      )
    ) {
      this.props.textDecorations = newProps.textDecorations;
      this.element.firstChild.remove();
      this.appendContents();
    }
  }

  destroy() {
    const { nodePool, lineComponentsByScreenLineId, screenLine } = this.props;

    if (lineComponentsByScreenLineId.get(screenLine.id) === this) {
      lineComponentsByScreenLineId.delete(screenLine.id);
    }

    this.element.remove();
    nodePool.release(this.element);
  }

  appendContents() {
    const { displayLayer, nodePool, screenLine, textDecorations } = this.props;

    this.textNodes.length = 0;

    const { lineText, tags } = screenLine;
    let openScopeNode = nodePool.getElement('SPAN', null, null);
    this.element.appendChild(openScopeNode);

    let decorationIndex = 0;
    let column = 0;
    let activeClassName = null;
    let activeStyle = null;
    let nextDecoration = textDecorations
      ? textDecorations[decorationIndex]
      : null;
    if (nextDecoration && nextDecoration.column === 0) {
      column = nextDecoration.column;
      activeClassName = nextDecoration.className;
      activeStyle = nextDecoration.style;
      nextDecoration = textDecorations[++decorationIndex];
    }

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      if (tag !== 0) {
        if (displayLayer.isCloseTag(tag)) {
          openScopeNode = openScopeNode.parentElement;
        } else if (displayLayer.isOpenTag(tag)) {
          const newScopeNode = nodePool.getElement(
            'SPAN',
            displayLayer.classNameForTag(tag),
            null
          );
          openScopeNode.appendChild(newScopeNode);
          openScopeNode = newScopeNode;
        } else {
          const nextTokenColumn = column + tag;
          while (nextDecoration && nextDecoration.column <= nextTokenColumn) {
            const text = lineText.substring(column, nextDecoration.column);
            this.appendTextNode(
              openScopeNode,
              text,
              activeClassName,
              activeStyle
            );
            column = nextDecoration.column;
            activeClassName = nextDecoration.className;
            activeStyle = nextDecoration.style;
            nextDecoration = textDecorations[++decorationIndex];
          }

          if (column < nextTokenColumn) {
            const text = lineText.substring(column, nextTokenColumn);
            this.appendTextNode(
              openScopeNode,
              text,
              activeClassName,
              activeStyle
            );
            column = nextTokenColumn;
          }
        }
      }
    }

    if (column === 0) {
      const textNode = nodePool.getTextNode(' ');
      this.element.appendChild(textNode);
      this.textNodes.push(textNode);
    }

    if (lineText.endsWith(displayLayer.foldCharacter)) {
      // Insert a zero-width non-breaking whitespace, so that LinesYardstick can
      // take the fold-marker::after pseudo-element into account during
      // measurements when such marker is the last character on the line.
      const textNode = nodePool.getTextNode(ZERO_WIDTH_NBSP_CHARACTER);
      this.element.appendChild(textNode);
      this.textNodes.push(textNode);
    }
  }

  appendTextNode(openScopeNode, text, activeClassName, activeStyle) {
    const { nodePool } = this.props;

    if (activeClassName || activeStyle) {
      const decorationNode = nodePool.getElement(
        'SPAN',
        activeClassName,
        activeStyle
      );
      openScopeNode.appendChild(decorationNode);
      openScopeNode = decorationNode;
    }

    const textNode = nodePool.getTextNode(text);
    openScopeNode.appendChild(textNode);
    this.textNodes.push(textNode);
  }

  buildClassName() {
    const { lineDecoration } = this.props;
    let className = 'line';
    if (lineDecoration != null) className = className + ' ' + lineDecoration;
    return className;
  }
}

function textDecorationsEqual(oldDecorations, newDecorations) {
  if (!oldDecorations && newDecorations) return false;
  if (oldDecorations && !newDecorations) return false;
  if (oldDecorations && newDecorations) {
    if (oldDecorations.length !== newDecorations.length) return false;
    for (let j = 0; j < oldDecorations.length; j++) {
      if (oldDecorations[j].column !== newDecorations[j].column) return false;
      if (oldDecorations[j].className !== newDecorations[j].className)
        return false;
      if (!objectsEqual(oldDecorations[j].style, newDecorations[j].style))
        return false;
    }
  }
  return true;
}
