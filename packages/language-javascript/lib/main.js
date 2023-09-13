exports.activate = function () {
  if (!atom.grammars.addInjectionPoint) return;

  atom.grammars.addInjectionPoint('source.js', {
    type: 'call_expression',

    language(callExpression) {
      const { firstChild } = callExpression;
      switch (firstChild.type) {
        case 'identifier':
          return languageStringForTemplateTag(firstChild.text);
        case 'call_expression':
          return languageStringForTemplateTag(firstChild.children[0].text);
        case 'member_expression':
          if (firstChild.startPosition.row === firstChild.endPosition.row) {
            return languageStringForTemplateTag(firstChild.text);
          }
      }
    },

    content(callExpression) {
      const { lastChild } = callExpression;
      if (lastChild.type === 'template_string') {
        return lastChild;
      }
    }
  });

  atom.grammars.addInjectionPoint('source.js', {
    type: 'assignment_expression',

    language(callExpression) {
      const { firstChild } = callExpression;
      if (firstChild.type === 'member_expression') {
        if (firstChild.lastChild.text === 'innerHTML') {
          return 'html';
        }
      }
    },

    content(callExpression) {
      const { lastChild } = callExpression;
      if (lastChild.type === 'template_string') {
        return lastChild;
      }
    }
  });

  atom.grammars.addInjectionPoint('source.js', {
    type: 'regex_pattern',
    language(regex) {
      return 'js-regex';
    },
    content(regex) {
      return regex;
    },
    languageScope: null
  });

  // TODO: Ideal would be to have one `language-todo` injection for the whole
  // document responsible for highlighting TODOs in all comments, but
  // performance needs to be better than it is now for that to be possible.
  // Injecting into individual line comments results in less time parsing
  // during buffer modification, but _lots_ of language layers.
  //
  // Compromise is to test the content first and then only inject a layer for
  // `language-todo` when we know it'll be needed. All this also applies for
  // `language-hyperlink`.
  //
  const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;
  const HYPERLINK_PATTERN = /\bhttps?:/

  atom.grammars.addInjectionPoint('source.js', {
    type: 'comment',
    language(comment) {
      if (comment.text.startsWith('/**')) return 'jsdoc';
    },
    content(comment) {
      return comment;
    },
    languageScope: null,
    coverShallowerScopes: true
  });

  // Experiment: better to have one layer with lots of nodes, or lots of
  // layers each managing one node?
  atom.grammars.addInjectionPoint('source.js', {
    type: 'comment',
    language: (node) => {
      return TODO_PATTERN.test(node.text) ? 'todo' : undefined;
    },
    content: (node) => node,
    languageScope: null
  });

  for (let type of ['template_string', 'string_fragment', 'comment']) {
    atom.grammars.addInjectionPoint('source.js', {
      type,
      language: (node) => {
        return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : undefined;
      },
      content: (node) => node,
      languageScope: null
    });
  }
};

const CSS_REGEX = /\bstyled\b|\bcss\b/i;
const GQL_REGEX = /\bgraphql\b|\bgql\b/i;
const SQL_REGEX = /\bsql\b/i;

function languageStringForTemplateTag(tag) {
  if (CSS_REGEX.test(tag)) {
    return 'CSS';
  } else if (GQL_REGEX.test(tag)) {
    return 'GraphQL';
  } else if (SQL_REGEX.test(tag)) {
    return 'SQL';
  } else {
    return tag;
  }
}
