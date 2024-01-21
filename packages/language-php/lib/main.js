const { Point, Range } = require('atom');

function isPhpDoc(node) {
  let { text } = node;
  return text.startsWith('/**') && !text.startsWith('/***')
}

function comparePoints(a, b) {
  const rows = a.row - b.row;
  if (rows === 0) {
    return a.column - b.column;
  } else {
    return rows;
  }
}

// Given a series of opening and closing PHP tags, pairs and groups them as a
// series of node specs suitable for defining the bounds of an injection.
function interpret(nodes) {
  let sorted = [...nodes].sort((a, b) => {
    return comparePoints(a.startPosition, b.startPosition);
  });

  let ranges = [];
  let currentStart = null;
  let lastIndex = nodes.length - 1;

  for (let [index, node] of sorted.entries()) {
    let isStart = node.type === 'php_tag';
    let isEnd = node.type === '?>';
    let isLast = index === lastIndex;

    if (isStart) {
      if (currentStart) {
        throw new Error('Unbalanced content!');
      }
      currentStart = node;

      if (isLast) {
        // There's no ending tag to match this starting tag. This is valid and
        // simply signifies that the rest of the file is PHP. We can return a
        // range from here to `Infinity` and let the language mode clip it to
        // the edge of the buffer.
        let spec = {
          startIndex: currentStart.startIndex,
          startPosition: currentStart.startPosition,
          endIndex: Infinity,
          endPosition: Point.INFINITY,
          range: new Range(
            currentStart.range.start,
            Point.INFINITY
          )
        };
        ranges.push(spec);
        currentStart = null;
        break;
      }
    }

    if (isEnd) {
      if (!currentStart) {
        throw new Error('Unbalanced content!');
      }
      let spec = {
        startIndex: currentStart.startIndex,
        startPosition: currentStart.startPosition,
        endIndex: node.endIndex,
        endPosition: node.endPosition,
        range: new Range(
          currentStart.range.start,
          node.range.end
        )
      };
      ranges.push(spec);
      currentStart = null;
    }
  }
  return ranges;
}

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
      // The actual structure of the tree is utter chaos for us. The best way
      // to make sense of it is to grab all the delimiters of the ranges we're
      // interested in, sort them, pair them off, and turn them into fake
      // ranges. As long as we return objects with the range properties that
      // actual nodes have, _and_ we opt into `includeChildren` (so that it
      // doesn't try to read the `children` property to subtract child nodes'
      // ranges), this works just fine.
      //
      // If you're ever skeptical about whether this is really the easiest way
      // to do this, fire up `tree-sitter-tools` and take a look at the
      // structure of a PHP file in `tree-sitter-php`. If you know of something
      // simpler, I'm all ears.
      //
      // TODO: This method should be allowed to return actual ordinary `Range`
      // instances, in which case we'd understand that no futher processing
      // need take place by the language mode.
      let boundaries = node.descendantsOfType(['php_tag', '?>']);
      return interpret(boundaries);
    },
    includeChildren: true,
    newlinesBetween: false,
    // includeAdjacentWhitespace: true,

    // For parity with the TextMate PHP grammar, we need to be able to scope
    // this region with not just `source.php` but also `meta.embedded.X.php`,
    // where X is one of `line` or `block` depending on whether the range spans
    // multiple lines.
    //
    // There is no way to do this via queries because there is no discrete node
    // against which we could conditionally add `meta.embedded.block` or
    // `meta.embedded.line`… because of the aforementioned lunacy of the tree
    // structure.
    //
    // So we had to invent a feature for it. When `languageScope` is a function,
    // it allows the injection to decide on a range-by-range basis what the
    // scope name is… _and_ it can return more than one scope name.
    languageScope(grammar, _buffer, range) {
      let extraScope = range.start.row !== range.end.row ?
        'meta.embedded.block.php' : 'meta.embedded.line.php';
      return [grammar.scopeName, extraScope];
    }
  });


  // HEREDOCS and NOWDOCS
  // ====================

  atom.grammars.addInjectionPoint('text.html.php', {
    type: 'heredoc',
    language(node) {
      let id = node.firstNamedChild;
      if (id.type !== 'heredoc_start') return null;
      return id.text;
    },
    content(node) {
      let body = node.children.find(c => c.type === 'heredoc_body');
      let results = body.children.filter(c => c.type === 'string_value');
      return results;
    }
  });

  atom.grammars.addInjectionPoint('text.html.php', {
    type: 'nowdoc',
    language(node) {
      let id = node.firstNamedChild;
      if (id.type !== 'heredoc_start') return null;
      return id.text;
    },
    content(node) {
      let body = node.children.find(c => c.type === 'nowdoc_body');
      let results = body.children.filter(c => c.type === 'nowdoc_string');
      return results;
    }
  });


  // PHPDoc
  // ======

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

// TODOs and URLs
// ==============

exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint('text.html.php', {
    types: ['comment', 'string_value'],
    language(node) {
      if (isPhpDoc(node)) return null;
    }
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint('text.html.php', { types: ['comment'] });
};
