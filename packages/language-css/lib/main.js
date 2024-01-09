exports.activate = () => {

  const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;
  const HYPERLINK_PATTERN = /\bhttps?:/

  atom.grammars.addInjectionPoint('source.css', {
    type: 'comment',
    language(node) {
      return TODO_PATTERN.test(node.text) ? 'todo' : undefined;
    },
    content: (node) => node,
    languageScope: null
  });

  for (let type of ['comment', 'string_value']) {
    atom.grammars.addInjectionPoint('source.css', {
      type,
      language(node) {
        return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : undefined;
      },
      content: (node) => node,
      languageScope: null
    });
  }

  // Catch things like
  //
  // @import url(https://www.example.com/style.css);
  //
  // where the URL is unquoted.
  atom.grammars.addInjectionPoint('source.css', {
    type: 'call_expression',
    language: () => 'hyperlink',
    content: (node) => {
      let functionName = node.descendantsOfType('function_value')[0]?.text;
      if (!functionName === 'url') { return null; }

      return node.descendantsOfType('plain_value');
    },
    languageScope: null
  });

};
