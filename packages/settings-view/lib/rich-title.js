const _ = require("underscore-plus")

module.exports = {
  getSettingTitle (keyPath, name) {
    if (name == null) {
      name = ''
    }
    const schema = atom.config.getSchema(keyPath)
    const title = schema != null ? schema.title : null
    return title || _.uncamelcase(name).split('.').map(_.capitalize).join(' ')
  }
}
