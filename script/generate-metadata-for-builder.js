'use strict';

const CSON = require('season');
const fs = require('fs-plus');
const normalizePackageData = require('normalize-package-data');
const path = require('path');
const semver = require('semver');

module.exports = function(packageJSON) {
  return {
    _atomPackages: buildBundledPackagesMetadata(packageJSON),
    _atomMenu: buildPlatformMenuMetadata(packageJSON),
    _atomKeymaps: buildPlatformKeymapsMetadata(packageJSON)
  }
};

function buildBundledPackagesMetadata(packageJSON) {
  const packages = {};
  for (let packageName of Object.keys(packageJSON.packageDependencies)) {
    const packagePath = path.join('node_modules', packageName);
    const packageMetadataPath = path.join(packagePath, 'package.json');
    const packageMetadata = JSON.parse(fs.readFileSync(packageMetadataPath, 'utf8'));
    normalizePackageData(
      packageMetadata,
      msg => {
        if (msg.match(/No README data$/)) return;
        console.warn(`Invalid package metadata. ${packageMetadata.name}: ${msg}`);
      },
      true
    );
    if (
      packageMetadata.repository?.url &&
      packageMetadata.repository.type === 'git'
    ) {
      packageMetadata.repository.url = packageMetadata.repository.url.replace(/^git\+/,'');
    }

    delete packageMetadata['_from'];
    delete packageMetadata['_id'];
    delete packageMetadata['dist'];
    delete packageMetadata['readme'];
    delete packageMetadata['readmeFilename'];

    const packageModuleCache = packageMetadata._atomModuleCache || {};
    if ( packageModuleCache.extensions?.['.json'] ) {
      const index = packageModuleCache.extensions['.json'].indexOf('package.json');
      if (index !== -1) {
        packageModuleCache.extensions['.json'].splice(index, 1);
      }
    }

    const packageNewMetadata = {
      metadata: packageMetadata,
      keymaps: {},
      menus: {},
      grammarPaths: [],
      settings: {},
      styleSheetPaths: [],
      rootDirPath: packagePath,
    };

    if (packageMetadata.main) {
      const mainPath = require.resolve(
        path.resolve(packagePath, packageMetadata.main)
      );
      packageNewMetadata.main = path.relative(
        'static',
        mainPath
      );
      // Convert backward slashes to forward slashes in order to allow package
      // main modules to be required from the snapshot. This is because we use
      // forward slashes to cache the sources in the snapshot, so we need to use
      // them here as well.
      packageNewMetadata.main = packageNewMetadata.main.replace(/\\/g, '/');
    }

    packages[packageMetadata.name] = packageNewMetadata;
    if (packageModuleCache.extensions) {
      for (let extension of Object.keys(packageModuleCache.extensions)) {
        const paths = packageModuleCache.extensions[extension];
        if (paths.length === 0) {
          delete packageModuleCache.extensions[extension];
        }
      }
    }
  }
  return packages;
}

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
      const keymapPlatform = path.basename(keymapPath,path.extname(keymapPath));
      if (invalidPlatforms.indexOf(keymapPlatform) === -1) {
        keymaps[path.basename(keymapPath)] = CSON.readFileSync(keymapPath);
      }
    }
  }
  return keymaps;
}
