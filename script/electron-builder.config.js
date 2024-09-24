const Path = require('path');
const dedent = require('dedent');
const normalizePackageData = require('normalize-package-data');
const FS = require('fs/promises');
const { existsSync, writeFileSync } = require('fs');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers')
const generateMetadata = require('./generate-metadata-for-builder')
const macBundleDocumentTypes = require("./mac-bundle-document-types.js");

// Ensure the user has initialized the `ppm` submodule before they try to build
// the app.
if (!existsSync(Path.join('ppm', 'bin'))) {
  console.error(dedent`
    \`ppm\` not detected. Please run:

      git submodule init
      git submodule update
  `);
  process.exit(2);
}

// Monkey-patch to not remove things I explicitly didn't say to remove.
// See: https://github.com/electron-userland/electron-builder/issues/6957
let transformer = require('app-builder-lib/out/fileTransformer')
const builder_util_1 = require("builder-util");

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
    { from: 'ppm', to: 'app/ppm' },
    { from: ICONS.png, to: 'pulsar.png' },
    { from: 'LICENSE.md', to: 'LICENSE.md' }
  ],
  compression: 'normal',
  deb: {
    afterInstall: 'script/post-install.sh',
    afterRemove: 'script/post-uninstall.sh'
  },
  rpm: {
    afterInstall: 'script/post-install.sh',
    afterRemove: 'script/post-uninstall.sh',
    compression: 'xz',
    fpm: ['--rpm-rpmbuild-define=_build_id_links none']
  },

  linux: {
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
      { from: 'ppm/bin/ppm', to: `app/ppm/bin/${ppmBaseName}` }
    ]
  },

  mac: {
    icon: ICONS.icns,
    category: "public.app-category.developer-tools",
    minimumSystemVersion: "10.8",
    hardenedRuntime: true,
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
      { from: 'ppm/bin/ppm', to: `app/ppm/bin/${ppmBaseName}` }
    ]
  },

  dmg: { sign: false },

  win: {
    icon: ICONS.ico,
    extraResources: [
      { from: ICONS.ico, to: 'pulsar.ico' },
      { from: 'resources/win/pulsar.cmd', to: `${baseName}.cmd` },
      { from: 'resources/win/pulsar.js', to: `${baseName}.js` },
      { from: 'resources/win/modifyWindowsPath.ps1', to: 'modifyWindowsPath.ps1' },
      { from: 'ppm/bin/ppm.cmd', to: `app/ppm/bin/${ppmBaseName}.cmd` },
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
    // The GUID is generated from Electron-Builder based on our AppID
    // Hardcoding it here means it will always be used as generated from
    // the AppID 'dev.pulsar-edit.pulsar'. If this value ever changes,
    // A PR to GitHub Desktop must be made with the updated value.
    include: "resources/win/installer.nsh"
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
  delete options.nsis.guid;
}

if (!ARGS.next) {
  if (process.arch === 'x64') {
    options.mac.entitlements = "resources/mac/entitlements.intel.plist";
    options.mac.entitlementsInherit = "resources/mac/entitlements.intel.plist";
  } else {
    options.mac.entitlements = "resources/mac/entitlements.silicon.plist";
    options.mac.entitlementsInherit = "resources/mac/entitlements.silicon.plist";
  }
}

function whatToBuild() {
  if (!ARGS.target) return options;
  if (!(ARGS.platform in options)) return options;
  options[ARGS.platform] = options[ARGS.platform].filter(e => e.target === ARGS.target);
  return options;
}

async function main() {
  if (ARGS.next) {
    console.log('Building PulsarNext!');
  }
  let pack = await FS.readFile('package.json', 'utf-8');
  let options = whatToBuild();
  options.extraMetadata = generateMetadata(JSON.parse(pack));
  if (ARGS.next) {
    options.extraMetadata.productName = displayName;
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
  }
}

main();
