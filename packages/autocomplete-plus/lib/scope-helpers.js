'use babel'

import slick from 'atom-slick'

const EscapeCharacterRegex = /[-!"#$%&'*+,/:;=?@|^~()<>{}[\]]/g

const cachedMatchesBySelector = {}

const getCachedMatch = (selector, scopeChain) => {
  const cachedMatchesByScopeChain = cachedMatchesBySelector[selector]
  if (cachedMatchesByScopeChain) {
    return cachedMatchesByScopeChain[scopeChain]
  }
}

const setCachedMatch = (selector, scopeChain, match) => {
  let cachedMatchesByScopeChain = cachedMatchesBySelector[selector]
  if (!cachedMatchesByScopeChain) {
    cachedMatchesByScopeChain = {}
    cachedMatchesBySelector[selector] = cachedMatchesByScopeChain
  }
  cachedMatchesByScopeChain[scopeChain] = match
  cachedMatchesByScopeChain[scopeChain]
}

const parseScopeChain = (scopeChain) => {
  scopeChain = scopeChain.replace(EscapeCharacterRegex, (match) => {
    return '\\' + match[0]
  })

  const parsed = slick.parse(scopeChain)[0]
  if (!parsed || parsed.length === 0) {
    return []
  }

  const result = []
  for (let i = 0; i < parsed.length; i++) {
    result.push(parsed[i])
  }

  return result
}

const selectorForScopeChain = (selectors, scopeChain) => {
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i]
    const cachedMatch = getCachedMatch(selector, scopeChain)
    if (cachedMatch != null) {
      if (cachedMatch) {
        return selector
      } else {
        continue
      }
    } else {
      const scopes = parseScopeChain(scopeChain)
      while (scopes.length > 0) {
        if (selector.matches(scopes)) {
          setCachedMatch(selector, scopeChain, true)
          return selector
        }
        scopes.pop()
      }
      setCachedMatch(selector, scopeChain, false)
    }
  }

  return null
}

const selectorsMatchScopeChain = (selectors, scopeChain) => { return selectorForScopeChain(selectors, scopeChain) != null }

const buildScopeChainString = (scopes) => { return `.${scopes.join(' .')}` }

export { selectorsMatchScopeChain, selectorForScopeChain, buildScopeChainString }
