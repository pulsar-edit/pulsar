const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;

module.exports = {
  provideTodoInjection() {
    return {
      test(node) {
        return TODO_PATTERN.test(node.text);
      },

      // TODO: Ideal would be to have one `language-todo` injection for the
      // whole document responsible for highlighting TODOs in all comments, but
      // performance needs to be better than it is now for that to be possible.
      // Injecting into individual nodes results in less time parsing during
      // buffer modification, but _lots_ of language layers.
      //
      // Compromise is to test the content first and then only inject a layer
      // for `language-todo` when we know it'll be needed.
      addInjectionPoint(scopeName, options) {
        let types = options.types;
        if (!Array.isArray(types)) types = [types];

        for (let type of types) {
          atom.grammars.addInjectionPoint(scopeName, {
            type,
            language(node) {
              if (options.language) {
                let result = options.language(node);
                if (result !== undefined) return result;
              }
              return TODO_PATTERN.test(node.text) ? 'todo' : undefined;
            },
            content(node) {
              return options.content ? options.content(node) : node;
            },
            languageScope: null
          });
        }
      }
    };
  }
};
