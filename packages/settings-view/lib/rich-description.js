
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
        html: false,
        useTaskCheckbox: false,
        disableInlineCode: true,
        disableCodeBlocks: true,
        disableHeading: true,
        disableImage: true,
        disableList: true
      }
    ).replace(/<p>(.*)<\/p>/, "$1").trim();
  }
}
