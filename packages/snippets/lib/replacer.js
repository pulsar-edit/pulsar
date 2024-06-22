const FLAGS = require('./simple-transformations')

const ESCAPES = {
  u: (flags) => {
    flags.lowercaseNext = false
    flags.uppercaseNext = true
  },
  l: (flags) => {
    flags.uppercaseNext = false
    flags.lowercaseNext = true
  },
  U: (flags) => {
    flags.lowercaseAll = false
    flags.uppercaseAll = true
  },
  L: (flags) => {
    flags.uppercaseAll = false
    flags.lowercaseAll = true
  },
  E: (flags) => {
    flags.uppercaseAll = false
    flags.lowercaseAll = false
  },
  r: (flags, result) => {
    result.push('\\r')
  },
  n: (flags, result) => {
    result.push('\\n')
  },
  $: (flags, result) => {
    result.push('$')
  }
}

function transformTextWithFlags (str, flags) {
  if (flags.uppercaseAll) {
    return str.toUpperCase()
  } else if (flags.lowercaseAll) {
    return str.toLowerCase()
  } else if (flags.uppercaseNext) {
    flags.uppercaseNext = false
    return str.replace(/^./, s => s.toUpperCase())
  } else if (flags.lowercaseNext) {
    return str.replace(/^./, s => s.toLowerCase())
  }
  return str
}


// `Replacer` handles shared substitution semantics for tabstop and variable
// transformations.
class Replacer {
  constructor (tokens) {
    this.tokens = [...tokens]
    this.resetFlags()
  }

  resetFlags () {
    this.flags = {
      uppercaseAll: false,
      lowercaseAll: false,
      uppercaseNext: false,
      lowercaseNext: false
    }
  }

  replace (...match) {
    let result = []

    function handleToken (token) {
      if (typeof token === 'string') {
        result.push(transformTextWithFlags(token, this.flags))
      } else if (token.escape) {
        ESCAPES[token.escape](this.flags, result)
      } else if (token.backreference) {
        if (token.transform && (token.transform in FLAGS)) {
          let transformed = FLAGS[token.transform](match[token.backreference])
          result.push(transformed)
        } else {
          let {iftext, elsetext} = token
          if (iftext != null && elsetext != null) {
            // If-else syntax makes choices based on the presence or absence of a
            // capture group backreference.
            let m = match[token.backreference]
            let tokenToHandle = m ? iftext : elsetext
            if (Array.isArray(tokenToHandle)) {
              result.push(...tokenToHandle.map(handleToken.bind(this)))
            } else {
              result.push(handleToken.call(this, tokenToHandle))
            }
          } else {
            let transformed = transformTextWithFlags(
              match[token.backreference],
              this.flags
            )
            result.push(transformed)
          }
        }
      }
    }

    this.tokens.forEach(handleToken.bind(this))
    return result.join('')
  }
}

module.exports = Replacer
