exports.activate = function () {
  for (const nodeType of ['macro_invocation', 'macro_rule']) {
    atom.grammars.addInjectionPoint('source.rust', {
      type: nodeType,
      language() {
        return 'rust';
      },
      content(node) {
        return node.lastChild;
      },
      includeChildren: true,
      languageScope: null,
      coverShallowerScopes: true
    });
  }
};

exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('source.rust', {
    types: [
      'line_comment',
      'block_comment',
      'string_literal',
      'raw_string_literal'
    ]
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('source.rust', {
    types: ['line_comment', 'block_comment']
  });
};
