'use strict';

const fs = require('fs-extra');
const handleTilde = require('./handle-tilde');
const path = require('path');
const template = require('lodash.template');
const startCase = require('lodash.startcase');
const execSync = require('child_process').execSync;

const CONFIG = require('../config');

function install(installationDirPath, packagedAppFileName, packagedAppPath) {
  if (fs.existsSync(installationDirPath)) {
    console.log(
      `Removing previously installed "${packagedAppFileName}" at "${installationDirPath}"`
    );
    fs.removeSync(installationDirPath);
  }

  console.log(
    `Installing "${packagedAppFileName}" at "${installationDirPath}"`
  );
  fs.copySync(packagedAppPath, installationDirPath);
}

/**
 * Finds the path to the base directory of the icon default icon theme
 * This follows the freedesktop Icon Theme Specification:
 * https://standards.freedesktop.org/icon-theme-spec/icon-theme-spec-latest.html#install_icons
 * and the XDG Base Directory Specification:
 * https://standards.freedesktop.org/basedir-spec/basedir-spec-latest.html#variables
 */
function findBaseIconThemeDirPath() {
  const defaultBaseIconThemeDir = '/usr/share/icons/hicolor';
  const dataDirsString = process.env.XDG_DATA_DIRS;
  if (dataDirsString) {
    const dataDirs = dataDirsString.split(path.delimiter);
    if (dataDirs.includes('/usr/share/') || dataDirs.includes('/usr/share')) {
      return defaultBaseIconThemeDir;
    } else {
      return path.join(dataDirs[0], 'icons', 'hicolor');
    }
  } else {
    return defaultBaseIconThemeDir;
  }
}

module.exports = function(packagedAppPath, installDir) {
  const packagedAppFileName = path.basename(packagedAppPath);
  if (process.platform === 'darwin') {
    const installPrefix =
      installDir !== ''
        ? handleTilde(installDir)
        : path.join(path.sep, 'Applications');
    const installationDirPath = path.join(installPrefix, packagedAppFileName);
    install(installationDirPath, packagedAppFileName, packagedAppPath);
  } else if (process.platform === 'win32') {
    const installPrefix =
      installDir !== '' ? installDir : process.env.LOCALAPPDATA;
    const installationDirPath = path.join(
      installPrefix,
      packagedAppFileName,
      'app-dev'
    );
    try {
      install(installationDirPath, packagedAppFileName, packagedAppPath);
    } catch (e) {
      console.log(
        `Administrator elevation required to install into "${installationDirPath}"`
      );
      const fsAdmin = require('fs-admin');
      return new Promise((resolve, reject) => {
        fsAdmin.recursiveCopy(packagedAppPath, installationDirPath, error => {
          error ? reject(error) : resolve();
        });
      });
    }
  } else {
    const editorExecutableName =
      CONFIG.channel === 'stable' ? 'pulsar' : 'pulsar-' + CONFIG.channel;
    const pkgMgrExecutableName =
      CONFIG.channel === 'stable' ? 'apm' : 'apm-' + CONFIG.channel;
    const appName =
      CONFIG.channel === 'stable'
        ? 'Pulsar'
        : startCase('Pulsar ' + CONFIG.channel);
    const appDescription = CONFIG.appMetadata.description;
    const prefixDirPath =
      installDir !== '' ? handleTilde(installDir) : path.join('/usr', 'local');
    const shareDirPath = path.join(prefixDirPath, 'share');
    const installationDirPath = path.join(shareDirPath, editorExecutableName);
    const applicationsDirPath = path.join(shareDirPath, 'applications');

    const binDirPath = path.join(prefixDirPath, 'bin');

    fs.mkdirpSync(applicationsDirPath);
    fs.mkdirpSync(binDirPath);

    install(installationDirPath, packagedAppFileName, packagedAppPath);

    {
      // Install icons
      const baseIconThemeDirPath = findBaseIconThemeDirPath();
      const fullIconName = editorExecutableName + '.png';

      let existingIconsFound = false;
      fs.readdirSync(baseIconThemeDirPath).forEach(size => {
        const iconPath = path.join(
          baseIconThemeDirPath,
          size,
          'apps',
          fullIconName
        );
        if (fs.existsSync(iconPath)) {
          if (!existingIconsFound) {
            console.log(
              `Removing existing icons from "${baseIconThemeDirPath}"`
            );
          }
          existingIconsFound = true;
          fs.removeSync(iconPath);
        }
      });

      console.log(`Installing icons at "${baseIconThemeDirPath}"`);
      const appIconsPath = path.join(
        CONFIG.repositoryRootPath,
        'resources',
        'app-icons',
        CONFIG.channel,
        'png'
      );
      fs.readdirSync(appIconsPath).forEach(imageName => {
        if (/\.png$/.test(imageName)) {
          const size = path.basename(imageName, '.png');
          const iconPath = path.join(appIconsPath, imageName);
          fs.copySync(
            iconPath,
            path.join(
              baseIconThemeDirPath,
              `${size}x${size}`,
              'apps',
              fullIconName
            )
          );
        }
      });

      console.log(`Updating icon cache for "${baseIconThemeDirPath}"`);
      try {
        execSync(`gtk-update-icon-cache ${baseIconThemeDirPath} --force`);
      } catch (e) {}
    }

    {
      // Install xdg desktop file
      const desktopEntryPath = path.join(
        applicationsDirPath,
        `${editorExecutableName}.desktop`
      );
      if (fs.existsSync(desktopEntryPath)) {
        console.log(
          `Removing existing desktop entry file at "${desktopEntryPath}"`
        );
        fs.removeSync(desktopEntryPath);
      }
      console.log(`Writing desktop entry file at "${desktopEntryPath}"`);
      const desktopEntryTemplate = fs.readFileSync(
        path.join(
          CONFIG.repositoryRootPath,
          'resources',
          'linux',
          'pulsar.desktop.in'
        )
      );
      const desktopEntryContents = template(desktopEntryTemplate)({
        appName,
        appFileName: editorExecutableName,
        description: appDescription,
        installDir: prefixDirPath,
        iconPath: editorExecutableName
      });
      fs.writeFileSync(desktopEntryPath, desktopEntryContents);
    }

    {
      // Add pulsar executable to the PATH
      const editorBinDestinationPath = path.join(binDirPath, editorExecutableName);
      if (fs.existsSync(editorBinDestinationPath)) {
        console.log(
          `Removing existing executable at "${editorBinDestinationPath}"`
        );
        fs.removeSync(editorBinDestinationPath);
      }
      console.log(`Copying pulsar.sh to "${editorBinDestinationPath}"`);
      fs.copySync(
        path.join(CONFIG.repositoryRootPath, 'pulsar.sh'),
        editorBinDestinationPath
      );
    }

    {
      // Link apm executable to the PATH
      const pkgMgrBinDestinationPath = path.join(binDirPath, pkgMgrExecutableName);
      try {
        fs.lstatSync(pkgMgrBinDestinationPath);
        console.log(
          `Removing existing executable at "${pkgMgrBinDestinationPath}"`
        );
        fs.removeSync(pkgMgrBinDestinationPath);
      } catch (e) {}
      console.log(`Symlinking apm to "${pkgMgrBinDestinationPath}"`);
      fs.symlinkSync(
        path.join(
          '..',
          'share',
          editorExecutableName,
          'resources',
          'app',
          'apm',
          'node_modules',
          '.bin',
          'apm'
        ),
        pkgMgrBinDestinationPath
      );
    }

    console.log(`Changing permissions to 755 for "${installationDirPath}"`);
    fs.chmodSync(installationDirPath, '755');
  }

  return Promise.resolve();
};
