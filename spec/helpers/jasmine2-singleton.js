let Jasmine = require("jasmine");
let jasmine = new Jasmine();

if (jasmine.jasmine.private?.loadedAsBrowserEsm) {
  jasmine.jasmine.private.loadedAsBrowserEsm = false;
}

window["jasmine"] = jasmine.jasmine;

module.exports = jasmine;
