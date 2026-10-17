const path = require('path')

const fixturePackagesPath = path.resolve(__dirname, '../fixtures/packages');
atom.packages.packageDirPaths.unshift(fixturePackagesPath);
