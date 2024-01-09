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

  const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;
  const HYPERLINK_PATTERN = /\bhttps?:/

  for (let type of ['line_comment', 'block_comment']) {
    atom.grammars.addInjectionPoint('source.rust', {
      type,
      language: (node) => {
        return TODO_PATTERN.test(node.text) ? 'todo' : undefined;
      },
      content: (node) => node,
      languageScope: null
    });
  }

  for (let type of ['string_literal', 'raw_string_literal', 'line_comment', 'block_comment']) {
    atom.grammars.addInjectionPoint('source.rust', {
      type,
      language: (node) => {
        return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : undefined;
      },
      content: (node) => node,
      languageScope: null
    });
  }
};
