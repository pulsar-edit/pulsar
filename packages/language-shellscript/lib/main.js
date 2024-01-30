
exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('source.shell', {
    types: ['comment']
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('source.shell', { types: ['comment'] });
};
