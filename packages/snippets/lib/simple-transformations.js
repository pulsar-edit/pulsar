// Simple transformation flags that can convert a string in various ways. They
// are specified for variables and for transforming substitution
// backreferences, so we need to use them in two places.
const FLAGS = {
  // These are included in the LSP spec.
  upcase: value => (value || '').toLocaleUpperCase(),
  downcase: value => (value || '').toLocaleLowerCase(),
  capitalize: (value) => {
    return !value ? '' : (value[0].toLocaleUpperCase() + value.substr(1))
  },

  // These are supported by VSCode.
  pascalcase (value) {
    const match = value.match(/[a-z0-9]+/gi)
    if (!match) {
      return value
    }
    return match.map(word => {
      return word.charAt(0).toUpperCase() + word.substr(1)
    }).join('')
  },
  camelcase (value) {
    const match = value.match(/[a-z0-9]+/gi)
    if (!match) {
      return value
    }
    return match.map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toLowerCase() + word.substr(1)
      }
      return word.charAt(0).toUpperCase() + word.substr(1)
    }).join('')
  },

  // No reason not to implement these also.
  snakecase (value) {
    let camel = this.camelcase(value)
    return camel.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
  },

  kebabcase (value) {
    let camel = this.camelcase(value)
    return camel.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
  }
}

module.exports = FLAGS
