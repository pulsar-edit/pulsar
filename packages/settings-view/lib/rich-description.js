
module.exports = {
  getSettingDescription (keyPath) {
    const schema = atom.config.getSchema(keyPath)
    let description = ''
    if (schema && schema.description) {
      description = schema.description
    }

    // Localize
    if (atom.i18n.isAutoTranslateLabel(description)) {
      description = atom.i18n.translateLabel(description);
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
