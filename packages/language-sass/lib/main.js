
exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('source.css.scss', {
    types: ['comment', 'single_line_comment']
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('source.css.scss', {
    types: ['comment', 'single_line_comment']
  });
};
