const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const { resolveGitBinary } = require("dugite");

function verifyGitBinary() {
  const gitBinary = resolveGitBinary();
  if (!fs.existsSync(gitBinary)) return false;

  const result = spawnSync(gitBinary, ["--version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`Dugite Git failed verification: ${result.stderr || result.error?.message}`);
  }
  console.log(`Dugite Git ready: ${result.stdout.trim()}`);
  return true;
}

if (!verifyGitBinary()) {
  const downloadScript = path.join(
    path.dirname(require.resolve("dugite/package.json")),
    "script",
    "download-git.js",
  );
  const result = spawnSync(process.execPath, [downloadScript], {
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`Failed to download Dugite Git (exit code ${result.status})`);
  }
  if (!verifyGitBinary()) throw new Error("Dugite Git download completed without a Git binary");
}
