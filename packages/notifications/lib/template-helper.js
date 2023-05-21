/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
module.exports = {
  create(htmlString) {
    const template = document.createElement('template');
    template.innerHTML = htmlString;
    document.body.appendChild(template);
    return template;
  },

  render(template) {
    return document.importNode(template.content, true);
  }
};
