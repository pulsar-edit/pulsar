const path = require('path')
const normalizePackageData = require('normalize-package-data');
const fs = require("fs/promises");
const generateMetadata = require('./generate-metadata-for-builder')
const macBundleDocumentTypes = require("./mac-bundle-document-types.js");

// Monkey-patch to not remove things I explicitly didn't say so
// See: https://github.com/electron-userland/electron-builder/issues/6957
let transformer = require('app-builder-lib/out/fileTransformer')
const builder_util_1 = require("builder-util");

transformer.createTransformer = function(srcDir, configuration, extraMetadata, extraTransformer) {
    const mainPackageJson = path.join(srcDir, "package.json");
    const isRemovePackageScripts = configuration.removePackageScripts !== false;
    const isRemovePackageKeywords = configuration.removePackageKeywords !== false;
    const packageJson = path.sep + "package.json";
    return file => {
        if (file === mainPackageJson) {
            return modifyMainPackageJson(file, extraMetadata, isRemovePackageScripts, isRemovePackageKeywords);
        }
        if (extraTransformer != null) {
            return extraTransformer(file);
        }
        else {
            return null;
        }
    };
}
async function modifyMainPackageJson(file, extraMetadata, isRemovePackageScripts, isRemovePackageKeywords) {
    const mainPackageData = JSON.parse(await fs.readFile(file, "utf-8"));
    if (extraMetadata != null) {
        builder_util_1.deepAssign(mainPackageData, extraMetadata);
        return JSON.stringify(mainPackageData, null, 2);
    }
    return null;
}
/// END Monkey-Patch

const builder = require("electron-builder")

const pngIcon = 'resources/app-icons/beta.png'
const icoIcon = 'resources/app-icons/beta.ico'
const svgIcon = 'resources/app-icons/beta.svg'
const icnsIcon = 'resources/app-icons/beta.icns'

let options = {
  "appId": "dev.pulsar-edit.pulsar",
  "npmRebuild": false,
  "publish": null,
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
    "!node_modules/fuzzy-native/node_modules", // node_modules of the fuzzy-native package are only required for building it
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
  "extraResources": [
    {
      "from": "pulsar.sh",
      "to": "pulsar.sh"
    }, {
      "from": "ppm",
      "to": "app/ppm"
    }, {
      "from": pngIcon,
      "to": "pulsar.png"
    }, {
      "from": "LICENSE.md",
      "to": "LICENSE.md"
    },
  ],
  compression: "normal",
  deb: {
    afterInstall: "script/post-install.sh",
    afterRemove: "script/post-uninstall.sh",
  },
  rpm: {
    afterInstall: "script/post-install.sh",
    afterRemove: "script/post-uninstall.sh",
    compression: 'xz',
    fpm: ['--rpm-rpmbuild-define=_build_id_links none']
  },
  "linux": {
    // Giving a single PNG icon to electron-builder prevents the correct
    // construction of the icon path, so we have to specify a folder containing
    // multiple icons named each with its size.
    "icon": "resources/icons",
    "category": "Development",
    "synopsis": "A Community-led Hyper-Hackable Text Editor",
    "target": [
      { target: "appimage" },
      { target: "deb" },
      { target: "rpm" },
      { target: "tar.gz" }
    ],
    "extraResources": [
      {
        // Extra SVG icon included in the resources folder to give a chance to
        // Linux packagers to add a scalable desktop icon under
        // /usr/share/icons/hicolor/scalable
        // (used only by desktops to show it on bar/switcher and app menus).
        "from": svgIcon,
        "to": "pulsar.svg"
      },
    ],
  },
  "mac": {
    "icon": icnsIcon,
    "category": "public.app-category.developer-tools",
    "minimumSystemVersion": "10.8",
    "hardenedRuntime": true,
    "extendInfo": {
      // This contains extra values that will be inserted into the App's plist
      "CFBundleExecutable": "Pulsar",
      "NSAppleScriptEnabled": "YES",
      "NSMainNibFile": "MainMenu",
      "NSRequiresAquaSystemAppearance": "NO",
      "CFBundleDocumentTypes": macBundleDocumentTypes.create(),
      "CFBundleURLTypes": [
        { "CFBundleURLSchemes": [ "atom" ] },
        { "CFBundleURLName": "Atom Shared Session Protocol" }
      ]
    },
  },
  "dmg": {
    "sign": false
  },
  "win": {
    "icon": icoIcon,
    "extraResources": [
      {
        "from": icoIcon,
        "to": "pulsar.ico"
      },
      {
        "from": "resources/win/pulsar.cmd",
        "to": "pulsar.cmd"
      },
      {
        "from": "resources/win/pulsar.js",
        "to": "pulsar.js"
      },
      {
        "from": "resources/win/modifyWindowsPath.ps1",
        "to": "modifyWindowsPath.ps1"
      }
    ],
    "target": [
      { "target": "nsis" },
      { target: "zip" },
    ],
  },
  // Windows NSIS Configuration
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "uninstallDisplayName": "Pulsar",
    "runAfterFinish": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "guid": "0949b555-c22c-56b7-873a-a960bdefa81f",
    // The GUID is generated from Electron-Builder based on our AppID
    // Hardcoding it here means it will always be used as generated from
    // the AppID 'dev.pulsar-edit.pulsar'. If this value ever changes,
    // A PR to GitHub Desktop must be made with the updated value
    "include": "resources/win/installer.nsh"
  },
  "extraMetadata": {
  },
  "afterSign": "script/mac-notarise.js",
  "asarUnpack": [
    "node_modules/github/bin/*",
    "node_modules/github/lib/*", // Resolves Error in console
    "**/node_modules/dugite/git/**", // Include dugite postInstall output (matching glob used for Atom)
    "**/node_modules/spellchecker/**", // Matching Atom Glob
  ]

}

/**
 The below optional entitlements is needed for the following reasons:
  - `allow-jit` needs to be applied on silicon builds for WASM to work:
      https://github.com/pulsar-edit/pulsar/pull/454
  - But setting `allow-jit` on Intel decreases performance of `fork()` operations
    e.g. `require('child_process').spanw(...)`
  - This monkey patch will no longer be needed when we can bump Electron
    and get `libuv` `v1.42.0` as this issue is fixed upstream there
  - See: https://github.com/microsoft/vscode/issues/105446
*/
if (process.arch === "x64") {
  options.mac.entitlements = "resources/mac/entitlements.intel.plist";
  options.mac.entitlementsInherit = "resources/mac/entitlements.intel.plist";
} else {
  options.mac.entitlements = "resources/mac/entitlements.silicon.plist";
  options.mac.entitlementsInherit = "resources/mac/entitlements.silicon.plist";
}

function whatToBuild() {
  const argvStartingWith = process.argv.findIndex(e => e.match('electron-builder.js'))
  const what = process.argv[argvStartingWith + 1]
  if(what) {
    const filter = e => e.target === what
    options.linux.target = options.linux.target.filter(filter)
    options.win.target = options.win.target.filter(filter)
    // options.mac.target = options.mac.target.filter(filter)
    return options
  } else {
    return options
  }
}

async function main() {
  const package = await fs.readFile('package.json', "utf-8")
  let options = whatToBuild()
  options.extraMetadata = generateMetadata(JSON.parse(package))
  builder.build({
    config: options
  }).then((result) => {
    console.log("Built binaries")
    fs.mkdir('binaries').catch(() => "")
    Promise.all(result.map(r => fs.copyFile(r, path.join('binaries', path.basename(r)))))
  }).catch((error) => {
    console.error("Error building binaries")
    console.error(error)
    process.exit(1)
  })
}

main()
