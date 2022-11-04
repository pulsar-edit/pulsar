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
    const packageReadmePath = path.join(packagePath, 'README.md');
    packageMetadata.readme = fs.readFileSync(packageReadmePath, 'utf8').toString();
    normalizePackageData(
      packageMetadata,
      msg => {
        if (!msg.match(/No README data$/)) {
          console.warn(
            `Invalid package metadata. ${packageMetadata.name}: ${msg}`
          );
        }
      },
      true
    );
    if (
      packageMetadata.repository &&
      packageMetadata.repository.url &&
      packageMetadata.repository.type === 'git'
    ) {
      packageMetadata.repository.url = packageMetadata.repository.url.replace(
        /^git\+/,
        ''
      );
    }

    delete packageMetadata['_from'];
    delete packageMetadata['_id'];
    delete packageMetadata['dist'];
    delete packageMetadata['readmeFilename'];

    const packageModuleCache = packageMetadata._atomModuleCache || {};
    if (
      packageModuleCache.extensions &&
      packageModuleCache.extensions['.json']
    ) {
      const index = packageModuleCache.extensions['.json'].indexOf(
        'package.json'
      );
      if (index !== -1) {
        packageModuleCache.extensions['.json'].splice(index, 1);
      }
    }

    const packageNewMetadata = {
      metadata: packageMetadata,
      keymaps: {},
      menus: {},
      grammarPaths: [],
      settings: {}
    };

    packageNewMetadata.rootDirPath = packagePath;

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

    const packageKeymapsPath = path.join(packagePath, 'keymaps');
    if (fs.existsSync(packageKeymapsPath)) {
      for (let packageKeymapName of fs.readdirSync(packageKeymapsPath)) {
        const packageKeymapPath = path.join(
          packageKeymapsPath,
          packageKeymapName
        );
        if (
          packageKeymapPath.endsWith('.cson') ||
          packageKeymapPath.endsWith('.json')
        ) {
          packageNewMetadata.keymaps[packageKeymapPath] = CSON.readFileSync(
            packageKeymapPath
          );
        }
      }
    }

    const packageMenusPath = path.join(packagePath, 'menus');
    if (fs.existsSync(packageMenusPath)) {
      for (let packageMenuName of fs.readdirSync(packageMenusPath)) {
        const packageMenuPath = path.join(packageMenusPath, packageMenuName);
        if (
          packageMenuPath.endsWith('.cson') ||
          packageMenuPath.endsWith('.json')
        ) {
          packageNewMetadata.menus[packageMenuPath] = CSON.readFileSync(
            packageMenuPath
          );
        }
      }
    }

    const packageGrammarsPath = path.join(packagePath, 'grammars');
    for (let packageGrammarPath of fs.listSync(packageGrammarsPath, [
      'json',
      'cson'
    ])) {
      packageNewMetadata.grammarPaths.push(packageGrammarPath);
    }

    const packageSettingsPath = path.join(packagePath, 'settings');
    for (let packageSettingPath of fs.listSync(packageSettingsPath, [
      'json',
      'cson'
    ])) {
      packageNewMetadata.settings[packageSettingPath] = CSON.readFileSync(
        packageSettingPath
      );
    }

    const packageStyleSheetsPath = path.join(packagePath, 'styles');
    let styleSheets = null;
    if (packageMetadata.mainStyleSheet) {
      styleSheets = [fs.resolve(packagePath, packageMetadata.mainStyleSheet)];
    } else if (packageMetadata.styleSheets) {
      styleSheets = packageMetadata.styleSheets.map(name =>
        fs.resolve(packageStyleSheetsPath, name, ['css', 'less', ''])
      );
    } else {
      const indexStylesheet = fs.resolve(packagePath, 'index', ['css', 'less']);
      if (indexStylesheet) {
        styleSheets = [indexStylesheet];
      } else {
        styleSheets = fs.listSync(packageStyleSheetsPath, ['css', 'less']);
      }
    }

    packageNewMetadata.styleSheetPaths = styleSheets.map(styleSheetPath =>
      path.relative(packagePath, styleSheetPath)
    );

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
