const Replacer = require('./replacer')

class Insertion {
  constructor ({range, substitution, references}) {
    this.range = range
    this.substitution = substitution
    this.references = references
    if (substitution) {
      if (substitution.replace === undefined) {
        substitution.replace = ''
      }
      this.replacer = new Replacer(substitution.replace)
    }
  }

  isTransformation () {
    return !!this.substitution
  }

  transform (input) {
    let {substitution} = this
    if (!substitution) { return input }
    this.replacer.resetFlags()
    return input.replace(substitution.find, (...args) => {
      let result = this.replacer.replace(...args)
      return result
    })
  }
}

module.exports = Insertion
