exports.activate = function () {

  // Here's how we handle the mixing of PHP and HTML:
  //
  // * The root language layer uses the `tree-sitter-php` parser, and handles
  //   all tasks: highlighting, indentation, folds.
  // * HTML gets injected into all `text` nodes.
  // * A corresponding PHP injection point is created for non-text nodes and
  //   represents all non-HTML regions of the buffer.
  //
  // We do it this way so that we can limit the scope `source.php` to only
  // those ranges identified by the injection. The way the `tree-sitter-php`
  // tree is organized rules out all other options for adding scope boundaries
  // to embedded PHP ranges. And injections enjoy an ability that query
  // captures do not: they are allowed to apply their base scope to arbitrary
  // ranges of the tree. If we can describe the ranges in the `content`
  // callback, we can scope each range the way we want.
  //
  // This may seem like an odd thing to do, but it's critical for us to know
  // when we're in `source.php` and when we aren't. For instance, nearly all of
  // the snippets in `language-php` are valid only in one mode or the other.
  //
  // This means that, technically speaking, the PHP injection layer doesn't
  // have any tasks, and doesn't even need to do any parsing. If injections had
  // the option of re-using another layer's tree, we'd want to do that, but
  // right now there's not a need for such a feature.

  atom.grammars.addInjectionPoint('text.html.php', {
    type: 'program',
    language: () => 'html',
    content(node) {
      return node.descendantsOfType('text');
    },

    // We don't need a base scope for this injection because the whole file is
    // already scoped as `text.html.php`. The PHP embeds add a `source.php`
    // scope, but still has `text.html.php` as the root. This is how the TM
    // grammar works, so we're replicating it here.
    languageScope: null
  });

  atom.grammars.addInjectionPoint('text.html.php', {
    type: 'program',
    language() {
      return 'internal-php';
    },
    content(node) {
      let results = [];
      // At the top level we should ignore `text` nodes, since they're just
      // HTML. We should also ignore the middle children of
      // `text_interpolation` nodes (also `text`), but we need to include their
      // first and last children, which correspond to `?>` and `<?php`.
      //
      // In practice, it seems that `text` is always a child of the root except
      // inside of `text_interpolation`, and `text_interpolation` is always a
      // child of the root. The only exceptions I've noticed are when the tree
      // is in an error state, so they may not be worth worrying about.
      for (let child of node.children) {
        if (child.type === 'text') { continue; }
        if (child.type === 'text_interpolation') {
          for (let grandchild of child.children) {
            if (grandchild.type === 'text') { continue; }
            results.push(grandchild);
          }
          continue;
        }
        results.push(child);
      }
      return results;
    },
    includeChildren: true,
    newlinesBetween: true,
    includeAdjacentWhitespace: true
  });

  const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;
  const HYPERLINK_PATTERN = /\bhttps?:/

  function isPhpDoc(node) {
    let { text } = node;
    return text.startsWith('/**') && !text.startsWith('/***')
  }

  atom.grammars.addInjectionPoint('text.html.php', {
    type: 'comment',
    language: (node) => {
      return TODO_PATTERN.test(node.text) ? 'todo' : undefined;
    },
    content: (node) => node,
    languageScope: null
  });

  for (let type of ['comment', 'string_value']) {
    atom.grammars.addInjectionPoint('text.html.php', {
      type,
      language(node) {
        // PHPDoc can parse URLs better than we can.
        if (isPhpDoc(node)) return undefined;
        return HYPERLINK_PATTERN.test(node.text) ?
          'hyperlink' : undefined;
      },
      content: (node) => node,
      languageScope: null
    });
  }

  atom.grammars.addInjectionPoint('text.html.php', {
    type: 'heredoc',
    language(node) {
      let id = node.firstNamedChild;
      if (id.type !== 'heredoc_start') { return null; }
      console.log('returning heredoc name:', id.text);
      return id.text;
    },
    content(node) {
      let body = node.children.find(c => c.type === 'heredoc_body');
      let results = body.children.filter(c => c.type === 'string_value');
      return results;
    }
  });

  atom.grammars.addInjectionPoint('text.html.php', {
    type: 'comment',
    language(node) {
      if (isPhpDoc(node)) {
        return 'phpdoc';
      }
    },
    content(node) { return node; }
  });

};
