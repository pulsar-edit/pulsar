exports.activate = function () {
};

exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('source.cs', {
    types: ['comment', 'string_literal_content']
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('source.cs', { types: ['comment'] });
};
