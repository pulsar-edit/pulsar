
const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;

module.exports = {
  provideTodoInjection() {
    return {
      // Private: Test whether a Tree-sitter node's text contains any tokens
      // that would benefit from a TODO injection.
      //
      // Useful if you want to call {GrammarRegistry::addInjectionPoint}
      // yourself and want to use this logic in a `language` callback.
      //
      // * `node` A Tree-sitter tree node.
      test(node) {
        return TODO_PATTERN.test(node.text);
      },

      // Private: specify one or more types of syntax nodes for a given grammar
      // that may embed the TODO grammar.
      //
      // * `scopeName` The {String} ID of the parent language.
      // * `options` An {Object} with the following keys:
      //   * `types` An {Array} or {String} indicating the type or types of
      //     Tree-sitter tree nodes that may receive injections.
      //   * `language` (optional) A {Function} that may be called to add extra
      //     logic for determining which language should be used in an
      //     injection. If present, will be called before the default logic.
      //     If it returns `undefined`, the default logic will apply. If it
      //     returns a {String} or `null`, the default logic will be preempted.
      //   * `content` (optional) A {Function} that will be used to determine
      //     which of the injection node's children, if any, will be injected
      //     into. The default `content` callback is one that returns the
      //     original node.
      addInjectionPoint(scopeName, options) {
        let types = options.types;
        if (!Array.isArray(types)) types = [types];

        // TODO: Ideal would be to have one `language-todo` injection for the
        // whole document responsible for highlighting TODOs in all comments,
        // but performance needs to be better than it is now for that to be
        // possible. Injecting into individual nodes results in less time
        // parsing during buffer modification, but _lots_ of language layers.
        //
        // Compromise is to test the content first and then only inject a layer
        // for `language-todo` when we know it'll be needed.
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
