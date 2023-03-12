const {Range} = require('atom')
const _ = require('underscore-plus')
const SelfClosingTags = require('./self-closing-tags')

const TAG_SELECTOR_REGEX = /(\b|\.)(meta\.tag|punctuation\.definition\.tag)/
const COMMENT_SELECTOR_REGEX = /(\b|\.)comment/

// Creates a regex to match opening tag with match[1] and closing tags with match[2]
//
// * tagNameRegexStr - a regex string describing how to match the tagname.
//                     Should not contain capturing match groups.
//
// Returns a {RegExp}.
const generateTagStartOrEndRegex = function (tagNameRegexStr) {
  const notSelfClosingTagEnd = "(?:[^>\\/\"']|\"[^\"]*\"|'[^']*')*>"
  return new RegExp(`<(${tagNameRegexStr})${notSelfClosingTagEnd}|<\\/(${tagNameRegexStr})>`)
}

const tagStartOrEndRegex = generateTagStartOrEndRegex('\\w[-\\w]*(?:(?:\\:|\\.)\\w[-\\w]*)*')

// Helper to find the matching start/end tag for the start/end tag under the
// cursor in XML, HTML, etc. editors.
module.exports =
class TagFinder {
  constructor (editor) {
    // 1. Tag prefix
    // 2. Closing tag (optional)
    // 3. Tag name
    // 4. Attributes (ids, classes, etc. - optional)
    // 5. Tag suffix
    // 6. Self-closing tag (optional)
    this.editor = editor
    this.tagPattern = /(<(\/)?)(.+?)(\s+.*?)?((\/)?>|$)/
    this.wordRegex = /.*?(>|$)/
  }

  patternForTagName (tagName) {
    tagName = _.escapeRegExp(tagName)
    // 1. Start tag
    // 2. Tag name
    // 3. Attributes (optional)
    // 4. Tag suffix
    // 5. Self-closing tag (optional)
    // 6. End tag
    return new RegExp(`(<(${tagName})(\\s+[^>]*?)?((/)?>))|(</${tagName}[^>]*>)`, 'gi')
  }

  isRangeCommented (range) {
    return this.scopesForPositionMatchRegex(range.start, COMMENT_SELECTOR_REGEX)
  }

  isCursorOnTag () {
    return this.scopesForPositionMatchRegex(this.editor.getCursorBufferPosition(), TAG_SELECTOR_REGEX)
  }

  scopesForPositionMatchRegex (position, regex) {
    const {tokenizedBuffer, buffer} = this.editor
    const {grammar} = tokenizedBuffer
    let column = 0
    const line = tokenizedBuffer.tokenizedLineForRow(position.row)
    if (line == null) { return false }
    const lineLength = buffer.lineLengthForRow(position.row)
    const scopeIds = line.openScopes.slice()
    for (let i = 0; i < line.tags.length; i++) {
      const tag = line.tags[i]
      if (tag >= 0) {
        const nextColumn = column + tag
        if ((nextColumn > position.column) || (nextColumn === lineLength)) { break }
        column = nextColumn
      } else if ((tag & 1) === 1) {
        scopeIds.push(tag)
      } else {
        scopeIds.pop()
      }
    }

    return scopeIds.some(scopeId => regex.test(grammar.scopeForId(scopeId)))
  }

  findStartTag (tagName, endPosition, fullRange = false) {
    const scanRange = new Range([0, 0], endPosition)
    const pattern = this.patternForTagName(tagName)
    let startRange = null
    let unpairedCount = 0
    this.editor.backwardsScanInBufferRange(pattern, scanRange, ({match, range, stop}) => {
      if (this.isRangeCommented(range)) return

      const [entireMatch, isStartTag, tagName, attributes, suffix, isSelfClosingTag, isEndTag] = match

      if (isSelfClosingTag) return

      if (isStartTag) {
        unpairedCount--
        if (unpairedCount < 0) {
          stop()
          startRange = range
          if (!fullRange) {
            // Move the start past the initial <
            startRange.start = startRange.start.translate([0, 1])

            // End right after the tag name
            startRange.end = startRange.start.translate([0, tagName.length])
          }
        }
      } else {
        unpairedCount++
      }
    })

    return startRange
  }

  findEndTag (tagName, startPosition, fullRange = false) {
    const scanRange = new Range(startPosition, this.editor.buffer.getEndPosition())
    const pattern = this.patternForTagName(tagName)
    let endRange = null
    let unpairedCount = 0
    this.editor.scanInBufferRange(pattern, scanRange, ({match, range, stop}) => {
      if (this.isRangeCommented(range)) return

      const [entireMatch, isStartTag, tagName, attributes, suffix, isSelfClosingTag, isEndTag] = match

      if (isSelfClosingTag) return

      if (isStartTag) {
        unpairedCount++
      } else {
        unpairedCount--
        if (unpairedCount < 0) {
          stop()
          endRange = range
          if (!fullRange) {
            // Subtract </ and > from range
            endRange = range.translate([0, 2], [0, -1])
          }
        }
      }
    })

    return endRange
  }

  findStartEndTags (fullRange = false) {
    let ranges = {}
    const endPosition = this.editor.getLastCursor().getCurrentWordBufferRange({wordRegex: this.wordRegex}).end
    this.editor.backwardsScanInBufferRange(this.tagPattern, [[0, 0], endPosition], ({match, range, stop}) => {
      stop()

      const [entireMatch, prefix, isClosingTag, tagName, attributes, suffix, isSelfClosingTag] = Array.from(match)

      let startRange = range
      if (!fullRange) {
        if (range.start.row === range.end.row) {
          // Move the start past the initial <
          startRange.start = startRange.start.translate([0, prefix.length])
          // End right after the tag name
          startRange.end = startRange.start.translate([0, tagName.length])
        } else {
          startRange = Range.fromObject([range.start.translate([0, prefix.length]), [range.start.row, Infinity]])
        }
      }

      let endRange
      if (isSelfClosingTag) {
        endRange = startRange
      } else if (isClosingTag) {
        endRange = this.findStartTag(tagName, startRange.start, fullRange)
      } else {
        endRange = this.findEndTag(tagName, startRange.end, fullRange)
      }

      if (startRange && endRange) ranges = {startRange, endRange}
    })

    return ranges
  }

  findMatchingTags () {
    return (this.isCursorOnTag() && this.findStartEndTags()) || {}
  }

  // Parses a fragment of html returning the stack (i.e., an array) of open tags
  //
  // fragment  - the fragment of html to be analysed
  // stack     - an array to be populated (can be non-empty)
  // matchExpr - a RegExp describing how to match opening/closing tags
  //             the opening/closing descriptions must be captured subexpressions
  //             so that the code can refer to match[1] to check if an opening
  //             tag has been found, and to match[2] to check if a closing tag
  //             has been found
  // cond      - a condition to be checked at each iteration. If the function
  //             returns false the processing is immediately interrupted. When
  //             called the current stack is provided to the function.
  //
  // Returns an array of strings. Each string is a tag that is still to be closed
  // (the most recent non closed tag is at the end of the array).
  parseFragment (fragment, stack, matchExpr, cond) {
    let match = fragment.match(matchExpr)
    while (match && cond(stack)) {
      if (SelfClosingTags.indexOf(match[1]) === -1) {
        const topElem = stack[stack.length - 1]

        if (match[2] && (topElem === match[2])) {
          stack.pop()
        } else if (match[1]) {
          stack.push(match[1])
        }
      }

      fragment = fragment.substr(match.index + match[0].length)
      match = fragment.match(matchExpr)
    }

    return stack
  }

  // Parses the given fragment of html code returning the last unclosed tag.
  //
  // fragment - a string containing a fragment of html code.
  //
  // Returns an array of strings. Each string is a tag that is still to be closed
  // (the most recent non closed tag is at the end of the array).
  tagsNotClosedInFragment (fragment) {
    return this.parseFragment(fragment, [], tagStartOrEndRegex, () => true)
  }

  // Parses the given fragment of html code and returns true if the given tag
  // has a matching closing tag in it. If tag is reopened and reclosed in the
  // given fragment then the end point of that pair does not count as a matching
  // closing tag.
  tagDoesNotCloseInFragment (tags, fragment) {
    if (tags.length === 0) { return false }

    let stack = tags
    const stackLength = stack.length
    const tag = tags[tags.length - 1]
    const escapedTag = _.escapeRegExp(tag)
    stack = this.parseFragment(fragment, stack, generateTagStartOrEndRegex(escapedTag), s =>
      s.length >= stackLength || s[s.length - 1] === tag
    )

    return (stack.length > 0) && (stack[stack.length - 1] === tag)
  }

  // Parses preFragment and postFragment returning the last open tag in
  // preFragment that is not closed in postFragment.
  //
  // Returns a tag name or null if it can't find it.
  closingTagForFragments (preFragment, postFragment) {
    const tags = this.tagsNotClosedInFragment(preFragment)
    const tag = tags[tags.length - 1]
    if (this.tagDoesNotCloseInFragment(tags, postFragment)) {
      return tag
    } else {
      return null
    }
  }
}
