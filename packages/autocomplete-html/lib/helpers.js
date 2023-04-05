const COMPLETIONS = require('../completions.json')

function getTagNameCompletions (prefix) {
  const completions = []
  for (const tag in COMPLETIONS.tags) {
    const options = COMPLETIONS.tags[tag]
    if (firstCharsEqual(tag, prefix)) {
      const {description} = options
      completions.push({
        text: tag,
        type: 'tag',
        description: description || `HTML <${tag}> tag`,
        descriptionMoreURL: description ? getTagDocsURL(tag) : null
      })
    }
  }
  return completions
}

function getAttributeNameCompletions (tag, prefix) {
  const completions = []
  const tagAttributes = getTagAttributes(tag)

  for (const attribute of tagAttributes) {
    if (firstCharsEqual(attribute, prefix)) {
      const options = COMPLETIONS.attributes[attribute]
      completions.push({
        snippet: (options && options.type === 'flag') ? attribute : `${attribute}="$1"$0`,
        displayText: attribute,
        type: 'attribute',
        rightLabel: `<${tag}>`,
        description: `${attribute} attribute local to <${tag}> tags`,
        descriptionMoreURL: getLocalAttributeDocsURL(attribute, tag)
      })
    }
  }

  for (const attribute in COMPLETIONS.attributes) {
    const options = COMPLETIONS.attributes[attribute]
    if (options.global && firstCharsEqual(attribute, prefix)) {
      completions.push({
        snippet: options.type === 'flag' ? attribute : `${attribute}="$1"$0`,
        displayText: attribute,
        type: 'attribute',
        description: options.description ? options.description : `Global ${attribute} attribute`,
        descriptionMoreURL: options.description ? getGlobalAttributeDocsURL(attribute) : null
      })
    }
  }

  return completions
}

function getAttributeValueCompletions (tag, attribute, prefix) {
  const completions = []

  const values = getAttributeValues(tag, attribute)
  for (const value of values) {
    if (firstCharsEqual(value, prefix)) {
      completions.push(buildAttributeValueCompletion(tag, attribute, value))
    }
  }

  if (
    completions.length === 0 &&
    COMPLETIONS.attributes[attribute] &&
    COMPLETIONS.attributes[attribute].type === 'boolean'
  ) {
    completions.push(buildAttributeValueCompletion(tag, attribute, 'true'))
    completions.push(buildAttributeValueCompletion(tag, attribute, 'false'))
  }

  return completions
}

function buildAttributeValueCompletion (tag, attribute, value) {
  if (COMPLETIONS.attributes[attribute].global) {
    return {
      text: value,
      type: 'value',
      description: `${value} value for global ${attribute} attribute`,
      descriptionMoreURL: getGlobalAttributeDocsURL(attribute)
    }
  } else {
    return {
      text: value,
      type: 'value',
      rightLabel: `<${tag}>`,
      description: `${value} value for ${attribute} attribute local to <${tag}>`,
      descriptionMoreURL: getLocalAttributeDocsURL(attribute, tag)
    }
  }
}

function getAttributeValues (tag, attribute) {
  // Some local attributes are valid for multiple tags but have different attribute values
  // To differentiate them, they are identified in the completions file as tag/attribute
  let result = COMPLETIONS.attributes[`${tag}/${attribute}`]
  if (result && result.attribOption) return result.attribOption
  result = COMPLETIONS.attributes[attribute]
  if (result && result.attribOption) return result.attribOption
  return []
}

function getTagAttributes (tag) {
  let result = COMPLETIONS.tags[tag]
  if (result && result.attributes) return result.attributes
  return []
}

function getLocalAttributeDocsURL (attribute, tag) {
  return `${getTagDocsURL(tag)}#attributes`
}

function getGlobalAttributeDocsURL (attribute) {
  return `https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/${attribute}`
}

function getTagDocsURL (tag) {
  return `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${tag}`
}

function firstCharsEqual (a, b) {
  if (b.length === 0) return true
  return a[0].toLowerCase() === b[0].toLowerCase()
}

module.exports = {
  getTagNameCompletions,
  getAttributeNameCompletions,
  getAttributeValueCompletions
}
