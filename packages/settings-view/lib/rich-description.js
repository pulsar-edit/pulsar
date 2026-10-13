
module.exports = {
  getSettingDescription(keyPath) {
    const schema = atom.config.getSchema(keyPath)
    let description = ''
    if (schema && schema.description) {
      description = schema.description
    }

    // Localize
    if (atom.i18n.isAutoTranslateLabel(description)) {
      description = atom.i18n.translateLabel(description);
    }

    let contents = atom.ui.markdown.render(
      description,
      {
        useTaskCheckbox: false,
        disableMode: "strict",
      }
    )

    // If the setting has no internal paragraph breaks, strip it of its
    // surrounding `p` tag. Otherwise keep the `p`.
    if ((contents.match(/<p>/g)?.length ?? 0) <= 1) {
      contents = contents.replace(/<p>(.*)<\/p>/, "$1").trim()
    }
    return contents
  }
}
