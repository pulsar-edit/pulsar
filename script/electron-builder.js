const path = require('path')
const normalizePackageData = require('normalize-package-data');
const fs = require("fs/promises");
const generateMetadata = require('./generate-metadata-for-builder')

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
const Platform = builder.Platform

const generate = require('./lib/generate-metadata.js')

const pngIcon = 'resources/app-icons/nightly/png/1024.png'
const icoIcon = 'resources/app-icons/nightly/atom.ico'
let options = {
  "appId": "link.mauricioszabo.pulsar",
  "npmRebuild": false,
  "publish": null,
  "extraResources": [
    {
      "from": "ppm",
      "to": "app/apm"
    }, {
      "from": pngIcon,
      "to": "atom.png"
    },
  ],
  compression: "normal",
  "linux": {
    "icon": pngIcon,
    "category": "Development",
    "synopsis": "A hackable text editor for the 22nd century",
    "target": [
      {
        "target": "appimage",
        "arch": "x64"
      },
      {
        "target": "deb",
        "arch": "x64"
      },
      // {
      //   "target": "rpm",
      //   "arch": "x64"
      // }
    ]
  },
  "mac": {
    "icon": pngIcon,
    "category": "Development"
  },
  "win": {
    "icon": icoIcon,
    "target": [
      { "target": "nsis" },
      { "target": "portable" }
    ]
  },
  "extraMetadata": {
  }
}

async function main() {
  const package = await fs.readFile('package.json', "utf-8")
  options.extraMetadata = generateMetadata(JSON.parse(package))
  builder.build({
    //targets: Platform.LINUX.createTarget(),
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
