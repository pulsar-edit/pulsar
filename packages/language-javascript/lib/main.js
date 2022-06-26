exports.activate = function() {
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
      return 'regex';
    },
    content(regex) {
      return regex;
    }
  });

  for (const scopeName of ['source.js', 'source.flow', 'source.ts']) {
    atom.grammars.addInjectionPoint(scopeName, {
      type: 'comment',
      language(comment) {
        if (comment.text.startsWith('/**')) return 'jsdoc';
      },
      content(comment) {
        return comment;
      }
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
