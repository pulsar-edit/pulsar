global.assert = require("./assert");

if (process.env.SUPPRESS_EXIT) {
  process.exit = function (code) {};
}
