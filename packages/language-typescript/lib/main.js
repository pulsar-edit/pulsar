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
        return 'ts-regex';
      },
      content(regex) {
        return regex;
      },
      languageScope: null
    });
  }
};

exports.consumeHyperlinkInjection = (hyperlink) => {
  for (const scopeName of ['source.ts', 'source.tsx', 'source.flow']) {
    hyperlink.addInjectionPoint(scopeName, {
      types: ['template_string', 'string_fragment', 'comment']
    });
  }
};

exports.consumeTodoInjection = (todo) => {
  for (const scopeName of ['source.ts', 'source.tsx', 'source.flow']) {
    todo.addInjectionPoint(scopeName, { types: ['comment'] });
  }
};


const STYLED_REGEX = /\bstyled\b/i;

function languageStringForTemplateTag(tag) {
  if (STYLED_REGEX.test(tag)) {
    return 'CSS';
  } else {
    return tag;
  }
}
