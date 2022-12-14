/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const path = require('path')
const fs = require('fs')
const request = require('request')

const mdnHTMLURL = 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element'
const mdnJSONAPI = 'https://developer.mozilla.org/en-US/search.json?topic=html&highlight=false'
const TagsURL = 'https://raw.githubusercontent.com/adobe/brackets/master/src/extensions/default/HTMLCodeHints/HtmlTags.json'

const fetch = () => {
  const tagsPromise = new Promise((resolve) => {
    request({json: true, url: TagsURL}, (error, response, tags) => {
      if (error != null) {
        console.error(error.message)
        resolve(null)
      }

      if (response.statusCode !== 200) {
        console.error(`Request for HtmlTags.json failed: ${response.statusCode}`)
        resolve(null)
      }

      resolve(tags)
    })
  })

  return tagsPromise.then((tags) => {
    if (!tags) return

    const MAX = 10
    const queue = Object.keys(tags)
    const running = []
    const docs = {}

    return new Promise((resolve) => {
      const checkEnd = () => {
        if ((queue.length === 0) && (running.length === 0)) resolve(docs)
      }

      const removeRunning = (tagName) => {
        const index = running.indexOf(tagName)
        if (index > -1) { return running.splice(index, 1) }
      }

      const runNext = () => {
        checkEnd()
        if (queue.length !== 0) {
          const tagName = queue.pop()
          running.push(tagName)
          run(tagName)
        }
      }

      var run = (tagName) => {
        const url = `${mdnJSONAPI}&q=${tagName}`
        request({json: true, url}, (error, response, searchResults) => {
          if ((error == null) && (response.statusCode === 200)) {
            handleRequest(tagName, searchResults)
          } else {
            console.error(`Req failed ${url}; ${response.statusCode}, ${error}`)
          }
          removeRunning(tagName)
          runNext()
        })
      }

      var handleRequest = (tagName, searchResults) => {
        if (searchResults.documents != null) {
          for (let doc of searchResults.documents) {
            // MDN groups h1 through h6 under a single "Heading Elements" page
            if ((doc.url === `${mdnHTMLURL}/${tagName}`) || (/^h\d$/.test(tagName) && (doc.url === `${mdnHTMLURL}/Heading_Elements`))) {
              if (doc.tags.includes('Obsolete')) {
                docs[tagName] = `The ${tagName} element is obsolete. Avoid using it and update existing code if possible.`
              } else if (doc.tags.includes('Deprecated')) {
                docs[tagName] = `The ${tagName} element is deprecated. Avoid using it and update existing code if possible.`
              } else {
                docs[tagName] = filterExcerpt(tagName, doc.excerpt)
              }
              return
            }
          }
        }
        console.log(`Could not find documentation for ${tagName}`)
      }

      for (let i = 0; i <= MAX; i++) { runNext() }
    })
  })
}

var filterExcerpt = (tagName, excerpt) => {
  const beginningPattern = /^the html [a-z-]+ element (\([^)]+\) )?(is )?(\w+)/i
  excerpt = excerpt.replace(beginningPattern, (match) => {
    const matches = beginningPattern.exec(match)
    const firstWord = matches[3]
    return firstWord[0].toUpperCase() + firstWord.slice(1)
  })
  const periodIndex = excerpt.indexOf('.')
  if (periodIndex > -1) { excerpt = excerpt.slice(0, periodIndex + 1) }
  return excerpt
}

// Save a file if run from the command line
if (require.main === module) {
  fetch().then((docs) => {
    if (docs != null) {
      fs.writeFileSync(path.join(__dirname, 'tag-docs.json'), `${JSON.stringify(docs, null, '  ')}\n`)
    } else {
      console.error('No docs')
    }
  })
}

module.exports = fetch
