exports.activate = function () {
  for (const scopeName of ['source.ts', 'source.tsx', 'source.flow']) {
    atom.grammars.addInjectionPoint(scopeName, {
      type: 'comment',
      language(comment) {
        if (comment.text.startsWith('/**')) return 'jsdoc';
      },
      content(comment) {
        return comment;
      },
      languageScope: null,
      // coverShallowerScopes: true
    });

    atom.grammars.addInjectionPoint(scopeName, {
      type: 'call_expression',

      language(callExpression) {
        const { firstChild } = callExpression;
        switch (firstChild.type) {
          case 'identifier':
            return languageStringForTemplateTag(firstChild.text);
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

    atom.grammars.addInjectionPoint(scopeName, {
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

    atom.grammars.addInjectionPoint(scopeName, {
      type: 'regex_pattern',
      language() {
        return 'js-regex';
      },
      content(regex) {
        return regex;
      },
      languageScope: null
    });

    atom.grammars.addInjectionPoint(scopeName, {
      type: 'comment',
      language: (node) => {
        return TODO_PATTERN.test(node.text) ? 'todo' : undefined;
      },
      content: (node) => node,
      languageScope: null
    });

    for (let type of ['template_string', 'string_fragment', 'comment']) {
      atom.grammars.addInjectionPoint(scopeName, {
        type,
        language: (node) => {
          return HYPERLINK_PATTERN.test(node.text) ? 'hyperlink' : undefined;
        },
        content: (node) => node,
        languageScope: null
      });
    }
  }
};

const TODO_PATTERN = /\b(TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|REVIEW|NB|BUG|QUESTION|COMBAK|TEMP|DEBUG|OPTIMIZE|WARNING)\b/;
const HYPERLINK_PATTERN = /\bhttps?:/
const STYLED_REGEX = /\bstyled\b/i;

function languageStringForTemplateTag(tag) {
  if (STYLED_REGEX.test(tag)) {
    return 'CSS';
  } else {
    return tag;
  }
}
