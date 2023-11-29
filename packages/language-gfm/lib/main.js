exports.activate = () => {

  // The top-level tree-sitter parser for `source.gfm` simply divides the text
  // into front matter (if it exists) and the remainder, which is directly
  // parsed as Markdown.
  //
  // We do this because the `ikatyang/tree-sitter-markdown` parser does not
  // recognize YAML front matter, but is otherwise a very strong Markdown
  // parser. If the `MDeiml/tree-sitter-markdown` parser became more stable,
  // we could consider switching, and then we wouldn't need this extra parser.

  // Hand off the front matter to the YAML injection.
  atom.grammars.addInjectionPoint('source.gfm', {
    type: 'front_matter',
    language: () => 'yaml',
    content(node) {
      return node.descendantsOfType('text');
    }
  });

  // Hand off everything else to the Markdown injection.
  atom.grammars.addInjectionPoint('source.gfm', {
    type: 'remainder',
    language: () => 'markdown',
    content: (node) => node,
    languageScope: null
  });

  // The markdown injection has a scope name of `source.gfm.embedded` so we can
  // target it for the rest of these injections, but you can see above that we
  // suppress that scope name when we inject it into a document.

  // Highlight HTML blocks.
  atom.grammars.addInjectionPoint('source.gfm.embedded', {
    type: 'html_block',
    language: () => 'html',
    content: (node) => node,
    includeChildren: true
  });

  for (let nodeType of ['paragraph', 'table_cell']) {
    atom.grammars.addInjectionPoint('source.gfm.embedded', {
      type: nodeType,
      language(node) {
        let html = node.descendantsOfType([
          'html_open_tag',
          'html_close_tag',
          'html_self_closing_tag'
        ]);
        if (html.length === 0) { return null; }
        return 'html';
      },

      content(node) {
        let html = node.descendantsOfType([
          'html_open_tag',
          'html_close_tag',
          'html_self_closing_tag'
        ]);
        return html;
      },

      includeChildren: true
    });
  }

  // All code blocks of the form
  //
  // ```foo
  // (code goes here)
  // ```
  //
  // get injections on the theory that some grammar's `injectionRegex` will
  // match `foo`.
  atom.grammars.addInjectionPoint('source.gfm.embedded', {
    type: 'fenced_code_block',
    language(node) {
      let language = node?.firstNamedChild;
      if (language?.type === 'info_string')
        return language.text;

      return null;
    },
    content(node) {
      return node.descendantsOfType('code_fence_content');
    },
    languageScope: (grammar) => `${grammar.scopeName}.embedded`,
    includeChildren: true
  });
};
