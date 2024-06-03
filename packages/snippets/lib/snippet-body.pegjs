
{
  // If you're making changes to this file, be sure to re-compile afterward
  // using the instructions in `snippet-body-parser.js`.

  function makeInteger(i) {
    return parseInt(i.join(''), 10);
  }

  function coalesce (parts) {
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const ri = result.length - 1;
      if (typeof part === 'string' && typeof result[ri] === 'string') {
        result[ri] = result[ri] + part;
      } else {
        result.push(part);
      }
    }
    return result;
  }

  function unwrap (val) {
    let shouldUnwrap = Array.isArray(val) && val.length === 1 && typeof val[0] === 'string';
    return shouldUnwrap ? val[0] : val;
  }

}

bodyContent = content:(tabstop / choice / variable / text)* { return content; }

innerBodyContent = content:(tabstop / choice / variable / nonCloseBraceText)* { return content; }

tabstop = simpleTabstop / tabstopWithoutPlaceholder / tabstopWithPlaceholder / tabstopWithTransform

simpleTabstop = '$' index:int {
  return {index: makeInteger(index), content: []}
}

tabstopWithoutPlaceholder = '${' index:int '}' {
  return {index: makeInteger(index), content: []}
}

tabstopWithPlaceholder = '${' index:int ':' content:innerBodyContent '}' {
  return {index: makeInteger(index), content: content}
}

tabstopWithTransform = '${' index:int substitution:transform '}' {
  return {
    index: makeInteger(index),
    content: [],
    substitution: substitution
  }
}

choice = '${' index:int '|' choice:choicecontents '|}' {
  // Choice syntax requires an autocompleter to offer the user the options. As
  // a fallback, we can take the first option and treat it as a placeholder.
  const content = choice.length > 0 ? [choice[0]] : []
  return {index: makeInteger(index), choice: choice, content: content}
}

choicecontents = elem:choicetext rest:(',' val:choicetext { return val } )* {
  return [elem, ...rest]
}

choicetext = choicetext:(choiceEscaped / [^|,] / barred:('|' &[^}]) { return barred.join('') } )+ {
  return choicetext.join('')
}

transform = '/' regex:regexString '/' replace:replace '/' flags:flags {
  return {find: new RegExp(regex, flags), replace: replace}
}

regexString = regex:(escaped / [^/])* {
  return regex.join('')
}

replace = (format / replacetext)*

format = simpleFormat / formatWithoutPlaceholder / formatWithCaseTransform / formatWithIf / formatWithIfElse / formatWithElse / formatEscape / formatWithIfElseAlt / formatWithIfAlt

simpleFormat = '$' index:int {
  return {backreference: makeInteger(index)}
}

formatWithoutPlaceholder = '${' index:int '}' {
  return {backreference: makeInteger(index)}
}

formatWithCaseTransform = '${' index:int ':' caseTransform:caseTransform '}' {
  return {backreference: makeInteger(index), transform: caseTransform}
}

formatWithIf = '${' index:int ':+' iftext:(ifElseText / '') '}' {
  return {backreference: makeInteger(index), iftext: unwrap(iftext), elsetext: ''}
}

formatWithIfAlt = '(?' index:int ':' iftext:(ifTextAlt / '') ')' {
  return {backreference: makeInteger(index), iftext: unwrap(iftext), elseText: '' }
}

formatWithElse = '${' index:int (':-' / ':') elsetext:(ifElseText / '') '}' {
  return {backreference: makeInteger(index), iftext: '', elsetext: unwrap(elsetext)}
}

// Variable interpolation if-else; conditional clause queries the presence of a
// specific tabstop value.
formatWithIfElse = '${' index:int ':?' iftext:ifText ':' elsetext:(ifElseText / '') '}' {
  return {backreference: makeInteger(index), iftext: iftext, elsetext: elsetext}
}

// Substitution if-else; conditional clause tests whether a given regex capture
// group matched anything.
formatWithIfElseAlt = '(?' index:int ':' iftext:(ifTextAlt / '') ':' elsetext:(elseTextAlt / '') ')' {
  return {backreference: makeInteger(index), iftext: iftext, elsetext: elsetext}
}

nonColonText = text:('\\:' { return ':' } / escaped / [^:])* {
  return text.join('')
}

formatEscape = '\\' flag:[ULulErn] {
  return {escape: flag}
}

caseTransform = '/' type:[a-zA-Z]* {
  return type.join('')
}

replacetext = replacetext:(!formatEscape char:escaped { return char } / !format char:[^/] { return char })+ {
  return replacetext.join('')
}

variable = simpleVariable / variableWithSimpleTransform / variableWithoutPlaceholder / variableWithPlaceholder / variableWithTransform

simpleVariable = '$' name:variableName {
  return {variable: name}
}

variableWithoutPlaceholder = '${' name:variableName '}' {
  return {variable: name}
}

variableWithPlaceholder = '${' name:variableName ':' content:innerBodyContent '}' {
  return {variable: name, content: content}
}

variableWithTransform = '${' name:variableName substitution:transform '}' {
  return {variable: name, substitution: substitution}
}

variableWithSimpleTransform = '${' name:variableName ':/' substitutionFlag:substitutionFlag '}' {
  return {variable: name, substitution: {flag: substitutionFlag}}
}

variableName = first:[a-zA-Z_] rest:[a-zA-Z_0-9]* {
  return first + rest.join('')
}

substitutionFlag = chars:[a-z]+ {
  return chars.join('')
}

int = [0-9]+

escaped = '\\' char:. {
  switch (char) {
    case '$':
    case '\\':
    case ':':
    case '\x7D': // back brace; PEGjs would treat it as the JS scope end though
      return char
    default:
      return '\\' + char
  }
}

choiceEscaped = '\\' char:. {
  switch (char) {
    case '$':
    case '\\':
    case '\x7D':
    case '|':
    case ',':
      return char
    default:
      return '\\' + char
  }
}

flags = flags:[a-z]* {
  return flags.join('')
}

text = text:(escaped / !tabstop !variable !choice  char:. { return char })+ {
  return text.join('')
}

nonCloseBraceText = text:(escaped / !tabstop !variable !choice char:[^}] { return char })+ {
  return text.join('')
}

// Two kinds of format string conditional syntax: the `${` flavor and the `(?`
// flavor.
//
// VSCode supports only the `${` flavor. It's easier to parse because the
// if-result and else-result can only be plain text, as per the specification.
//
// TextMate supports both. `(?` is more powerful, but also harder to parse,
// because it can contain special flags and regex backreferences.

// For the first part of a two-part if-else. Runs until the `:` delimiter.
ifText = text:(escaped / char:[^:] { return char })+ {
  return text.join('')
}

// For either the second part of a two-part if-else OR the sole part of a
// one-part if/else. Runs until the `}` that ends the expression.
ifElseText = text:(escaped / char:[^}] { return char })+ {
  return text.join('')
}

ifTextAlt = text:(formatEscape / format / escaped / char:[^:] { return char })+ {
  return coalesce(text);
}

elseTextAlt = text:(formatEscape / format / escaped / char:[^)] { return char })+ {
  return coalesce(text);
}
