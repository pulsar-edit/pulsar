let Jasmine = require('jasmine');
let jasmine = new Jasmine();

for (let key in jasmine.env) {
  window[key] = jasmine.env[key];
}
window['jasmine'] = jasmine.jasmine

module.exports = jasmine;
