const Path = require("path");
const FS = require("fs/promises");
const { existsSync } = require("fs");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const generateMetadata = require("./generate-metadata-for-builder");
const macBundleDocumentTypes = require("./mac-bundle-document-types.js");

// Monkey-patch to not remove things I explicitly didn't say to remove.
// See: https://github.com/electron-userland/electron-builder/issues/6957

/* eslint-disable n/no-extraneous-require */
let transformer = require("app-builder-lib/out/fileTransformer");
const builder_util_1 = require("builder-util");
/* eslint-enable n/no-extraneous-require */

transformer.createTransformer = function createTransformer(
  srcDir,
  configuration,
  extraMetadata,
  extraTransformer,
) {
  const mainPackageJson = Path.join(srcDir, "package.json");
  const isRemovePackageScripts = configuration.removePackageScripts !== false;
  const isRemovePackageKeywords = configuration.removePackageKeywords !== false;
  return (file) => {
    if (file === mainPackageJson) {
      return modifyMainPackageJson(
        file,
        extraMetadata,
        isRemovePackageScripts,
        isRemovePackageKeywords,
      );
    }
    if (extraTransformer != null) {
      return extraTransformer(file);
    } else {
      return null;
    }
  };
};

async function modifyMainPackageJson(
  file,
  extraMetadata,
  _isRemovePackageScripts,
  _isRemovePackageKeywords,
) {
  let mainPackageData = JSON.parse(await FS.readFile(file, "utf-8"));
  if (extraMetadata == null) return null;

  builder_util_1.deepAssign(mainPackageData, extraMetadata);
  return JSON.stringify(mainPackageData, null, 2);
}

// END Monkey-patch.

const builder = require("electron-builder");

const ARGS = yargs(hideBin(process.argv))
  .command("[platform]", "build for a given platform", (command) => {
    return command.positional("platform", {
      describe: 'One of "mac", "linux", or "win".',
    });
  })
  .option("target", {
    alias: "t",
    type: "string",
    description:
      "Limit to one target of the specified platform; otherwise all targets for that platform are built.",
  })
  .parse();

const displayName = "Lumine";
const baseName = "lumine";
const iconName = "beta";

const ICONS = {
  png: `resources/app-icons/${iconName}.png`,
  ico: `resources/app-icons/${iconName}.ico`,
  svg: `resources/app-icons/${iconName}.svg`,
  icns: `resources/app-icons/${iconName}.icns`,
};

let options = {
  appId: `io.github.lumine-code.${baseName}`,
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
    "spec/helpers/**/*",
    "spec/runners/**/*",

    // --- Exclusions ---
    // Core Repo Exclusions
    "!docs/",
    "!keymaps/",
    "!menus/",
    "!script/",
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
    "!**/{link,grammar-selector,json-schema-traverse,one-light-ui,autoflow,about,go-to-line,sylvester,apparatus}/spec",
    "!**/{archive-view,autocomplete,autocomplete-lumine,autocomplete-css,autosave}/spec",

    // Other Exclusions
    "!**/._*",
    "!**/node_modules/*.d.ts",
    "!**/node_modules/.bin",
    "!**/node_modules/native-mate",
    // node_modules of the fuzzy-native package are only required for building it
    "!node_modules/@lumine-code/fuzzy-native/node_modules",
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
    // "!node_modules/.bin/pegjs", // Note: https://github.com/lumine-code/lumine/pull/206

    // Exclusions borrowed from `node-prune`
    // - Files
    "!**/{Jenkinsfile}",
    "!**/{Gulpfile.js}",
    "!**/{Gruntfile.js}",
    "!**/{gulpfile.js}",
    "!**/{.tern-project}",
    "!**/{.eslintrc.js}",
    "!**/{.eslintrc.json}",
    "!**/{.eslintrc.yml}",
    "!**/{eslint.config.js,eslint.config.mjs,eslint.config.cjs}",
    "!**/{.stylelintrc}",
    "!**/{stylelint.config.js}",
    "!**/{stylelintrc.json}",
    "!**/{stylelintrc.yaml}",
    "!**/{stylelintrc.yml}",
    "!**/{stylelintrc.js}",
    "!**/{.htmllintrc}",
    "!**/{htmllint.js}",
    "!**/{.npmrc}",
    "!**/{.documentup.json}",
    "!**/{.gitlab-ci.yml}",
    "!**/{.coveralls.yml}",
    "!**/{CHANGES}",
    "!**/{changelog}",
    "!**/{.yarnclean}",
    "!**/{_config.yml}",
    "!**/{.babelrc}",
    "!**/{.yo-rc.json}",
    "!**/{jest.config.js}",
    "!**/{karma.conf.js}",
    "!**/{wallaby.js}",
    "!**/{wallaby.conf.js}",
    "!**/{.prettierrc}",
    "!**/{.prettierrc.yml}",
    "!**/{.prettierrc.toml}",
    "!**/{.prettierrc.js}",
    "!**/{.prettierrc.json}",
    "!**/{.prettier.config.js}",
    "!**/{.appveyor.yml}",
    "!**/{tsconfig.json}",
    "!**/{tslint.json}",
    // - Directories
    "!**/docs",
    "!**/doc",
    "!**/website",
    "!**/images",
    "!**/example",
    "!**/examples",
    "!**/coverage",
    "!**/.circleci",
    "!**/.github",
    // - Extensions
    "!**/*.{markdown,md,mkd,ts,jst,tgz,swp}",
  ],

  extraResources: [
    { from: "lumine.sh", to: `${baseName}.sh` },
    { from: ICONS.png, to: "lumine.png" },
    { from: "LICENSE", to: "LICENSE" },
  ],
  compression: "normal",
  deb: {
    afterInstall: "script/post-install.sh",
    afterRemove: "script/post-uninstall.sh",
    packageName: baseName,
  },
  rpm: {
    afterInstall: "script/post-install.sh",
    afterRemove: "script/post-uninstall-rpm.sh",
    compression: "xz",
    fpm: ["--rpm-digest", "sha256", "--rpm-rpmbuild-define=_build_id_links none"],
  },

  linux: {
    executableName: baseName,
    // Giving a single PNG icon to electron-builder prevents the correct
    // construction of the icon path, so we have to specify a folder containing
    // multiple icons named each with its size.
    icon: "resources/icons",
    category: "Development",
    synopsis: "A community-led hyper-hackable text editor",
    target: [{ target: "appimage" }, { target: "deb" }, { target: "rpm" }, { target: "tar.gz" }],
    extraResources: [
      {
        // Extra SVG icon included in the resources folder to give a chance to
        // Linux packagers to add a scalable desktop icon under
        // `/usr/share/icons/hicolor/scalable`
        // (used only by desktops to show it on bar/switcher and app menus).
        from: ICONS.svg,
        to: `${baseName}.svg`,
      },
    ],
  },

  mac: {
    icon: ICONS.icns,
    category: "public.app-category.developer-tools",
    // NOTE: Electron 27-32 use a version of Chromium whose minimum supported
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
      CFBundleExecutable: displayName,
      NSAppleScriptEnabled: "YES",
      NSMainNibFile: "MainMenu",
      NSRequiresAquaSystemAppearance: "NO",
      CFBundleDocumentTypes: macBundleDocumentTypes.create(),
      CFBundleURLTypes: [
        { CFBundleURLSchemes: ["atom"] },
        { CFBundleURLName: "Atom Shared Session Protocol" },
      ],
    },
    extraResources: [],
  },

  dmg: {
    sign: false,
    writeUpdateInfo: false,
  },

  // Earliest supported version of Windows is Windows 10. Electron 23 dropped
  // support for 7/8/8.1.
  win: {
    icon: ICONS.ico,
    extraResources: [
      { from: ICONS.ico, to: "lumine.ico" },
      { from: "resources/win/lumine.cmd", to: `${baseName}.cmd` },
      { from: "resources/win/lumine.js", to: `${baseName}.js` },
      { from: "resources/win/NSIS_Licenses.txt", to: "NSIS_Licenses.txt" },
    ],
    target: [{ target: "nsis" }, { target: "zip" }],
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    uninstallDisplayName: displayName,
    runAfterFinish: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    // GUID is omitted so electron-builder derives it from the appId.
    include: "resources/win/installer.nsh",
    warningsAsErrors: false,
    differentialPackage: false,
  },

  extraMetadata: {},

  afterSign: "script/mac-notarise.js",
  asarUnpack: [
    "node_modules/github/bin/*",
    "node_modules/github/lib/*", // Resolves error in console
    "**/node_modules/dugite/git/**", // Include dugite postInstall output (matching glob used for Atom)
    "**/node_modules/spellchecker/**", // Matching Atom Glob
  ],
};

function whatToBuild() {
  if (!ARGS.target) return options;
  if (!(ARGS.platform in options)) return options;
  options[ARGS.platform] = options[ARGS.platform].filter((e) => e.target === ARGS.target);
  return options;
}

async function main() {
  let pack = await FS.readFile("package.json", "utf-8");
  let options = whatToBuild();
  let parsedPackageJson = JSON.parse(pack);
  options.extraMetadata = generateMetadata(parsedPackageJson);

  try {
    let result = await builder.build({ config: options });
    if (!existsSync("binaries")) {
      await FS.mkdir("binaries");
    }
    let promises = result.map((r) => {
      let destination = Path.join("binaries", Path.basename(r));
      return FS.copyFile(r, destination);
    });
    await Promise.all(promises);
  } catch (error) {
    console.error(`Error building Lumine:`);
    console.error(error);

    process.exit(1);
  }
}

main();
