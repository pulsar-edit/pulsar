const path = require('path');

exports.activate = function() {
  if (!atom.grammars.addInjectionPoint) return;

  const notDisChild = (node) => {
    let parent = node.parent
    while(parent) {
      if(parent.type === 'dis_expr') return null
      parent = parent.parent
    }
    return node
  }

  atom.grammars.addInjectionPoint('source.clojure', {
    type: 'quoting_lit',
    language: () => 'source-clojure-edn',
    content: notDisChild,
    includeChildren: true,
    languageScope: 'source.clojure',
    coverShallowerScopes: true
  });

  atom.grammars.addInjectionPoint('source.clojure', {
    type: 'source',
    language: () => 'source-clojure-edn',
    content: (node, buffer) => {
      if (path.extname(buffer.getPath() ?? '') === '.edn') {
        return node
      }
    },
    includeChildren: true,
    languageScope: 'source.clojure',
    coverShallowerScopes: true
  });

  atom.grammars.addInjectionPoint('source.clojure', {
    type: 'list_lit',
    language(node) {
      if(node.children[1].text === 'js*') {
        return 'javascript'
      }
    },
    content(node) {
      if(node.children[2].type === 'str_lit') {
        return node.children[2].children[1];
      }
    },
  });
}
