const path = require('path')
const fs = require('fs')
const request = require('request')
const fetchTagDescriptions = require('./fetch-tag-docs')
const fetchGlobalAttributeDescriptions = require('./fetch-global-attribute-docs')

const TagsURL = 'https://raw.githubusercontent.com/adobe/brackets/master/src/extensions/default/HTMLCodeHints/HtmlTags.json'
const AttributesURL = 'https://raw.githubusercontent.com/adobe/brackets/master/src/extensions/default/HTMLCodeHints/HtmlAttributes.json'

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

    for (let tag in tags) {
      const options = tags[tag]
      if ((options.attributes != null ? options.attributes.length : undefined) === 0) { delete options.attributes }
    }

    resolve(tags)
  })
})

const tagDescriptionsPromise = fetchTagDescriptions()

const attributesPromise = new Promise((resolve) => {
  return request({json: true, url: AttributesURL}, (error, response, attributes) => {
    if (error != null) {
      console.error(error.message)
      resolve(null)
    }

    if (response.statusCode !== 200) {
      console.error(`Request for HtmlAttributes.json failed: ${response.statusCode}`)
      resolve(null)
    }

    for (let attribute in attributes) {
      const options = attributes[attribute]
      if ((options.attribOption != null ? options.attribOption.length : undefined) === 0) { delete options.attribOption }
    }

    resolve(attributes)
  })
})

const globalAttributeDescriptionsPromise = fetchGlobalAttributeDescriptions()

Promise.all([tagsPromise, tagDescriptionsPromise, attributesPromise, globalAttributeDescriptionsPromise]).then((values) => {
  const tags = values[0]
  const tagDescriptions = values[1]
  const attributes = values[2]
  const attributeDescriptions = values[3]

  for (let tag in tags) {
    tags[tag].description = tagDescriptions[tag]
  }

  for (let attribute in attributes) {
    const options = attributes[attribute]
    if (options.global) { attributes[attribute].description = attributeDescriptions[attribute] }
  }

  const completions = {tags, attributes}
  fs.writeFileSync(path.join(__dirname, 'completions.json'), `${JSON.stringify(completions, null, '  ')}\n`)
})
