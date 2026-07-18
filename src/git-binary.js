const fs = require("fs");
const path = require("path");

const IS_WINDOWS = process.platform === "win32";

// Resolve the git binary Lumine runs, replacing dugite's bundled distribution
// with the user's system git (like VS Code). An explicit configured path wins
// (`core.git.path`, à la VS Code's `git.path`); otherwise git is located on
// PATH. Falls back to the bare command name so spawn surfaces a clear ENOENT
// when git is genuinely absent.

function isExecutableFile(candidate) {
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

// Locate a command on PATH, honoring PATHEXT on Windows.
function which(command) {
  const extensions = IS_WINDOWS ? (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";") : [""];
  const directories = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  for (const directory of directories) {
    for (const extension of extensions) {
      const candidate = path.join(directory, command + extension);
      if (isExecutableFile(candidate)) return candidate;
    }
  }
  return null;
}

function resolveGitPath(configuredPath) {
  if (configuredPath && isExecutableFile(configuredPath)) return configuredPath;
  return which("git") || (IS_WINDOWS ? "git.exe" : "git");
}

module.exports = { resolveGitPath, which };
