exports.activate = function() {
  if (!atom.grammars.addInjectionPoint) return

  atom.grammars.addInjectionPoint('html', {
    type: 'raw_element',

    language (node) {
      const openTag = node.firstChild;
      if (openTag.child(1).text === 'script') {
        return 'javascript'
      } else {
        return 'css'
      }
    },

    content (node) {
      return node.child(1)
    }
  })

  atom.grammars.addInjectionPoint('ejs', {
    type: 'template',

    language (node) { return 'javascript' },

    content (node) {
      return node.descendantsOfType('code')
    }
  })

  atom.grammars.addInjectionPoint('ejs', {
    type: 'template',

    language (node) { return 'html' },

    content (node) {
      return node.descendantsOfType('content')
    }
  })
}
