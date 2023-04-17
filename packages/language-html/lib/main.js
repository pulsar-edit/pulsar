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

  atom.grammars.addInjectionPoint('text.html.basic', {
    type: 'comment',
    language: () => 'todo',
    content: (node) => node
  });

  atom.grammars.addInjectionPoint('text.html.basic', {
    type: 'comment',
    language: () => 'hyperlink',
    content: (node) => node
  });

  atom.grammars.addInjectionPoint('text.html.basic', {
    type: 'attribute_value',
    language: () => 'hyperlink',
    content: (node) => node
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
