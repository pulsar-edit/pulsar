const HYPERLINK_PATTERN = /\bhttps?:/

module.exports = {
  provideHyperlinkInjection() {
    return {
      test(node) {
        return HYPERLINK_PATTERN.test(node.text);
      },

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
              return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : undefined;
            },
            content(node) {
              return options.content ? options.content(node) : node;
            },
            languageScope: null
          });
        }
      },
    }
  }
};
