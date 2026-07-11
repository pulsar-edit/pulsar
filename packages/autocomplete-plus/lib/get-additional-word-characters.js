const POSSIBLE_WORD_CHARACTERS = "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?_-…".split("");

module.exports = function getAdditionalWordCharacters(scopeDescriptor) {
  const nonWordCharacters = atom.config.get("language.nonWordCharacters", {
    scope: scopeDescriptor,
  });
  let result = atom.config.get("autocomplete-plus.extraWordCharacters", { scope: scopeDescriptor });
  POSSIBLE_WORD_CHARACTERS.forEach((character) => {
    if (!nonWordCharacters.includes(character)) {
      result += character;
    }
  });
  return result;
};
