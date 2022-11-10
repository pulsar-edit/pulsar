'use strict';

const CSON = require('season');
const fs = require('fs-plus');
const normalizePackageData = require('normalize-package-data');
const path = require('path');
const semver = require('semver');

module.exports = function(packageJSON) {
  return {
    _atomMenu: buildPlatformMenuMetadata(packageJSON),
    _atomKeymaps: buildPlatformKeymapsMetadata(packageJSON)
  }
};

function buildPlatformMenuMetadata(packageJSON) {
  const menuPath = path.join(
    'menus',
    `${process.platform}.cson`
  );
  if (fs.existsSync(menuPath)) {
    return CSON.readFileSync(menuPath);
  } else {
    return null;
  }
}

function buildPlatformKeymapsMetadata(packageJSON) {
  const invalidPlatforms = [
    'darwin',
    'freebsd',
    'linux',
    'sunos',
    'win32'
  ].filter(p => p !== process.platform);
  const keymapsPath = 'keymaps';
  const keymaps = {};
  for (let keymapName of fs.readdirSync(keymapsPath)) {
    const keymapPath = path.join(keymapsPath, keymapName);
    if (keymapPath.endsWith('.cson') || keymapPath.endsWith('.json')) {
      const keymapPlatform = path.basename(
        keymapPath,
        path.extname(keymapPath)
      );
      if (invalidPlatforms.indexOf(keymapPlatform) === -1) {
        keymaps[path.basename(keymapPath)] = CSON.readFileSync(keymapPath);
      }
    }
  }
  return keymaps;
}
