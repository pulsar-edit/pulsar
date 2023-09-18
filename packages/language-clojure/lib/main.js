exports.activate = function() {
  if (!atom.grammars.addInjectionPoint) return;

  atom.grammars.addInjectionPoint('source.clojure', {
    type: 'quoting_lit',
    language: () => 'source-edn',
    content: (node) => {
      let parent = node.parent
      while(parent) {
        if(parent.type === 'dis_expr') return null
        parent = parent.parent
      }
      return node
    },
    includeChildren: true,
    languageScope: 'source.edn',
    coverShallowerScopes: true
  });
}
