exports.activate = () => {

  atom.grammars.addInjectionPoint('source.css', {
    type: 'comment',
    language: () => 'todo',
    content: (node) => node
  });

  atom.grammars.addInjectionPoint('source.css', {
    type: 'comment',
    language: () => 'hyperlink',
    content: (node) => node
  });

  atom.grammars.addInjectionPoint('source.css', {
    type: 'string_value',
    language: () => 'hyperlink',
    content: (node) => node
  });

  // Catch things like
  //
  // @import url(https://www.example.com/style.css);
  //
  // where the URL is unquoted.
  atom.grammars.addInjectionPoint('source.css', {
    type: 'call_expression',
    language: () => 'hyperlink',
    content: (node) => {
      let functionName = node.descendantsOfType('function_value')[0]?.text;
      if (!functionName === 'url') { return null; }

      return node.descendantsOfType('plain_value');
    }
  });

};
