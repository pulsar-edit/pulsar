#!/usr/bin/env node

'use strict';

const CONFIG = require('./config');

if (process.argv.includes('--no-bootstrap')) {
  console.log('Skipping bootstrap');
} else {
  // Bootstrap first to ensure all the dependencies used later in this script
  // are installed.
  const path = require('path');
  const childProcess = require('child_process');
  childProcess.execFileSync(
    process.execPath,
    [path.join(CONFIG.scriptRootPath, 'bootstrap')],
    { env: process.env, cwd: CONFIG.repositoryRootPath, stdio: 'inherit' }
  );
}

// Required to load CS files in this build script, such as those in `donna`
require('coffee-script/register');
require('colors');

const path = require('path');
const yargs = require('yargs');
const argv = yargs
  .usage('Usage: $0 [options]')
  .help('help')
  .describe(
    'existing-binaries',
    'Use existing Pulsar binaries (skip clean/transpile/cache)'
  )
  .describe('code-sign', 'Code-sign executables (macOS and Windows only)')
  .describe('test-sign', 'Test-sign executables (macOS only)')
  .describe('create-windows-installer', 'Create installer (Windows only)')
  .describe('create-debian-package', 'Create .deb package (Linux only)')
  .describe('create-rpm-package', 'Create .rpm package (Linux only)')
  .describe(
    'compress-artifacts',
    'Compress Pulsar binaries (and symbols on macOS)'
  )
  .describe('generate-api-docs', 'Only build the API documentation')
  .describe('install', 'Install Pulsar')
  .string('install')
  .describe(
    'ci',
    'Install dependencies quickly (package-lock.json files must be up to date)'
  )
  .wrap(yargs.terminalWidth()).argv;

const checkChromedriverVersion = require('./lib/check-chromedriver-version');
const cleanOutputDirectory = require('./lib/clean-output-directory');
const codeSignOnMac = require('./lib/code-sign-on-mac');
const codeSignOnWindows = require('./lib/code-sign-on-windows');
const compressArtifacts = require('./lib/compress-artifacts');
const copyAssets = require('./lib/copy-assets');
const createDebianPackage = require('./lib/create-debian-package');
const createRpmPackage = require('./lib/create-rpm-package');
const createWindowsInstaller = require('./lib/create-windows-installer');
const dumpSymbols = require('./lib/dump-symbols');
const generateAPIDocs = require('./lib/generate-api-docs');
const generateMetadata = require('./lib/generate-metadata');
const generateModuleCache = require('./lib/generate-module-cache');
const generateStartupSnapshot = require('./lib/generate-startup-snapshot');
const installApplication = require('./lib/install-application');
const notarizeOnMac = require('./lib/notarize-on-mac');
const packageApplication = require('./lib/package-application');
const prebuildLessCache = require('./lib/prebuild-less-cache');
const testSignOnMac = require('./lib/test-sign-on-mac');

process.on('unhandledRejection', function(e) {
  console.error(e.stack || e);
  process.exit(1);
});

process.env.ELECTRON_VERSION = CONFIG.appMetadata.electronVersion;

async function transpile() {
  const { spawn, Thread, Worker } = require(`${
    CONFIG.scriptRunnerModulesPath
  }/threads`);

  const transpilePackagesWithCustomTranspilerPaths = await spawn(
    new Worker('./lib/transpile-packages-with-custom-transpiler-paths')
  );
  const transpilePackagesWithCustomTranspilerPathsPromise = transpilePackagesWithCustomTranspilerPaths();

  const transpileBabelPaths = await spawn(
    new Worker('./lib/transpile-babel-paths')
  );
  const transpileBabelPathsPromise = transpileBabelPaths();

  const transpileCoffeeScriptPaths = await spawn(
    new Worker('./lib/transpile-coffee-script-paths')
  );
  const transpileCoffeeScriptPathsPromise = transpileCoffeeScriptPaths();

  const transpileCsonPaths = await spawn(
    new Worker('./lib/transpile-cson-paths')
  );
  const transpileCsonPathsPromise = transpileCsonPaths();

  const transpilePegJsPaths = await spawn(
    new Worker('./lib/transpile-peg-js-paths')
  );
  const transpilePegJsPathsPromise = transpilePegJsPaths();

  await transpilePackagesWithCustomTranspilerPathsPromise;
  await Thread.terminate(transpilePackagesWithCustomTranspilerPaths);

  await transpileBabelPathsPromise;
  await Thread.terminate(transpileBabelPaths);

  await transpileCoffeeScriptPathsPromise;
  await Thread.terminate(transpileCoffeeScriptPaths);

  await transpileCsonPathsPromise;
  await Thread.terminate(transpileCsonPaths);

  await transpilePegJsPathsPromise;
  await Thread.terminate(transpilePegJsPaths);
}

async function singAndCreateInstaller(packagedAppPath) {
  switch (process.platform) {
    case 'darwin': {
      if (argv.codeSign) {
        await codeSignOnMac(packagedAppPath);
        await notarizeOnMac(packagedAppPath);
      } else if (argv.testSign) {
        testSignOnMac(packagedAppPath);
      } else {
        console.log(
          'Skipping code-signing. Specify the --code-sign option to perform code-signing'
            .gray
        );
      }
      break;
    }
    case 'win32': {
      if (argv.testSign) {
        console.log('Test signing is not supported on Windows, skipping.'.gray);
      }

      if (argv.codeSign) {
        const executablesToSign = [
          path.join(packagedAppPath, CONFIG.executableName)
        ];
        if (argv.createWindowsInstaller) {
          executablesToSign.push(
            path.join(
              __dirname,
              'node_modules',
              '@atom',
              'electron-winstaller',
              'vendor',
              'Squirrel.exe'
            )
          );
        }
        codeSignOnWindows(executablesToSign);
      } else {
        console.log(
          'Skipping code-signing. Specify the --code-sign option to perform code-signing'
            .gray
        );
      }
      if (argv.createWindowsInstaller) {
        return createWindowsInstaller(packagedAppPath).then(installerPath => {
          argv.codeSign && codeSignOnWindows([installerPath]);
          return packagedAppPath;
        });
      } else {
        console.log(
          'Skipping creating installer. Specify the --create-windows-installer option to create a Squirrel-based Windows installer.'
            .gray
        );
      }
      break;
    }
    case 'linux': {
      if (argv.createDebianPackage) {
        createDebianPackage(packagedAppPath);
      } else {
        console.log(
          'Skipping creating debian package. Specify the --create-debian-package option to create it.'
            .gray
        );
      }

      if (argv.createRpmPackage) {
        createRpmPackage(packagedAppPath);
      } else {
        console.log(
          'Skipping creating rpm package. Specify the --create-rpm-package option to create it.'
            .gray
        );
      }
      break;
    }
  }

  return Promise.resolve(packagedAppPath);
}

async function build() {
  if (!argv.existingBinaries) {
    checkChromedriverVersion();
    await cleanOutputDirectory();
    await copyAssets();
    await transpile();
    generateModuleCache();
    prebuildLessCache();
    generateMetadata();
    generateAPIDocs();
    if (!argv.generateApiDocs) {
      await dumpSymbols();
    }
  }

  if (!argv.generateApiDocs) {
    const packagedAppPath = await packageApplication();
    await generateStartupSnapshot(packagedAppPath);
    await singAndCreateInstaller(packagedAppPath);
    if (argv.compressArtifacts) {
      compressArtifacts(packagedAppPath);
    } else {
      console.log(
        'Skipping artifacts compression. Specify the --compress-artifacts option to compress Pulsar binaries (and symbols on macOS)'
          .gray
      );
    }

    if (argv.install != null) {
      installApplication(packagedAppPath, argv.install);
    } else {
      console.log(
        'Skipping installation. Specify the --install option to install Pulsar'
          .gray
      );
    }
  }
}

build()
  .then(() => {
    process.exit(0);
  })
  .catch(e => {
    throw e;
  });
