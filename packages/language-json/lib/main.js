exports.activate = () => {
  const HYPERLINK_PATTERN = /\bhttps?:/
  
  atom.grammars.addInjectionPoint('source.json', {
    type: 'string_content',
    language: (node) => {
      return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : undefined;
    },
    content: (node) => node,
    languageScope: null
  });

};
