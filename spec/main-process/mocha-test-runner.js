const Mocha = require('mocha');
const fs = require('fs-plus');
const { assert } = require('chai');

module.exports = function(testPaths) {
  global.assert = assert;

  let reporterOptions = {
    reporterEnabled: 'list'
  };

  const mocha = new Mocha({
    reporter: 'mocha-multi-reporters',
    reporterOptions
  });

  for (let testPath of testPaths) {
    if (fs.isDirectorySync(testPath)) {
      for (let testFilePath of fs.listTreeSync(testPath)) {
        if (/\.test\.(coffee|js)$/.test(testFilePath)) {
          mocha.addFile(testFilePath);
        }
      }
    } else {
      mocha.addFile(testPath);
    }
  }

  mocha.run(failures => {
    if (failures === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
};
