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
  }
};

exports.consumeHyperlinkInjection = (hyperlink) => {
  for (const language of ['c', 'cpp']) {
    hyperlink.addInjectionPoint(`source.${language}`, {
      types: ['comment', 'string_literal']
    });
  }
};

exports.consumeTodoInjection = (todo) => {
  for (const language of ['c', 'cpp']) {
    todo.addInjectionPoint(`source.${language}`, { types: ['comment'] });
  }
};
