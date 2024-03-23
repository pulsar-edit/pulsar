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
      if(path.extname(buffer.getPath()) === '.edn') {
        return node
      }
    },
    includeChildren: true,
    languageScope: 'source.clojure',
    coverShallowerScopes: true
  });

  const checkFormCall = (specialFormText, node) => {
    let parent = node.parent
    let grandparent = parent?.parent
    return grandparent?.type === 'list_lit' &&
      grandparent.children[1].text === specialFormText &&
      grandparent.children[2].id === parent.id
  }

  atom.grammars.addInjectionPoint('source.clojure', {
    type: 'str_content',
    language: (node) => checkFormCall('js*', node) && 'javascript',
    content: notDisChild,
    includeChildren: true,
    languageScope: 'source.js',
    coverShallowerScopes: true
  });

  atom.grammars.addInjectionPoint('source.clojure', {
    type: 'str_content',
    language: (node) => checkFormCall('native/raw', node) && 'cpp',
    content: notDisChild,
    includeChildren: true,
    languageScope: 'source.cpp',
    coverShallowerScopes: true
  });
}
