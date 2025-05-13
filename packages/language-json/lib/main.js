const ROOT_SCOPES = ['source.json', 'source.json.jsonc'];

exports.consumeHyperlinkInjection = (hyperlink) => {
  for (let rootScope of ROOT_SCOPES) {
    hyperlink.addInjectionPoint(rootScope, {
      types: ['comment', 'string_content']
    });
  }
};

exports.consumeTodoInjection = (todo) => {
  for (let rootScope of ROOT_SCOPES) {
    todo.addInjectionPoint(rootScope, { types: ['comment'] });
  }
};
