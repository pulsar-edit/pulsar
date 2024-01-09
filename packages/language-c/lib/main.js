exports.activate = function () {
  // Highlight macro bodies as C/C++
  for (const language of ['c', 'cpp']) {
    for (const nodeType of ['preproc_def', 'preproc_function_def']) {
      atom.grammars.addInjectionPoint(`source.${language}`, {
        type: nodeType,
        language() {
          return language;
        },
        content(node) {
          return node.lastNamedChild;
        }
      });
    }

    const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;
    const HYPERLINK_PATTERN = /\bhttps?:/

    atom.grammars.addInjectionPoint(`source.${language}`, {
      type: 'comment',
      language: (node) => {
        return TODO_PATTERN.test(node.text) ? 'todo' : undefined;
      },
      content: (node) => node,
      languageScope: null
    });

    for (let type of ['string_literal', 'comment']) {
      atom.grammars.addInjectionPoint(`source.${language}`, {
        type,
        language: (node) => {
          return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : undefined;
        },
        content: (node) => node,
        languageScope: null
      });
    }
  }
};
