
exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('source.toml', {
    types: ['comment', 'string']
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('source.toml', { types: ['comment'] });
};
