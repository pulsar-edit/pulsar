
exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('source.yaml', {
    types: ['comment']
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('source.yaml', { types: ['comment'] });
};
