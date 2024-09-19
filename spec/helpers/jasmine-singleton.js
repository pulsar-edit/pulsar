let jasmine;

jasmineVendor = require('../../vendor/jasmine');
for (let key in jasmineVendor) { window[key] = jasmineVendor[key]; }

jasmine = jasmineVendor.jasmine;

require('jasmine-json');

if ( !jasmine.TerminalReporter ) {
  const { jasmineNode} = require('jasmine-node/lib/jasmine-node/reporter');

  jasmine.TerminalReporter = jasmineNode.TerminalReporter;
}

module.exports = jasmine;
