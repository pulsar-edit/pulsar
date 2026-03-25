exports.activate = () => {
  // Injection for YAML front matter.
  //
  // TODO: If people want fancy front matter support, like the ability to
  // control the front matter description language, then we might try to employ
  // the technique we used for the last Markdown parser and use
  // `tree-sitter-frontmatter` as the outermost grammar.
  atom.grammars.addInjectionPoint('source.gfm', {
    type: 'minus_metadata',
    language: () => 'yaml',
    content: (node) => node
  });

  // This is a two-phase parser. The outer parser handles block-level content;
  // the inner parser handles inline content.
  atom.grammars.addInjectionPoint('source.gfm', {
    type: 'inline',
    language: () => {
      return 'markdown-inline-internal';
    },
    content: (node) => node,
    includeChildren: true,
    languageScope: null
  });

  // A separate injection layer for each block-level HTML node.
  atom.grammars.addInjectionPoint('source.gfm', {
    type: 'html_block',
    language: () => 'html',
    content: (node) => node,
    includeChildren: true
  });

  // Injections for code blocks.
  atom.grammars.addInjectionPoint('source.gfm', {
    type: 'fenced_code_block',
    language(node) {
      let infoString = node.descendantsOfType('language');
      if (infoString.length === 0) return undefined;
      return infoString[0]?.text;
    },
    content(node) {
      let codeFenceContent = node.descendantsOfType('code_fence_content');
      if (codeFenceContent.length === 0) return undefined;
      return codeFenceContent[0];
    },
    includeChildren: true
  });

  // Another HTML injection for each inline node that covers inline HTML.
  atom.grammars.addInjectionPoint('source.gfm.inline', {
    type: 'inline',
    language(node) {
      // Attempt to cut down on the number of injection layers by returning
      // `html` here only when there are HTML nodes in the inline tree.
      let html = node.descendantsOfType('html_tag');
      return html.length > 0 ? 'html' : undefined;
    },
    content(node) {
      return node.descendantsOfType('html_tag');
    },
    includeChildren: true
  });
};

exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('source.gfm.inline', {
    types: ['inline'],
    content: (node) => node,
    includeChildren: true
  });
};
