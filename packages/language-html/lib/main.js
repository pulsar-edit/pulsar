exports.activate = function () {
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

exports.consumeHyperlinkInjection = (hyperlink) => {
  // TODO: Inject hyperlink grammar into plain text?
  hyperlink.addInjectionPoint('text.html.basic', {
    types: ['comment', 'attribute_value']
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('text.html.basic', { types: ['comment'] });
};
