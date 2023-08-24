exports.activate = function () {
  if (!atom.grammars.addInjectionPoint) return;

  const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;
  const HYPERLINK_PATTERN = /\bhttps?:/

  atom.grammars.addInjectionPoint('source.python', {
    type: 'comment',
    language: (node) => {
      return TODO_PATTERN.test(node.text) ? 'todo' : undefined;
    },
    content: (node) => node,
    languageScope: null
  });

  for (let type of ['comment', 'string']) {
    atom.grammars.addInjectionPoint('source.python', {
      type,
      language(node) {
        return HYPERLINK_PATTERN.test(node.text) ?
          'hyperlink' : undefined;
      },
      content: (node) => node,
      languageScope: null
    });
  }

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
