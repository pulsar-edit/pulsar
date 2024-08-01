
exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('source.java', {
    types: ['comment', 'string_literal']
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('source.java', { types: ['comment'] });
};
