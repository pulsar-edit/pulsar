'use babel'

export default class SnippetParser {
  reset () {
    this.inSnippet = false
    this.inSnippetBody = false
    this.snippetStart = -1
    this.snippetEnd = -1
    this.bodyStart = -1
    this.bodyEnd = -1
    this.escapedBraceIndices = null
  }

  findSnippets (text) {
    if (text.length <= 0 || text.indexOf('$') === -1) { return } // No snippets
    this.reset()
    const snippets = []

    // We're not using a regex because escaped right braces cannot be tracked without lookbehind,
    // which doesn't exist yet for javascript; consequently we need to iterate through each character.
    // This might feel ugly, but it's necessary.
    for (let index = 0; index < text.length; index++) {
      if (this.inSnippet && this.snippetEnd === index) {
        let body = text.slice(this.bodyStart, this.bodyEnd + 1)
        body = this.removeBraceEscaping(body, this.bodyStart, this.escapedBraceIndices)
        snippets.push({snippetStart: this.snippetStart, snippetEnd: this.snippetEnd, bodyStart: this.bodyStart, bodyEnd: this.bodyEnd, body})
        this.reset()
        continue
      }

      if (this.inSnippet && index >= this.bodyStart && index <= this.bodyEnd) { this.inBody = true }
      if (this.inSnippet && (index > this.bodyEnd || index < this.bodyStart)) { this.inBody = false }
      if (this.bodyStart === -1 || this.bodyEnd === -1) { this.inBody = false }
      if (this.inSnippet && !this.inBody) { continue }
      if (this.inSnippet && this.inBody) { continue }

      // Determine if we've found a new snippet
      if (!this.inSnippet && text.indexOf('${', index) === index) {
        // Find index of colon
        let colonIndex = text.indexOf(':', index + 3)
        if (colonIndex !== -1) {
          // Disqualify snippet unless the text between '${' and ':' are digits
          const groupStart = index + 2
          const groupEnd = colonIndex - 1
          if (groupEnd >= groupStart) {
            for (let i = groupStart; i < groupEnd; i++) {
              if (isNaN(parseInt(text.charAt(i)))) { colonIndex = -1 }
            }
          } else {
            colonIndex = -1
          }
        }

        // Find index of '}'
        let rightBraceIndex = -1
        if (colonIndex !== -1) {
          let i = index + 4
          while (true) {
            rightBraceIndex = text.indexOf('}', i)
            if (rightBraceIndex === -1) { break }
            if (text.charAt(rightBraceIndex - 1) === '\\') {
              if (this.escapedBraceIndices == null) { this.escapedBraceIndices = [] }
              this.escapedBraceIndices.push(rightBraceIndex - 1)
            } else {
              break
            }
            i = rightBraceIndex + 1
          }
        }

        if (colonIndex !== -1 && rightBraceIndex !== -1 && colonIndex < rightBraceIndex) {
          this.inSnippet = true
          this.inBody = false
          this.snippetStart = index
          this.snippetEnd = rightBraceIndex
          this.bodyStart = colonIndex + 1
          this.bodyEnd = rightBraceIndex - 1
          continue
        } else {
          this.reset()
        }
      }
    }

    return snippets
  }

  removeBraceEscaping (body, bodyStart, escapedBraceIndices) {
    if (escapedBraceIndices != null) {
      for (let i = 0; i < escapedBraceIndices.length; i++) {
        const bodyIndex = escapedBraceIndices[i]
        body = removeCharFromString(body, bodyIndex - bodyStart - i)
      }
    }
    return body
  }
};

const removeCharFromString = (str, index) => str.slice(0, index) + str.slice(index + 1)
