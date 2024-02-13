// A definition for all Pulsar Constants that are ubiquitous throughout the codebase

module.exports = {
  PROTOCOL_NAME: "atom",
  PROTOCOL: `${this.PROTOCOL_NAME}:`,
  PROTOCOL_PATH: `${this.PROTOCOL}//`,
  // ^^ atom://
  // If changing the protocol name, it must be changed in ./static/index.html
  DOT_FOLDER: ".pulsar", // The folder where all user data and configuration data is stored
  APP_IDENTIFIER: "dev.pulsar-edit.pulsar",
  // atom://.pulsar/stylesheet
  STYLESHEET_PROTOCOL: `${this.PROTOCOL_PATH}${this.DOT_FOLDER}/stylesheet`,
  // atom://.pulsar/keymap
  KEYMAP_PROTOCOL: `${this.PROTOCOL_PATH}${this.DOT_FOLDER}/keymap`,
  // atom://.pulsar/config
  CONFIG_PROTOCOL: `${this.PROTOCOL_PATH}${this.DOT_FOLDER}/config`,
  // atom://.pulsar/init-script
  INIT_SCRIPT_PROTOCOL: `${this.PROTOCOL_PATH}${this.DOT_FOLDER}/init-script`,
  // atom://.pulsar/snippets
  SNIPPETS_PROTOCOL: `${this.PROTOCOL_PATH}${this.DOT_FOLDER}/snippets`,
  // atom://config
  CONFIG_UI_PROTOCOL: `${this.PROTOCOL_PATH}config`,
  // atom://about
  ABOUT_UI_PROTOCOL: `${this.PROTOCOL_PATH}about`
};
