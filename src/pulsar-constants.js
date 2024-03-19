// A definition for all Pulsar Constants that are ubiquitous throughout the codebase
const CONSTANTS = {};

CONSTANTS.PROTOCOL = "atom";
CONSTANTS.PROTOCOL_COLON = `${CONSTANTS.PROTOCOL}:`;
CONSTANTS.PROTOCOL_COLON_SLASHES = `${CONSTANTS.PROTOCOL_COLON}//`;
// ^^ atom://
// If changing the protocol name, it must be changed in ./static/index.html
CONSTANTS.DOT_FOLDER = ".pulsar";
// ^^ The folder where all user data and configuration data is stored
CONSTANTS.APP_IDENTIFIER = "dev.pulsar-edit.pulsar";
CONSTANTS.STYLESHEET_URI = `${CONSTANTS.PROTOCOL_COLON_SLASHES}${CONSTANTS.DOT_FOLDER}/stylesheet`;
// ^^ atom://.pulsar/stylesheet
CONSTANTS.KEYMAP_URI = `${CONSTANTS.PROTOCOL_COLON_SLASHES}${CONSTANTS.DOT_FOLDER}/keymap`;
// ^^ atom://.pulsar/keymap
CONSTANTS.CONFIG_URI = `${CONSTANTS.PROTOCOL_COLON_SLASHES}${CONSTANTS.DOT_FOLDER}/config`;
// ^^ atom://.pulsar/config
CONSTANTS.INIT_SCRIPT_URI = `${CONSTANTS.PROTOCOL_COLON_SLASHES}${CONSTANTS.DOT_FOLDER}/init-script`;
// ^^ atom://.pulsar/init-script
CONSTANTS.SNIPPETS_URI = `${CONSTANTS.PROTOCOL_COLON_SLASHES}${CONSTANTS.DOT_FOLDER}/snippets`;
// ^^ atom://.pulsar/snippets
CONSTANTS.CONFIG_UI_URI = `${CONSTANTS.PROTOCOL_COLON_SLASHES}config`;
// ^^ atom://config
CONSTANTS.ABOUT_UI_URI = `${CONSTANTS.PROTOCOL_COLON_SLASHES}about`;
// ^^ atom://about

module.exports = CONSTANTS;
