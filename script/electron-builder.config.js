/* eslint-disable no-process-exit */
const Path = require('path');
const dedent = require('dedent');
const FS = require('fs/promises');
const { existsSync } = require('fs');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers')
const generateMetadata = require('./generate-metadata-for-builder')
const macBundleDocumentTypes = require("./mac-bundle-document-types.js");

// Ensure the user has initialized and built the `ppm` submodule before they
// try to build the app.
if (!existsSync(Path.join('ppm', 'bin'))) {
  console.error(dedent`
    \`ppm\` not detected. Please run:

      git submodule update --init
      yarn run build:apm
  `);
  process.exit(2);
} else if (
  !existsSync(
    Path.join(
      'ppm',
      'bin',
      process.platform === 'win32' ? 'node.exe' : 'node'
    )
  )
) {
  console.error(dedent`
    \`ppm\` not built. Please run:

    yarn run build:apm
  `);
  process.exit(2);
}

// Monkey-patch to not remove things I explicitly didn't say to remove.
// See: https://github.com/electron-userland/electron-builder/issues/6957

/* eslint-disable node/no-extraneous-require */
let transformer = require('app-builder-lib/out/fileTransformer')
const builder_util_1 = require("builder-util");
/* eslint-enable node/no-extraneous-require */

transformer.createTransformer = function createTransformer(srcDir, configuration, extraMetadata, extraTransformer) {
  const mainPackageJson = Path.join(srcDir, "package.json");
  const isRemovePackageScripts = configuration.removePackageScripts !== false;
  const isRemovePackageKeywords = configuration.removePackageKeywords !== false;
  return file => {
    if (file === mainPackageJson) {
      return modifyMainPackageJson(
        file,
        extraMetadata,
        isRemovePackageScripts,
        isRemovePackageKeywords
      );
    }
    if (extraTransformer != null) {
      return extraTransformer(file);
    }
    else { return null; }
  };
}

async function modifyMainPackageJson(
  file,
  extraMetadata,
  _isRemovePackageScripts,
  _isRemovePackageKeywords
) {
  let mainPackageData = JSON.parse(await FS.readFile(file, 'utf-8'));
  if (extraMetadata == null) return null;

  builder_util_1.deepAssign(mainPackageData, extraMetadata);
  return JSON.stringify(mainPackageData, null, 2);
}

// END Monkey-patch.

// eslint-disable-next-line node/no-unpublished-require
const builder = require('electron-builder');

const ICONS = {
  png: 'resources/app-icons/beta.png',
  ico: 'resources/app-icons/beta.ico',
  svg: 'resources/app-icons/beta.svg',
  icns: 'resources/app-icons/beta.icns'
};

const ARGS = yargs(hideBin(process.argv))
  .command('[platform]', 'build for a given platform', () => {
    return yargs.positional('platform', {
      describe: 'One of "mac", "linux", or "win".'
    })
  })
  .option('target', {
    alias: 't',
    type: 'string',
    description: 'Limit to one target of the specified platform; otherwise all targets for that platform are built.'
  })
  .option('next', {
    alias: 'n',
    type: 'boolean',
    description: 'Builds a "canary" with a separate bundle identifier and app name so it can run alongside ordinary Pulsar.'
  })
  .parse();

// The difference in base name matters for the app ID (which helps the OS
// understand that PulsarNext is not the same as Pulsar), but also for other
// reasons.
//
// The `pulsar-next` executable name is how it knows it's a canary release
// channel and should use a different home directory from the stable release.
// Same for `ppm-next`; it's identical to `ppm`, but the name of the script
// tells it where to install packages.
const displayName = ARGS.next ? 'PulsarNext' : 'Pulsar';
const baseName = ARGS.next ? 'pulsar-next' : 'pulsar';
const ppmBaseName = ARGS.next ? 'ppm-next' : 'ppm';

let options = {
  appId: `dev.pulsar-edit.${baseName}`,
  npmRebuild: false,
  publish: null,
  files: [
    // --- Inclusions ---
    // Core Repo Inclusions
    "package.json",
    "dot-atom/**/*",
    "exports/**/*",
    "resources/**/*",
    "src/**/*",
    "static/**/*",
    "vendor/**/*",
    "node_modules/**/*",

    // Core Repo Test Inclusions
    "spec/jasmine-test-runner.js",
    "spec/spec-helper.js",
    "spec/jasmine-junit-reporter.js",
    "spec/spec-helper-functions.js",
    "spec/atom-reporter.js",
    "spec/jasmine-list-reporter.js",

    // --- Exclusions ---
    // Core Repo Exclusions
    "!docs/",
    "!keymaps/",
    "!menus/",
    "!script/",
    "!integration/",
    "!hooks/",

    // Git Related Exclusions
    "!**/{.git,.gitignore,.gitattributes,.git-keep,.github}",
    "!**/{.eslintignore,PULL_REQUEST_TEMPLATE.md,ISSUE_TEMPLATE.md,CONTRIBUTING.md,SECURITY.md}",

    // Development Tools Exclusions
    "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json,.npmignore}",
    "!**/npm/{doc,html,man}",
    "!.editorconfig",
    "!**/{appveyor.yml,.travis.yml,circle.yml}",
    "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
    "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
    "!**/{.jshintrc,.pairs,.lint,.lintignore,.eslintrc,.jshintignore}",
    "!**/{.coffeelintignore,.editorconfig,.nycrc,.coffeelint.json,.vscode,coffeelint.json}",

    // Common File Exclusions
    "!**/{.DS_Store,.hg,.svn,CVS,RCS,SCCS}",

    // Build Chain Exclusions
    "!**/*.{cc,h}", // Ignore *.cc and *.h files from native modules
    "!**/*.js.map",
    "!**/{Makefile}",
    "!**/build/{binding.Makefile,config.gypi,gyp-mac-tool,Makefile}",
    "!**/build/Release/{obj.target,obj,.deps}",

    // Test Exclusions
    "!**/pegjs/examples",
    "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
    "!**/node_modules/babel-core/lib/transformation/transforers/spec", // Ignore babel-core spec
    "!**/{oniguruma,dev-live-reload,deprecation-cop,one-dark-ui,incompatible-packages,git-diff,line-ending-selector}/spec",
    "!**/{link,grammar-selector,json-schema-traverse,exception-reporting,one-light-ui,autoflow,about,go-to-line,sylvester,apparatus}/spec",
    "!**/{archive-view,autocomplete-plus,autocomplete-atom-api,autocomplete-css,autosave}/spec",

    // Other Exclusions
    "!**/._*",
    "!**/node_modules/*.d.ts",
    "!**/node_modules/.bin",
    "!**/node_modules/native-mate",
    // node_modules of the fuzzy-native package are only required for building it
    "!node_modules/fuzzy-native/node_modules",
    "!**/node_modules/spellchecker/vendor/hunspell/.*",
    "!**/git-utils/deps",
    "!**/oniguruma/deps",
    "!**/less/dist",
    "!**/get-parameter-names/node_modules/testla",
    "!**/get-parameter-names/node_modules/.bin/testla",
    "!**/jasmine-reporters/ext",
    "!**/deps/libgit2",
    // These are only required in dev-mode, when pegjs grammars aren't precompiled
    // "!node_modules/loophole", // Note: We do need these packages. Because our PegJS files _aren't_ all pre-compiled.
    // "!node_modules/pegjs",    // Note: if these files are excluded, 'snippets' package breaks.
    // "!node_modules/.bin/pegjs", // Note: https://github.com/pulsar-edit/pulsar/pull/206
  ],

  extraResources: [
    { from: 'pulsar.sh', to: `${baseName}.sh` },
    {
      // Be selective in what we copy over to PPM’s `bin` directory. On
      // Windows, the contents of this entire folder will be available on the
      // `PATH`, so we shouldn’t put stray stuff in here.
      //
      // Below we copy over `ppm` itself, but it might have its name changed in
      // the process depending on the release channel.
      filter: [
        // Everything below `ppm`…
        'ppm/**',
        // …except for files inside the `bin` directory.
        '!ppm/bin'
      ],
      // This somehow puts it all in the right place with the `ppm` folder
      // intact.
      to: 'app'
    },
    { from: ICONS.png, to: 'pulsar.png' },
    { from: 'LICENSE.md', to: 'LICENSE.md' }
  ],
  compression: 'normal',
  deb: {
    afterInstall: 'script/post-install.sh',
    afterRemove: 'script/post-uninstall.sh',
    packageName: baseName
  },
  rpm: {
    afterInstall: 'script/post-install.sh',
    afterRemove: 'script/post-uninstall.sh',
    compression: 'xz',
    fpm: ['--rpm-rpmbuild-define=_build_id_links none']
  },

  linux: {
    executableName: baseName,
    // Giving a single PNG icon to electron-builder prevents the correct
    // construction of the icon path, so we have to specify a folder containing
    // multiple icons named each with its size.
    icon: "resources/icons",
    category: "Development",
    synopsis: "A community-led hyper-hackable text editor",
    target: [
      { target: 'appimage' },
      { target: 'deb' },
      { target: 'rpm' },
      { target: 'tar.gz' }
    ],
    extraResources: [
      {
        // Extra SVG icon included in the resources folder to give a chance to
        // Linux packagers to add a scalable desktop icon under
        // `/usr/share/icons/hicolor/scalable`
        // (used only by desktops to show it on bar/switcher and app menus).
        "from": ICONS.svg,
        "to": "pulsar.svg"
      },
      { from: 'ppm/bin/ppm', to: `app/ppm/bin/${ppmBaseName}` },
      { from: 'ppm/bin/node', to: `app/ppm/bin/node` }
    ]
  },

  mac: {
    icon: ICONS.icns,
    category: "public.app-category.developer-tools",
    // NOTE: Electron 27 uses a version of Chromium whose minimum supported
    // version of macOS is 10.15.
    //
    // Electron 33 will drop support for 10.15, at which point the minimum
    // supported version will be macOS 11.
    minimumSystemVersion: "10.15",
    hardenedRuntime: true,
    // Now that we're on a recent Electron, we no longer have to hide the
    // `allow-jit` entitlement from Intel Macs in order to work around a
    // `libuv` bug.
    entitlements: "resources/mac/entitlements.plist",
    entitlementsInherit: "resources/mac/entitlements.plist",
    extendInfo: {
      // Extra values that will be inserted into the app's plist.
      "CFBundleExecutable": displayName,
      "NSAppleScriptEnabled": "YES",
      "NSMainNibFile": "MainMenu",
      "NSRequiresAquaSystemAppearance": "NO",
      "CFBundleDocumentTypes": macBundleDocumentTypes.create(),
      "CFBundleURLTypes": [
        { "CFBundleURLSchemes": [ "atom" ] },
        { "CFBundleURLName": "Atom Shared Session Protocol" }
      ]
    },
    extraResources: [
      { from: 'ppm/bin/ppm', to: `app/ppm/bin/${ppmBaseName}` },
      { from: 'ppm/bin/node', to: `app/ppm/bin/node` }
    ]
  },

  dmg: { sign: false },

  // Earliest supported version of Windows is Windows 10. Electron 23 dropped
  // support for 7/8/8.1.
  win: {
    icon: ICONS.ico,
    extraResources: [
      { from: ICONS.ico, to: 'pulsar.ico' },
      { from: 'resources/win/pulsar.cmd', to: `${baseName}.cmd` },
      { from: 'resources/win/pulsar.js', to: `${baseName}.js` },
      { from: 'resources/win/modifyWindowsPath.ps1', to: 'modifyWindowsPath.ps1' },
      // Copy `ppm.cmd` to the `ppm/bin` directory, possibly renaming it
      // `ppm-next.cmd` depending on release channel.
      { from: 'ppm/bin/ppm.cmd', to: `app/ppm/bin/${ppmBaseName}.cmd` },
      { from: 'ppm/bin/node.exe', to: `app/ppm/bin/node.exe` },
    ],
    target: [
      { target: 'nsis' },
      { target: 'zip' }
    ]
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    uninstallDisplayName: displayName,
    runAfterFinish: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    guid: "0949b555-c22c-56b7-873a-a960bdefa81f", // TODO
    // The GUID is generated from Electron-Builder based on our AppID.
    // Hardcoding it here means it will always be used as generated from the
    // AppID 'dev.pulsar-edit.pulsar'. If this value ever changes, a PR to
    // GitHub Desktop must be made with the updated value.
    //
    // We delete this value when building PulsarNext so that it’s regenerated
    // based on the app ID. Otherwise the OS might consider it equivalent to
    // stable Pulsar in some ways.
    //
    // TODO: On first look, this installer script seems not to need any
    // updating for PulsarNext, but we should make sure.
    include: "resources/win/installer.nsh",
    warningsAsErrors: false
  },

  extraMetadata: {},

  afterSign: 'script/mac-notarise.js',
  asarUnpack: [
    "node_modules/github/bin/*",
    "node_modules/github/lib/*",       // Resolves error in console
    "**/node_modules/dugite/git/**",   // Include dugite postInstall output (matching glob used for Atom)
    "**/node_modules/spellchecker/**", // Matching Atom Glob
  ]
};

if (ARGS.next) {
  // TODO: Should PulsarNext have its own guid? `electron-builder` docs suggest
  // it will be generated from the `appId` if omitted, so I think this is fine.
  delete options.nsis.guid;
}

function whatToBuild() {
  if (!ARGS.target) return options;
  if (!(ARGS.platform in options)) return options;
  options[ARGS.platform] = options[ARGS.platform].filter(e => e.target === ARGS.target);
  return options;
}

function generateVersionNumber(existingVersion, channel = '') {
  // This matches stable, dev (with or without commit hash) and any other
  // release channel following the pattern '1.100.0-channel0'
  const match = existingVersion.match(/(\d+\.\d+\.\d+)(?:-([a-z]+)(\d+|-\w{4,})?)?$/);
  if (!match || !match[1]) {
    // We can't parse this. Return it as-is.
    return existingVersion;
  }

  let tag = channel ? `-${channel}` : ''
  return `${match[1]}${tag}`
}

async function main() {
  if (ARGS.next) {
    console.log('Building PulsarNext!');
  }
  let pack = await FS.readFile('package.json', 'utf-8');
  let options = whatToBuild();
  let parsedPackageJson = JSON.parse(pack);
  let rewrotePackageJson = false;
  options.extraMetadata = generateMetadata(parsedPackageJson);
  if (ARGS.next) {
    options.extraMetadata.productName = displayName;
    if (!process.env.CI && !parsedPackageJson.version.endsWith('-next')) {
      // We want this local build to have a version number that ends in `-next`
      // instead of `-dev` or something else. In order to use an arbitrary
      // version number, we must write it to `package.json` and restore the
      // original when we're done. This is silly, but it's what
      // `electron-builder` mandates.
      //
      // In CI, we've already changed `package.json` to the version number we
      // want, so we can skip this step.
      let newVersionNumber = generateVersionNumber(parsedPackageJson.version, 'next');
      let newParsedPackageJson = JSON.parse(pack);
      newParsedPackageJson.version = newVersionNumber;
      console.log('Temporarily changing package.json to use version:', newVersionNumber);
      rewrotePackageJson = true;
      await FS.writeFile(
        'package.json',
        JSON.stringify(newParsedPackageJson, null, 2),
        'utf-8'
      );
    }
  }

  try {
    let result = await builder.build({ config: options });
    if (!existsSync('binaries')) {
      await FS.mkdir('binaries');
    }
    let promises = result.map(r => {
      let destination = Path.join('binaries', Path.basename(r));
      return FS.copyFile(r, destination);
    });
    await Promise.all(promises);
  } catch (error) {
    console.error(`Error building Pulsar:`);
    console.error(error);

    process.exit(1);
  } finally {
    // If we rewrote the version number, ensure we restore the original
    // `package.json` contents.
    if (rewrotePackageJson) {
      console.log('Restoring original package.json');
      await FS.writeFile('package.json', pack, 'utf-8');
    }
  }
}

main();
