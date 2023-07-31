exports.activate = function() {
  for (const scopeName of ['source.ts', 'source.flow']) {
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
