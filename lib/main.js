exports.activate = function() {
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
}
