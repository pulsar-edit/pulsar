exports.activate = function() {
  atom.grammars.addInjectionPoint('text.html.basic', {
    type: 'script_element',
    language() {
      return 'javascript';
    },
    content(node) {
      return node.child(1);
    }
  });

  atom.grammars.addInjectionPoint('text.html.basic', {
    type: 'style_element',
    language() {
      return 'css';
    },
    content(node) {
      return node.child(1);
    }
  });

  const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;
  const HYPERLINK_PATTERN = /\bhttps?:/

  atom.grammars.addInjectionPoint('text.html.basic', {
    type: 'comment',
    language: (node) => {
      return TODO_PATTERN.test(node.text) ? 'todo' : undefined;
    },
    content: (node) => node,
    languageScope: null
  });

  atom.grammars.addInjectionPoint('text.html.basic', {
    type: 'comment',
    language: (node) => {
      return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : undefined;
    },
    content: (node) => node,
    languageScope: null
  });

  atom.grammars.addInjectionPoint('text.html.basic', {
    type: 'attribute_value',
    language: (node) => {
      return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : undefined;
    },
    content: (node) => node,
    languageScope: null
  });

  // TODO: Inject hyperlink grammar into plain text?

  // EMBEDDED

  atom.grammars.addInjectionPoint('text.html.ejs', {
    type: 'template',
    language() {
      return 'javascript';
    },
    content(node) {
      return node.descendantsOfType('code');
    },
    newlinesBetween: true
  });

  atom.grammars.addInjectionPoint('text.html.ejs', {
    type: 'template',
    language() {
      return 'html';
    },
    content(node) {
      return node.descendantsOfType('content');
    }
  });

  atom.grammars.addInjectionPoint('text.html.erb', {
    type: 'template',
    language() {
      return 'ruby';
    },
    content(node) {
      return node.descendantsOfType('code');
    },
    newlinesBetween: true
  });

  atom.grammars.addInjectionPoint('text.html.erb', {
    type: 'template',
    language() {
      return 'html';
    },
    content(node) {
      return node.descendantsOfType('content');
    }
  });
};
