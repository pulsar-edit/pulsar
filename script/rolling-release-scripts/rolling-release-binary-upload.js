// Inspired by Atom's original Nightly Release Script:
// https://github.com/atom/atom/blob/master/script/vsts/upload-artifacts.js

const fs = require("fs");
const path = require("path");
const publish = require("publish-release");
const pack = require("../../package.json");

// Since cirrus always triggers this script, we must check if the version is a rolling
// release version
const verSegments = pack.version.split(".");

if (verSegments[verSegments.length - 1].length > 4) {
  console.log(`According to our version: ${pack.version} this is not a rolling release...`);
  console.log("Exiting without changes...");
  process.exit(0);
}

(async () => {

  if (!fs.existsSync("../../binaries")) {
    console.log("No binaries found! Exiting...");
    process.exit(1);
  }

  let binaryAssets = [];

  let files = fs.readdirSync("../../binaries");

  for (let i = 0; i < files.length; i++) {
    binaryAssets.push(path.resolve(`../../binaries/${files[i]}`));
  }

  console.log("Uploading local binaries to rolling release repo...");

  const release = await publish({
    token: process.env.GITHUB_TOKEN,
    owner: "pulsar-edit",
    repo: "pulsar-rolling-releases",
    name: pack.version,
    notes: `Rolling Release: ${pack.version}`,
    tag: `v${pack.version}`,
    draft: false,
    prerelease: false,
    editRelease: true,
    reuseRelease: true,
    skipIfPublished: false,
    assets: binaryAssets
  });

  console.log(`Releases published successfully: ${release.html_url}`);
  process.exit(0);

})();
