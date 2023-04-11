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

  // TODO: There's no regex literal in Python. The TM-style grammar has a
  // very obscure option that, when enabled, assumes all raw strings are
  // regexes and highlights them accordingly. This might be worth doing in the
  // new grammar _if_ someone asks for it.

  //
  // atom.grammars.addInjectionPoint('source.python', {
  //   type: 'string',
  //   language (node) {
  //     return (/^r(?=['"])/.test(node.text)) ? 'py-regex' : null
  //   },
  //   content (node) {
  //     return node.descendantsOfType('string_content')?.[0];
  //   },
  //   languageScope: null
  // });
}
