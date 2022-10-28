exports.activate = function() {
  if (!core.grammars.addInjectionPoint) return;

  core.grammars.addInjectionPoint('source.ruby', {
    type: 'heredoc_body',
    language(node) {
      return node.lastChild.text;
    },
    content(node) {
      return node;
    }
  });

  core.grammars.addInjectionPoint('source.ruby', {
    type: 'regex',
    language() {
      return 'regex';
    },
    content(node) {
      return node;
    }
  });
};
