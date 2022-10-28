exports.activate = function() {
  core.grammars.addInjectionPoint('text.html.basic', {
    type: 'script_element',
    language() {
      return 'javascript';
    },
    content(node) {
      return node.child(1);
    }
  });

  core.grammars.addInjectionPoint('text.html.basic', {
    type: 'style_element',
    language() {
      return 'css';
    },
    content(node) {
      return node.child(1);
    }
  });

  core.grammars.addInjectionPoint('text.html.ejs', {
    type: 'template',
    language(node) {
      return 'javascript';
    },
    content(node) {
      return node.descendantsOfType('code');
    },
    newlinesBetween: true
  });

  core.grammars.addInjectionPoint('text.html.ejs', {
    type: 'template',
    language(node) {
      return 'html';
    },
    content(node) {
      return node.descendantsOfType('content');
    }
  });

  core.grammars.addInjectionPoint('text.html.erb', {
    type: 'template',
    language(node) {
      return 'ruby';
    },
    content(node) {
      return node.descendantsOfType('code');
    },
    newlinesBetween: true
  });

  core.grammars.addInjectionPoint('text.html.erb', {
    type: 'template',
    language(node) {
      return 'html';
    },
    content(node) {
      return node.descendantsOfType('content');
    }
  });
};
