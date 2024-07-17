const {Point, Range} = require('atom')
const TabStopList = require('./tab-stop-list')
const Variable = require('./variable')

function tabStopsReferencedWithinTabStopContent (segment) {
  const results = []
  for (const item of segment) {
    if (item.index) {
      results.push(item.index, ...tabStopsReferencedWithinTabStopContent(item.content))
    }
  }
  return new Set(results)
}

module.exports = class Snippet {
  constructor (attrs) {
    let {
      id,
      bodyText,
      bodyTree,
      command,
      description,
      descriptionMoreURL,
      leftLabel,
      leftLabelHTML,
      name,
      prefix,
      packageName,
      rightLabelHTML,
      selector
    } = attrs

    this.id = id
    this.name = name
    this.prefix = prefix
    this.command = command
    this.packageName = packageName
    this.bodyText = bodyText
    this.description = description
    this.descriptionMoreURL = descriptionMoreURL
    this.rightLabelHTML = rightLabelHTML
    this.leftLabel = leftLabel
    this.leftLabelHTML = leftLabelHTML
    this.selector = selector

    this.variables = []
    this.tabStopList = new TabStopList(this)
    this.body = this.extractTokens(bodyTree)

    if (packageName && command) {
      this.commandName = `${packageName}:${command}`
    }
  }

  extractTokens (bodyTree) {
    const bodyText = []
    let row = 0, column = 0

    let extract = bodyTree => {
      for (let segment of bodyTree) {
        if (segment.index != null) {
          // Tabstop.
          let {index, content, substitution} = segment
          // Ensure tabstop `$0` is always last.
          if (index === 0) { index = Infinity }

          const start = [row, column]
          extract(content)

          const referencedTabStops = tabStopsReferencedWithinTabStopContent(content)

          const range = new Range(start, [row, column])

          const tabStop = this.tabStopList.findOrCreate({
            index, snippet: this
          })

          tabStop.addInsertion({
            range,
            substitution,
            references: [...referencedTabStops]
          })
        } else if (segment.variable != null) {
          // Variable.
          let point = new Point(row, column)
          this.variables.push(
            new Variable({...segment, point, snippet: this})
          )
        } else if (typeof segment === 'string') {
          bodyText.push(segment)
          let segmentLines = segment.split('\n')
          column += segmentLines.shift().length
          let nextLine
          while ((nextLine = segmentLines.shift()) != null) {
            row += 1
            column = nextLine.length
          }
        }
      }
    }

    extract(bodyTree)
    this.lineCount = row + 1
    this.insertions = this.tabStopList.getInsertions()

    return bodyText.join('')
  }

}
