exports.activate = () => {
  const HYPERLINK_PATTERN = /\bhttps?:/
  const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;

  atom.grammars.addInjectionPoint('source.yaml', {
    type: 'comment',
    language: (node) => {
      return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : undefined;
    },
    content: (node) => node,
    languageScope: null
  });

  atom.grammars.addInjectionPoint('source.yaml', {
    type: 'comment',
    language: (node) => {
      return TODO_PATTERN.test(node.text) ? 'todo' : undefined;
    },
    content: (node) => node,
    languageScope: null
  });

};
