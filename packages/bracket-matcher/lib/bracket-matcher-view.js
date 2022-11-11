const {CompositeDisposable} = require('atom')
const _ = require('underscore-plus')
const {Range, Point} = require('atom')
const TagFinder = require('./tag-finder')

const MAX_ROWS_TO_SCAN = 10000
const ONE_CHAR_FORWARD_TRAVERSAL = Object.freeze(Point(0, 1))
const ONE_CHAR_BACKWARD_TRAVERSAL = Object.freeze(Point(0, -1))
const TWO_CHARS_BACKWARD_TRAVERSAL = Object.freeze(Point(0, -2))
const MAX_ROWS_TO_SCAN_FORWARD_TRAVERSAL = Object.freeze(Point(MAX_ROWS_TO_SCAN, 0))
const MAX_ROWS_TO_SCAN_BACKWARD_TRAVERSAL = Object.freeze(Point(-MAX_ROWS_TO_SCAN, 0))

module.exports =
class BracketMatcherView {
  constructor (editor, editorElement, matchManager) {
    this.destroy = this.destroy.bind(this)
    this.updateMatch = this.updateMatch.bind(this)
    this.editor = editor
    this.matchManager = matchManager
    this.gutter = this.editor.gutterWithName('line-number')
    this.subscriptions = new CompositeDisposable()
    this.tagFinder = new TagFinder(this.editor)
    this.pairHighlighted = false
    this.tagHighlighted = false

    // ranges for possible selection
    this.bracket1Range = null
    this.bracket2Range = null

    this.subscriptions.add(
      this.editor.onDidTokenize(this.updateMatch),
      this.editor.getBuffer().onDidChangeText(this.updateMatch),
      this.editor.onDidChangeGrammar(this.updateMatch),
      this.editor.onDidChangeSelectionRange(this.updateMatch),
      this.editor.onDidAddCursor(this.updateMatch),
      this.editor.onDidRemoveCursor(this.updateMatch),

      atom.commands.add(editorElement, 'bracket-matcher:go-to-matching-bracket', () =>
        this.goToMatchingBracket()
      ),

      atom.commands.add(editorElement, 'bracket-matcher:go-to-enclosing-bracket', () =>
        this.gotoPrecedingStartBracket()
      ),

      atom.commands.add(editorElement, 'bracket-matcher:select-inside-brackets', () =>
        this.selectInsideBrackets()
      ),

      atom.commands.add(editorElement, 'bracket-matcher:close-tag', () =>
        this.closeTag()
      ),

      atom.commands.add(editorElement, 'bracket-matcher:remove-matching-brackets', () =>
        this.removeMatchingBrackets()
      ),

      atom.commands.add(editorElement, 'bracket-matcher:select-matching-brackets', () =>
        this.selectMatchingBrackets()
      ),

      this.editor.onDidDestroy(this.destroy)
    )

    this.updateMatch()
  }

  destroy () {
    this.subscriptions.dispose()
  }

  updateMatch () {
    if (this.pairHighlighted) {
      this.editor.destroyMarker(this.startMarker.id)
      this.editor.destroyMarker(this.endMarker.id)
    }

    this.pairHighlighted = false
    this.tagHighlighted = false

    if (!this.editor.getLastSelection().isEmpty()) return

    const {position, matchPosition} = this.findCurrentPair()

    let startRange = null
    let endRange = null
    let highlightTag = false
    let highlightPair = false
    if (position && matchPosition) {
      this.bracket1Range = (startRange = Range(position, position.traverse(ONE_CHAR_FORWARD_TRAVERSAL)))
      this.bracket2Range = (endRange = Range(matchPosition, matchPosition.traverse(ONE_CHAR_FORWARD_TRAVERSAL)))
      highlightPair = true
    } else {
      this.bracket1Range = null
      this.bracket2Range = null
      if (this.hasSyntaxTree()) {
        ({startRange, endRange} = this.findMatchingTagNameRangesWithSyntaxTree())
      } else {
        ({startRange, endRange} = this.tagFinder.findMatchingTags())
        if (this.isCursorOnCommentOrString()) return
      }
      if (startRange) {
        highlightTag = true
        highlightPair = true
      }
    }

    if (!highlightTag && !highlightPair) return

    this.startMarker = this.createMarker(startRange)
    this.endMarker = this.createMarker(endRange)
    this.pairHighlighted = highlightPair
    this.tagHighlighted = highlightTag
  }

  selectMatchingBrackets () {
    if (!this.bracket1Range && !this.bracket2Range) return
    this.editor.setSelectedBufferRanges([this.bracket1Range, this.bracket2Range])
    this.matchManager.changeBracketsMode = true
  }

  removeMatchingBrackets () {
    if (this.editor.hasMultipleCursors()) {
      this.editor.backspace()
      return
    }

    this.editor.transact(() => {
      if (this.editor.getLastSelection().isEmpty()) {
        this.editor.selectLeft()
      }

      const text = this.editor.getSelectedText()
      this.editor.moveRight()

      // check if the character to the left is part of a pair
      if (
        this.matchManager.pairedCharacters.hasOwnProperty(text) ||
        this.matchManager.pairedCharactersInverse.hasOwnProperty(text)
      ) {
        let {position, matchPosition, bracket} = this.findCurrentPair()

        if (position && matchPosition) {
          this.editor.setCursorBufferPosition(matchPosition)
          this.editor.delete()
          // if on the same line and the cursor is in front of an end pair
          // offset by one to make up for the missing character
          if (position.row === matchPosition.row && this.matchManager.pairedCharactersInverse.hasOwnProperty(bracket)) {
            position = position.traverse(ONE_CHAR_BACKWARD_TRAVERSAL)
          }
          this.editor.setCursorBufferPosition(position)
          this.editor.delete()
        } else {
          this.editor.backspace()
        }
      } else {
        this.editor.backspace()
      }
    })
  }

  findMatchingEndBracket (startBracketPosition, startBracket, endBracket) {
    if (startBracket === endBracket) return

    if (this.hasSyntaxTree()) {
      return this.findMatchingEndBracketWithSyntaxTree(startBracketPosition, startBracket, endBracket)
    } else {
      const scopeDescriptor = this.editor.scopeDescriptorForBufferPosition(startBracketPosition)
      if (this.isScopeCommentedOrString(scopeDescriptor.getScopesArray())) return
      return this.findMatchingEndBracketWithRegexSearch(startBracketPosition, startBracket, endBracket)
    }
  }

  findMatchingStartBracket (endBracketPosition, startBracket, endBracket) {
    if (startBracket === endBracket) return

    if (this.hasSyntaxTree()) {
      return this.findMatchingStartBracketWithSyntaxTree(endBracketPosition, startBracket, endBracket)
    } else {
      const scopeDescriptor = this.editor.scopeDescriptorForBufferPosition(endBracketPosition)
      if (this.isScopeCommentedOrString(scopeDescriptor.getScopesArray())) return
      return this.findMatchingStartBracketWithRegexSearch(endBracketPosition, startBracket, endBracket)
    }
  }

  findMatchingEndBracketWithSyntaxTree (bracketPosition, startBracket, endBracket) {
    let result
    const bracketEndPosition = bracketPosition.traverse([0, startBracket.length])
    this.editor.buffer.getLanguageMode().getSyntaxNodeContainingRange(
      new Range(bracketPosition, bracketEndPosition),
      node => {
        if (bracketEndPosition.isGreaterThan(node.startPosition) && bracketEndPosition.isLessThan(node.endPosition)) {
          const matchNode = node.children.find(child =>
            bracketEndPosition.isLessThanOrEqual(child.startPosition) &&
            child.type === endBracket
          )
          if (matchNode) result = Point.fromObject(matchNode.startPosition)
          return true
        }
      }
    )
    return result
  }

  findMatchingStartBracketWithSyntaxTree (bracketPosition, startBracket, endBracket) {
    let result
    const bracketEndPosition = bracketPosition.traverse([0, startBracket.length])
    this.editor.buffer.getLanguageMode().getSyntaxNodeContainingRange(
      new Range(bracketPosition, bracketEndPosition),
      node => {
        if (bracketPosition.isGreaterThan(node.startPosition)) {
          const matchNode = node.children.find(child =>
            bracketPosition.isGreaterThanOrEqual(child.endPosition) &&
            child.type === startBracket
          )
          if (matchNode) result = Point.fromObject(matchNode.startPosition)
          return true
        }
      }
    )
    return result
  }

  findMatchingTagNameRangesWithSyntaxTree () {
    const position = this.editor.getCursorBufferPosition()
    const {startTag, endTag} = this.findContainingTagsWithSyntaxTree(position)
    if (startTag && (startTag.range.containsPoint(position) || endTag.range.containsPoint(position))) {
      if (startTag === endTag) {
        const {range} = startTag.child(1)
        return {startRange: range, endRange: range}
      } else if (endTag.firstChild.type === '</') {
        return {
          startRange: startTag.child(1).range,
          endRange: endTag.child(1).range
        }
      } else {
        return {
          startRange: startTag.child(1).range,
          endRange: endTag.child(2).range
        }
      }
    } else {
      return {}
    }
  }

  findMatchingTagsWithSyntaxTree () {
    const position = this.editor.getCursorBufferPosition()
    const {startTag, endTag} = this.findContainingTagsWithSyntaxTree(position)
    if (startTag) {
      return {startRange: startTag.range, endRange: endTag.range}
    } else {
      return {}
    }
  }

  findContainingTagsWithSyntaxTree (position) {
    let startTag, endTag
    if (position.column === this.editor.buffer.lineLengthForRow(position.row)) position.column--;
    this.editor.buffer.getLanguageMode().getSyntaxNodeAtPosition(position, node => {
      if (node.type.includes('element') && node.childCount > 0) {
        const {firstChild, lastChild} = node
        if (
          firstChild.childCount > 2 &&
          firstChild.firstChild.type === '<'
        ) {
          if (lastChild === firstChild && firstChild.lastChild.type === '/>') {
            startTag = firstChild
            endTag = firstChild
          } else if (
            lastChild.childCount > 2 &&
            (lastChild.firstChild.type === '</' ||
             lastChild.firstChild.type === '<' && lastChild.child(1).type === '/')
          ) {
            startTag = firstChild
            endTag = lastChild
          }
        }
        return true
      }
    })
    return {startTag, endTag}
  }

  findMatchingEndBracketWithRegexSearch (startBracketPosition, startBracket, endBracket) {
    const scanRange = new Range(
      startBracketPosition.traverse(ONE_CHAR_FORWARD_TRAVERSAL),
      startBracketPosition.traverse(MAX_ROWS_TO_SCAN_FORWARD_TRAVERSAL)
    )
    let endBracketPosition = null
    let unpairedCount = 0
    this.editor.scanInBufferRange(this.matchManager.pairRegexes[startBracket], scanRange, result => {
      if (this.isRangeCommentedOrString(result.range)) return
      switch (result.match[0]) {
        case startBracket:
          unpairedCount++
          break
        case endBracket:
          unpairedCount--
          if (unpairedCount < 0) {
            endBracketPosition = result.range.start
            result.stop()
          }
          break
      }
    })

    return endBracketPosition
  }

  findMatchingStartBracketWithRegexSearch (endBracketPosition, startBracket, endBracket) {
    const scanRange = new Range(
      endBracketPosition.traverse(MAX_ROWS_TO_SCAN_BACKWARD_TRAVERSAL),
      endBracketPosition
    )
    let startBracketPosition = null
    let unpairedCount = 0
    this.editor.backwardsScanInBufferRange(this.matchManager.pairRegexes[startBracket], scanRange, result => {
      if (this.isRangeCommentedOrString(result.range)) return
      switch (result.match[0]) {
        case startBracket:
          unpairedCount--
          if (unpairedCount < 0) {
            startBracketPosition = result.range.start
            result.stop()
            break
          }
          break
        case endBracket:
          unpairedCount++
      }
    })

    return startBracketPosition
  }

  findPrecedingStartBracket (cursorPosition) {
    if (this.hasSyntaxTree()) {
      return this.findPrecedingStartBracketWithSyntaxTree(cursorPosition)
    } else {
      return this.findPrecedingStartBracketWithRegexSearch(cursorPosition)
    }
  }

  findPrecedingStartBracketWithSyntaxTree (cursorPosition) {
    let result
    this.editor.buffer.getLanguageMode().getSyntaxNodeAtPosition(cursorPosition, node => {
      for (const child of node.children) {
        if (cursorPosition.isLessThanOrEqual(child.startPosition)) break
        if (
          child.type in this.matchManager.pairedCharacters ||
          child.type in this.matchManager.pairedCharactersInverse
        ) {
          result = Point.fromObject(child.startPosition)
          return true
        }
      }
    })
    return result
  }

  findPrecedingStartBracketWithRegexSearch (cursorPosition) {
    const scanRange = new Range(Point.ZERO, cursorPosition)
    const startBracket = _.escapeRegExp(_.keys(this.matchManager.pairedCharacters).join(''))
    const endBracket = _.escapeRegExp(_.keys(this.matchManager.pairedCharactersInverse).join(''))
    const combinedRegExp = new RegExp(`[${startBracket}${endBracket}]`, 'g')
    const startBracketRegExp = new RegExp(`[${startBracket}]`, 'g')
    const endBracketRegExp = new RegExp(`[${endBracket}]`, 'g')
    let startPosition = null
    let unpairedCount = 0
    this.editor.backwardsScanInBufferRange(combinedRegExp, scanRange, result => {
      if (this.isRangeCommentedOrString(result.range)) return
      if (result.match[0].match(endBracketRegExp)) {
        unpairedCount++
      } else if (result.match[0].match(startBracketRegExp)) {
        unpairedCount--
        if (unpairedCount < 0) {
          startPosition = result.range.start
          result.stop()
        }
      }
    })

    return startPosition
  }

  createMarker (bufferRange) {
    const marker = this.editor.markBufferRange(bufferRange)
    this.editor.decorateMarker(marker, {type: 'highlight', class: 'bracket-matcher', deprecatedRegionClass: 'bracket-matcher'})
    if (atom.config.get('bracket-matcher.highlightMatchingLineNumber', {scope: this.editor.getRootScopeDescriptor()}) && this.gutter) {
      this.gutter.decorateMarker(marker, {type: 'highlight', class: 'bracket-matcher', deprecatedRegionClass: 'bracket-matcher'})
    }
    return marker
  }

  findCurrentPair () {
    const currentPosition = this.editor.getCursorBufferPosition()
    const previousPosition = currentPosition.traverse(ONE_CHAR_BACKWARD_TRAVERSAL)
    const nextPosition = currentPosition.traverse(ONE_CHAR_FORWARD_TRAVERSAL)
    const currentCharacter = this.editor.getTextInBufferRange(new Range(currentPosition, nextPosition))
    const previousCharacter = this.editor.getTextInBufferRange(new Range(previousPosition, currentPosition))

    let position, matchPosition, currentBracket, matchingBracket
    if ((matchingBracket = this.matchManager.pairedCharacters[currentCharacter])) {
      position = currentPosition
      currentBracket = currentCharacter
      matchPosition = this.findMatchingEndBracket(position, currentBracket, matchingBracket)
    } else if ((matchingBracket = this.matchManager.pairedCharacters[previousCharacter])) {
      position = previousPosition
      currentBracket = previousCharacter
      matchPosition = this.findMatchingEndBracket(position, currentBracket, matchingBracket)
    } else if ((matchingBracket = this.matchManager.pairedCharactersInverse[previousCharacter])) {
      position = previousPosition
      currentBracket = previousCharacter
      matchPosition = this.findMatchingStartBracket(position, matchingBracket, currentBracket)
    } else if ((matchingBracket = this.matchManager.pairedCharactersInverse[currentCharacter])) {
      position = currentPosition
      currentBracket = currentCharacter
      matchPosition = this.findMatchingStartBracket(position, matchingBracket, currentBracket)
    }

    return {position, matchPosition, bracket: currentBracket}
  }

  goToMatchingBracket () {
    if (!this.pairHighlighted) return this.gotoPrecedingStartBracket()
    const position = this.editor.getCursorBufferPosition()

    if (this.tagHighlighted) {
      let tagCharacterOffset
      let startRange = this.startMarker.getBufferRange()
      const tagLength = startRange.end.column - startRange.start.column
      let endRange = this.endMarker.getBufferRange()
      if (startRange.compare(endRange) > 0) {
        [startRange, endRange] = [endRange, startRange]
      }

      // include the <
      startRange = new Range(startRange.start.traverse(ONE_CHAR_BACKWARD_TRAVERSAL), endRange.end.traverse(ONE_CHAR_BACKWARD_TRAVERSAL))
      // include the </
      endRange = new Range(endRange.start.traverse(TWO_CHARS_BACKWARD_TRAVERSAL), endRange.end.traverse(TWO_CHARS_BACKWARD_TRAVERSAL))

      if (position.isLessThan(endRange.start)) {
        tagCharacterOffset = position.column - startRange.start.column
        if (tagCharacterOffset > 0) { tagCharacterOffset++ }
        tagCharacterOffset = Math.min(tagCharacterOffset, tagLength + 2) // include </
        this.editor.setCursorBufferPosition(endRange.start.traverse([0, tagCharacterOffset]))
      } else {
        tagCharacterOffset = position.column - endRange.start.column
        if (tagCharacterOffset > 1) { tagCharacterOffset-- }
        tagCharacterOffset = Math.min(tagCharacterOffset, tagLength + 1) // include <
        this.editor.setCursorBufferPosition(startRange.start.traverse([0, tagCharacterOffset]))
      }
    } else {
      const previousPosition = position.traverse(ONE_CHAR_BACKWARD_TRAVERSAL)
      const startPosition = this.startMarker.getStartBufferPosition()
      const endPosition = this.endMarker.getStartBufferPosition()

      if (position.isEqual(startPosition)) {
        this.editor.setCursorBufferPosition(endPosition.traverse(ONE_CHAR_FORWARD_TRAVERSAL))
      } else if (previousPosition.isEqual(startPosition)) {
        this.editor.setCursorBufferPosition(endPosition)
      } else if (position.isEqual(endPosition)) {
        this.editor.setCursorBufferPosition(startPosition.traverse(ONE_CHAR_FORWARD_TRAVERSAL))
      } else if (previousPosition.isEqual(endPosition)) {
        this.editor.setCursorBufferPosition(startPosition)
      }
    }
  }

  gotoPrecedingStartBracket () {
    if (this.pairHighlighted) return

    const matchPosition = this.findPrecedingStartBracket(this.editor.getCursorBufferPosition())
    if (matchPosition) {
      this.editor.setCursorBufferPosition(matchPosition)
    } else {
      let startRange, endRange
      if (this.hasSyntaxTree()) {
        ({startRange, endRange} = this.findMatchingTagsWithSyntaxTree())
      } else {
        ({startRange, endRange} = this.tagFinder.findStartEndTags())
      }

      if (startRange) {
        if (startRange.compare(endRange) > 0) {
          [startRange, endRange] = [endRange, startRange]
        }
        this.editor.setCursorBufferPosition(startRange.start)
      }
    }
  }

  multiCursorSelect() {
    this.editor.getCursorBufferPositions().forEach(position => {
      let startPosition = this.findPrecedingStartBracket(position)
      if(startPosition) {
        const startBracket = this.editor.getTextInRange(Range.fromPointWithDelta(startPosition, 0, 1))
        const endPosition = this.findMatchingEndBracket(startPosition, startBracket, this.matchManager.pairedCharacters[startBracket])
        startPosition = startPosition.traverse([0, 1])
        if (startPosition && endPosition) {
          const rangeToSelect = new Range(startPosition, endPosition)
          this.editor.addSelectionForBufferRange(rangeToSelect)
        }
      } else {
        let startRange, endRange;
        if (this.hasSyntaxTree()) {
          ({startRange, endRange} = this.findMatchingTagsWithSyntaxTree())
        } else {
          ({startRange, endRange} = this.tagFinder.findStartEndTags(true))
          if (startRange && startRange.compare(endRange) > 0) {
            [startRange, endRange] = [endRange, startRange]
          }
        }
        if (startRange) {
          const startPosition = startRange.end
          const endPosition = endRange.start
          const rangeToSelect = new Range(startPosition, endPosition)
          this.editor.setSelectedBufferRange(rangeToSelect)
        }
      }
    })
  }

  selectInsideBrackets () {
    let endPosition, endRange, startPosition, startRange
    if (this.pairHighlighted) {
      startRange = this.startMarker.getBufferRange()
      endRange = this.endMarker.getBufferRange()

      if (this.tagHighlighted) {
        if (this.hasSyntaxTree()) {
          ({startRange, endRange} = this.findMatchingTagsWithSyntaxTree())
        } else {
          ({startRange, endRange} = this.tagFinder.findStartEndTags(true))
          if (startRange && startRange.compare(endRange) > 0) {
            [startRange, endRange] = [endRange, startRange]
          }
        }
      }
      startPosition = startRange.end
      endPosition = endRange.start

      const rangeToSelect = new Range(startPosition, endPosition)
      this.editor.setSelectedBufferRange(rangeToSelect)
    } else {
      this.multiCursorSelect();
    }
  }

  // Insert at the current cursor position a closing tag if there exists an
  // open tag that is not closed afterwards.
  closeTag () {
    const cursorPosition = this.editor.getCursorBufferPosition()
    const preFragment = this.editor.getTextInBufferRange([Point.ZERO, cursorPosition])
    const postFragment = this.editor.getTextInBufferRange([cursorPosition, Point.INFINITY])

    const tag = this.tagFinder.closingTagForFragments(preFragment, postFragment)
    if (tag) {
      this.editor.insertText(`</${tag}>`)
    }
  }

  isCursorOnCommentOrString () {
    return this.isScopeCommentedOrString(this.editor.getLastCursor().getScopeDescriptor().getScopesArray())
  }

  isRangeCommentedOrString (range) {
    return this.isScopeCommentedOrString(this.editor.scopeDescriptorForBufferPosition(range.start).getScopesArray())
  }

  isScopeCommentedOrString (scopesArray) {
    for (let scope of scopesArray.reverse()) {
      scope = scope.split('.')
      if (scope.includes('embedded') && scope.includes('source')) return false
      if (scope.includes('comment') || scope.includes('string')) return true
    }

    return false
  }

  hasSyntaxTree () {
    return this.editor.buffer.getLanguageMode().getSyntaxNodeAtPosition
  }
}
