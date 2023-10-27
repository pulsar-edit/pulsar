
module.exports = {
  getSettingDescription (keyPath) {
    const schema = atom.config.getSchema(keyPath)
    let description = ''
    if (schema && schema.description) {
      description = schema.description
    }
    return atom.ui.markdown.render(
      description,
      {
        useTaskCheckbox: false,
        disableMode: "strict",
      }
    ).replace(/<p>(.*)<\/p>/, "$1").trim();
  }
}
