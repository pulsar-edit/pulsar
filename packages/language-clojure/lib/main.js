const path = require('path');

exports.activate = function() {
  if (!atom.grammars.addInjectionPoint) return;

  atom.grammars.addInjectionPoint('source.clojure', {
    type: 'quoting_lit',
    language: () => 'source-clojure-edn',
    content: (node) => {
      let parent = node.parent
      while(parent) {
        if(parent.type === 'dis_expr') return null
        parent = parent.parent
      }
      return node
    },
    includeChildren: true,
    languageScope: 'source.clojure',
    coverShallowerScopes: true
  });

  atom.grammars.addInjectionPoint('source.clojure', {
    type: 'source',
    language: () => 'source-clojure-edn',
    content: (node, buffer) => {
      if(path.extname(buffer.getPath()) === '.edn') {
        return node
      }
    },
    includeChildren: true,
    languageScope: 'source.clojure',
    coverShallowerScopes: true
  });
}
