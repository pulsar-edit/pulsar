'use strict';

const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const spawnSync = require('./spawn-sync');
const template = require('lodash.template');

const CONFIG = require('../config');

module.exports = function(packagedAppPath) {
  console.log(`Creating rpm package for "${packagedAppPath}"`);
  const editorExecutableName =
    CONFIG.channel === 'stable' ? 'pulsar' : `pulsar-${CONFIG.channel}`;
  const pkgMgrExecutableName =
    CONFIG.channel === 'stable' ? 'apm' : `apm-${CONFIG.channel}`;
  const appName = CONFIG.appName;
  const appDescription = CONFIG.appMetadata.description;
  // RPM versions can't have dashes or tildes in them.
  // (Ref.: https://twiki.cern.ch/twiki/bin/view/Main/RPMAndDebVersioning)
  const appVersion = CONFIG.appMetadata.version.replace(/-/g, '.');
  const policyFileName = `pulsar-${CONFIG.channel}.policy`;

  const rpmPackageDirPath = path.join(CONFIG.homeDirPath, 'rpmbuild');
  const rpmPackageBuildDirPath = path.join(rpmPackageDirPath, 'BUILD');
  const rpmPackageSourcesDirPath = path.join(rpmPackageDirPath, 'SOURCES');
  const rpmPackageSpecsDirPath = path.join(rpmPackageDirPath, 'SPECS');
  const rpmPackageRpmsDirPath = path.join(rpmPackageDirPath, 'RPMS');
  const rpmPackageApplicationDirPath = path.join(
    rpmPackageBuildDirPath,
    appName
  );
  const rpmPackageIconsDirPath = path.join(rpmPackageBuildDirPath, 'icons');

  if (fs.existsSync(rpmPackageDirPath)) {
    console.log(
      `Deleting existing rpm build directory at "${rpmPackageDirPath}"`
    );
    fs.removeSync(rpmPackageDirPath);
  }

  console.log(
    `Creating rpm package directory structure at "${rpmPackageDirPath}"`
  );
  fs.mkdirpSync(rpmPackageDirPath);
  fs.mkdirpSync(rpmPackageBuildDirPath);
  fs.mkdirpSync(rpmPackageSourcesDirPath);
  fs.mkdirpSync(rpmPackageSpecsDirPath);

  console.log(
    `Copying "${packagedAppPath}" to "${rpmPackageApplicationDirPath}"`
  );
  fs.copySync(packagedAppPath, rpmPackageApplicationDirPath);

  console.log(`Copying icons into "${rpmPackageIconsDirPath}"`);
  fs.copySync(
    path.join(
      CONFIG.repositoryRootPath,
      'resources',
      'app-icons',
      CONFIG.channel,
      'png'
    ),
    rpmPackageIconsDirPath
  );

  console.log(`Writing rpm package spec file into "${rpmPackageSpecsDirPath}"`);
  const rpmPackageSpecFilePath = path.join(rpmPackageSpecsDirPath, 'pulsar.spec');
  const rpmPackageSpecsTemplate = fs.readFileSync(
    path.join(
      CONFIG.repositoryRootPath,
      'resources',
      'linux',
      'redhat',
      'pulsar.spec.in'
    )
  );
  const rpmPackageSpecsContents = template(rpmPackageSpecsTemplate)({
    appName: appName,
    appFileName: editorExecutableName,
    apmFileName: pkgMgrExecutableName,
    description: appDescription,
    installDir: '/usr',
    version: appVersion,
    policyFileName
  });
  fs.writeFileSync(rpmPackageSpecFilePath, rpmPackageSpecsContents);

  console.log(`Writing desktop entry file into "${rpmPackageBuildDirPath}"`);
  const desktopEntryTemplate = fs.readFileSync(
    path.join(
      CONFIG.repositoryRootPath,
      'resources',
      'linux',
      'pulsar.desktop.in'
    )
  );
  const desktopEntryContents = template(desktopEntryTemplate)({
    appName: appName,
    appFileName: editorExecutableName,
    description: appDescription,
    installDir: '/usr',
    iconPath: editorExecutableName
  });
  fs.writeFileSync(
    path.join(rpmPackageBuildDirPath, `${editorExecutableName}.desktop`),
    desktopEntryContents
  );

  console.log(`Copying pulsar.sh into "${rpmPackageBuildDirPath}"`);
  fs.copySync(
    path.join(CONFIG.repositoryRootPath, 'pulsar.sh'),
    path.join(rpmPackageBuildDirPath, 'pulsar.sh')
  );

  console.log(`Copying pulsar.policy into "${rpmPackageBuildDirPath}"`);
  fs.copySync(
    path.join(CONFIG.repositoryRootPath, 'resources', 'linux', 'pulsar.policy'),
    path.join(rpmPackageBuildDirPath, policyFileName)
  );

  console.log(`Generating .rpm package from "${rpmPackageDirPath}"`);
  spawnSync('rpmbuild', ['-ba', '--clean', rpmPackageSpecFilePath]);
  for (let generatedArch of fs.readdirSync(rpmPackageRpmsDirPath)) {
    const generatedArchDirPath = path.join(
      rpmPackageRpmsDirPath,
      generatedArch
    );
    const generatedPackageFileNames = fs.readdirSync(generatedArchDirPath);
    assert(
      generatedPackageFileNames.length === 1,
      'Generated more than one rpm package'
    );
    const generatedPackageFilePath = path.join(
      generatedArchDirPath,
      generatedPackageFileNames[0]
    );
    const outputRpmPackageFilePath = path.join(
      CONFIG.buildOutputPath,
      `pulsar.${generatedArch}.rpm`
    );
    console.log(
      `Copying "${generatedPackageFilePath}" into "${outputRpmPackageFilePath}"`
    );
    fs.copySync(generatedPackageFilePath, outputRpmPackageFilePath);
  }
};
