exports.activate = function () {
  if (!atom.grammars.addInjectionPoint) return;

  // TODO: Uncomment when performance is acceptable.

  // atom.grammars.addInjectionPoint('source.python', {
  //   type: 'string',
  //   language() {
  //     return 'hyperlink';
  //   },
  //   content(node) {
  //     return node;
  //   }
  // });

  atom.grammars.addInjectionPoint('source.python', {
    type: 'string',
    language (node) {
      return (/^r(?=['"])/.test(node.text)) ? 'py-regex' : null
    },
    content (node) {
      return node.descendantsOfType('string_content')?.[0];
    },
    languageScope: null
  });
}
