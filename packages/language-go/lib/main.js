
exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('source.go', {
    types: ['comment', 'interpreted_string_literal', 'raw_string_literal']
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('source.go', { types: ['comment'] });
};
