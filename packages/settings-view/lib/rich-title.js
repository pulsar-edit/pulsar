const _ = require("underscore-plus")

module.exports = {
  getSettingTitle (keyPath, name) {
    if (name == null) {
      name = ''
    }
    const schema = atom.config.getSchema(keyPath)
    let title = schema != null ? schema.title : null
    // Localize
    if (typeof title === "string" && atom.i18n.isAutoTranslateLabel(title)) {
      title = atom.i18n.translateLabel(title);
    }
    return title || _.uncamelcase(name).split('.').map(_.capitalize).join(' ')
  }
}
