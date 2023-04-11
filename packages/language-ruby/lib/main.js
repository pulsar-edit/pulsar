exports.activate = function() {
  if (!atom.grammars.addInjectionPoint) return;

  atom.grammars.addInjectionPoint('source.ruby', {
    type: 'heredoc_body',
    language(node) {
      return node.lastChild.text;
    },
    content(node) {
      return node.descendantsOfType('heredoc_content')
    },
    // coverShallowerScopes: true
  });

  atom.grammars.addInjectionPoint('source.ruby', {
    type: 'regex',
    language() {
      return 'regex';
    },
    content(node) {
      return node;
    },
    includeChildren: true,
    // coverShallowerScopes: false
  });

  // TODO: Uncomment when performance is improved on these tree-sitter grammars.

  // atom.grammars.addInjectionPoint('source.ruby', {
  //   type: 'comment',
  //   language: () => 'todo',
  //   content: (node) => node
  // });
  //
  // atom.grammars.addInjectionPoint('source.ruby', {
  //   type: 'comment',
  //   language: () => 'hyperlink',
  //   content: (node) => node
  // });
  //
  // atom.grammars.addInjectionPoint('source.ruby', {
  //   type: 'string_content',
  //   language: () => 'hyperlink',
  //   content: (node) => node
  // });
};
