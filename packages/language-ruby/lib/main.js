exports.activate = function () {
  if (!atom.grammars.addInjectionPoint) return;

  atom.grammars.addInjectionPoint('source.ruby', {
    type: 'heredoc_body',
    language(node) {
      return node.lastChild.text;
    },
    content(node) {
      return node.descendantsOfType('heredoc_content')
    },
  });

  atom.grammars.addInjectionPoint('source.ruby', {
    type: 'regex',
    language() {
      return 'rb-regex';
    },
    content(node) {
      return node;
    },
    languageScope: null,
    includeChildren: true,
    // coverShallowerScopes: false
  });

  const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;
  const HYPERLINK_PATTERN = /\bhttps?:/

  atom.grammars.addInjectionPoint('source.ruby', {
    type: 'comment',
    language: (node) => {
      return TODO_PATTERN.test(node.text) ? 'todo' : null;
    },
    content: (node) => node,
    languageScope: null
  });

  atom.grammars.addInjectionPoint('source.ruby', {
    type: 'comment',
    language: (node) => {
      return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : null;
    },
    content: (node) => node,
    languageScope: null
  });

  atom.grammars.addInjectionPoint('source.ruby', {
    type: 'string_content',
    language: (node) => {
      return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : null;
    },
    content: (node) => node,
    languageScope: null
  });
};
