exports.activate = function () {
  if (!atom.grammars.addInjectionPoint) return

  atom.grammars.addInjectionPoint('text.html.basic', {
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

  atom.grammars.addInjectionPoint('text.html.ejs', {
    type: 'template',
    language (node) { return 'javascript' },
    content (node) { return node.descendantsOfType('code') }
  })

  atom.grammars.addInjectionPoint('text.html.ejs', {
    type: 'template',
    language (node) { return 'html' },
    content (node) { return node.descendantsOfType('content') }
  })

  atom.grammars.addInjectionPoint('text.html.erb', {
    type: 'template',
    language (node) { return 'ruby' },
    content (node) { return node.descendantsOfType('code') }
  })

  atom.grammars.addInjectionPoint('text.html.erb', {
    type: 'template',
    language (node) { return 'html' },
    content (node) { return node.descendantsOfType('content') }
  })
}
