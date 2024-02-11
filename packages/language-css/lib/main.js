
exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('source.css', {
    types: ['comment', 'string_value']
  });

  // Catch things like
  //
  // @import url(https://www.example.com/style.css);
  //
  // where the URL is unquoted.
  hyperlink.addInjectionPoint('source.css', {
    types: ['call_expression'],
    language: () => 'hyperlink',
    content(node) {
      let functionName = node.descendantsOfType('function_value')[0]?.text;
      if (!functionName === 'url') { return null; }

      return node.descendantsOfType('plain_value');
    }
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('source.css', { types: ['comment'] });
};
