module.exports = {
  unescapeEscapeSequence(string) {
    return string.replace(/\\(.)/gm, function(match, char) {
      if (char === 't') {
        return '\t';
      } else if (char === 'n') {
        return '\n';
      } else if (char === 'r') {
        return '\r';
      } else if (char === '\\') {
        return '\\';
      } else {
        return match;
      }
    });
  }
};
