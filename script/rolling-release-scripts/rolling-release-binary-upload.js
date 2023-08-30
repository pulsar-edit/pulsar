// Inspired by Atom's original Nightly Release Script:
// https://github.com/atom/atom/blob/master/script/vsts/upload-artifacts.js

const fs = require("fs");
const path = require("path");
const publish = require("publish-release");
const packageJson = require("../../package.json");

// Since cirrus always triggers this script, we must check if the version is a rolling
// release version
const verSegments = packageJson.version.split(".");

if (verSegments[verSegments.length - 1].length < 4) {
  console.log(`According to our version: ${packageJson.version} this is not a rolling release...`);
  console.log("Exiting without changes...");
  process.exit(0);
}

// Again since cirrus ALWAYS triggers this script, without being able to skip for
// non PR builds, Cirrus provides cli args to indicate that it is being run via cirrus,
// so we can exit depending on the presence of certain env vars
let cirrusFlag = process.argv.slice(2)[0];

if (cirrusFlag === "cirrus") {
  if (typeof process.env.CIRRUS_CRON != "string") {
    // This build is the result of a PR or commit, not a cron job rolling release,
    // lets exit
    console.log("Due to the absence of `CIRRUS_CRON` it seems this is not a rolling release...");
    console.log("Exiting without uploading binaries...");
    process.exit(0);
  }
}

(async () => {

  if (!fs.existsSync("../../binaries")) {
    console.log("No binaries found! Exiting...");
    process.exit(1);
  }

  let binaryAssets = [];

  let files = fs.readdirSync("../../binaries");

  for (const file of files) {
    binaryAssets.push(path.resolve(`../../binaries/${file}`));
  }

  console.log(`Uploading local binaries to rolling release repo: ${binaryAssets.join(",")}`);

  // ROLLING_UPLOAD_TOKEN:
  // - Assigned within Cirrus via encrypted variables
  // - Assigned within GitHub Actions via secrets API
  // - GITHUB_TOKEN as fallback
  publish({
    token: process.env.ROLLING_UPLOAD_TOKEN || process.env.GITHUB_TOKEN,
    owner: "pulsar-edit",
    repo: "pulsar-rolling-releases",
    name: packageJson.version,
    notes: `Rolling Release: ${packageJson.version}`,
    tag: `v${packageJson.version}`,
    draft: false,
    prerelease: false,
    editRelease: true,
    reuseRelease: true,
    skipIfPublished: false,
    assets: binaryAssets
  }, (err, release) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    if (typeof release?.html_url !== "string") {
      console.error("No 'html_url' found on release object!");
      console.error(release);
      process.exit(1);
    } else {
      console.log(`Releases published successfully: ${release.html_url}`);
      process.exit(0);
    }

  });

})();
