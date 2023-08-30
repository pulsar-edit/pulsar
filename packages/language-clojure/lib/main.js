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

  atom.grammars.addInjectionPoint('source.clojure', {
    type: 'syn_quoting_lit',
    language: () => 'source-quoted-clojure',
    content: (node) => node,
    includeChildren: true,
    languageScope: 'source.quoted.clojure',
    coverShallowerScopes: true
  });

  ['unquoting_lit', 'unquote_splicing_lit'].forEach(scope => {
    atom.grammars.addInjectionPoint('source.quoted.clojure', {
      type: scope,
      language: () => 'source-clojure',
      content: (node) => node,
      includeChildren: true,
      languageScope: 'source.clojure',
      coverShallowerScopes: true
    });
  })
}
