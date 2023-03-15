const path = require('path')
const fs = require('fs')
const request = require('request')

const mdnHTMLURL = 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes'
const mdnJSONAPI = 'https://developer.mozilla.org/en-US/search.json?topic=html&highlight=false'
const AttributesURL = 'https://raw.githubusercontent.com/adobe/brackets/master/src/extensions/default/HTMLCodeHints/HtmlAttributes.json'

const fetch = () => {
  const attributesPromise = new Promise((resolve) => {
    request({json: true, url: AttributesURL}, (error, response, attributes) => {
      if (error) {
        console.error(error.message)
        resolve(null)
      }

      if (response.statusCode !== 200) {
        console.error(`Request for HtmlAttributes.json failed: ${response.statusCode}`)
        resolve(null)
      }

      resolve(attributes)
    })
  })

  attributesPromise.then((attributes) => {
    if (!attributes) return

    const MAX = 10
    const queue = []
    for (let attribute in attributes) {
      // MDN is missing docs for aria attributes and on* event handlers
      const options = attributes[attribute]
      if (options.global && !attribute.startsWith('aria') && !attribute.startsWith('on') && (attribute !== 'role')) {
        queue.push(attribute)
      }
    }
    const running = []
    const docs = {}

    return new Promise((resolve) => {
      const checkEnd = () => {
        if ((queue.length === 0) && (running.length === 0)) resolve(docs)
      }

      const removeRunning = (attributeName) => {
        const index = running.indexOf(attributeName)
        if (index > -1) { running.splice(index, 1) }
      }

      const runNext = () => {
        checkEnd()
        if (queue.length !== 0) {
          const attributeName = queue.pop()
          running.push(attributeName)
          run(attributeName)
        }
      }

      var run = (attributeName) => {
        const url = `${mdnJSONAPI}&q=${attributeName}`
        request({json: true, url}, (error, response, searchResults) => {
          if (!error && response.statusCode === 200) {
            handleRequest(attributeName, searchResults)
          } else {
            console.error(`Req failed ${url}; ${response.statusCode}, ${error}`)
          }
          removeRunning(attributeName)
          runNext()
        })
      }

      var handleRequest = (attributeName, searchResults) => {
        if (searchResults.documents) {
          for (let doc of searchResults.documents) {
            if (doc.url === `${mdnHTMLURL}/${attributeName}`) {
              docs[attributeName] = filterExcerpt(attributeName, doc.excerpt)
              return
            }
          }
        }
        console.log(`Could not find documentation for ${attributeName}`)
      }

      for (let i = 0; i <= MAX; i++) runNext()
    })
  })
}

var filterExcerpt = (attributeName, excerpt) => {
  const beginningPattern = /^the [a-z-]+ global attribute (is )?(\w+)/i
  excerpt = excerpt.replace(beginningPattern, (match) => {
    const matches = beginningPattern.exec(match)
    const firstWord = matches[2]
    return firstWord[0].toUpperCase() + firstWord.slice(1)
  })
  const periodIndex = excerpt.indexOf('.')
  if (periodIndex > -1) { excerpt = excerpt.slice(0, periodIndex + 1) }
  return excerpt
}

// Save a file if run from the command line
if (require.main === module) {
  fetch().then((docs) => {
    if (docs) {
      fs.writeFileSync(path.join(__dirname, 'global-attribute-docs.json'), `${JSON.stringify(docs, null, '  ')}\n`)
    } else {
      console.error('No docs')
    }
  })
}

module.exports = fetch
