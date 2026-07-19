"use strict";

// Native package-management commands for the Lumine CLI.
//
// These replace the external `ppm` binary. Everything runs headlessly in the
// main process (no editor window) using `git`, `npm`, and the filesystem, then
// exits. The behavior mirrors how the Settings view installs packages: a
// GitHub package is cloned, its production dependencies are installed, and it
// is copied into `~/.lumine/packages` with an `apmInstallSource` record so it
// can be updated later.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const CSON = require("@lumine-code/season");
const { resolvePackageSource } = require("./package-source");

function packagesDirectory() {
  return path.join(process.env.ATOM_HOME, "packages");
}

function devPackagesDirectory() {
  return path.join(process.env.ATOM_HOME, "dev", "packages");
}

function gitCommand() {
  return "git";
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function symlinkType() {
  return process.platform === "win32" ? "junction" : "dir";
}

// Runs a child process synchronously, streaming its output to the user. Throws
// on a non-zero exit code.
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error(`Could not find the \`${command}\` command on your PATH.`);
    }
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`\`${command} ${args.join(" ")}\` failed with exit code ${result.status}.`);
  }
  return result;
}

// Runs a child process synchronously and returns its captured stdout.
function capture(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`\`${command} ${args.join(" ")}\` failed with exit code ${result.status}.`);
  }
  return result.stdout;
}

function readMetadata(packagePath) {
  const metadataPath = CSON.resolve(path.join(packagePath, "package"));
  if (!metadataPath) {
    return null;
  }
  return { path: metadataPath, metadata: CSON.readFileSync(metadataPath) };
}

function writeMetadata(metadataPath, metadata) {
  if (path.extname(metadataPath) === ".json") {
    fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  } else {
    CSON.writeFileSync(metadataPath, metadata);
  }
}

async function install(source) {
  if (!source) {
    throw new Error("Specify a package to install, e.g. `lumine --install owner/repo`.");
  }

  const resolvedSource = await resolvePackageSource(source, async (cloneUrl, options, patterns) =>
    capture(gitCommand(), ["ls-remote", ...options, cloneUrl, ...patterns]),
  );
  const cloneDir = fs.mkdtempSync(path.join(os.tmpdir(), "lumine-package-"));

  try {
    console.log(`Installing ${source}…`);
    run(gitCommand(), ["init"], { cwd: cloneDir });
    run(gitCommand(), ["remote", "add", "origin", resolvedSource.cloneUrl], { cwd: cloneDir });
    run(gitCommand(), ["fetch", "--depth", "1", "origin", resolvedSource.fetchRef], {
      cwd: cloneDir,
    });
    run(gitCommand(), ["checkout", "--detach", "FETCH_HEAD"], { cwd: cloneDir });
    const sha = capture(gitCommand(), ["rev-parse", "HEAD"], { cwd: cloneDir }).trim();
    if (resolvedSource.sha && sha !== resolvedSource.sha) {
      throw new Error(`Repository ref changed while installing ${source}; please try again.`);
    }
    run(npmCommand(), ["install", "--omit=dev"], { cwd: cloneDir });

    const read = readMetadata(cloneDir);
    if (!read) {
      throw new Error(
        "The repository does not contain a package.json, package.jsonc, or package.cson file.",
      );
    }

    const { path: metadataPath, metadata } = read;
    metadata.apmInstallSource = {
      type: "git",
      source: resolvedSource.source,
      repository: resolvedSource.repository,
      selector: resolvedSource.selector,
      updatePolicy: resolvedSource.updatePolicy,
      sha,
    };
    writeMetadata(metadataPath, metadata);

    const name = metadata.name || path.basename(resolvedSource.repository);
    const targetDir = path.join(packagesDirectory(), name);
    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.mkdirSync(packagesDirectory(), { recursive: true });
    fs.cpSync(cloneDir, targetDir, { recursive: true });
    fs.rmSync(path.join(targetDir, ".git"), { recursive: true, force: true });

    console.log(`Installed ${name} to ${targetDir}`);
  } finally {
    fs.rmSync(cloneDir, { recursive: true, force: true });
  }
}

function uninstall(name) {
  if (!name) {
    throw new Error("Specify a package to uninstall, e.g. `lumine --uninstall my-package`.");
  }

  const targetDir = path.join(packagesDirectory(), name);
  if (!fs.existsSync(targetDir)) {
    throw new Error(`'${name}' is not installed in ${packagesDirectory()}.`);
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  console.log(`Uninstalled ${name}`);
}

function readVersion(packagePath) {
  const read = readMetadata(packagePath);
  return read && read.metadata && read.metadata.version ? read.metadata.version : null;
}

function listDirectory(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) => !entry.name.startsWith(".") && (entry.isDirectory() || entry.isSymbolicLink()),
    )
    .map((entry) => {
      const version = readVersion(path.join(directory, entry.name));
      return version ? `${entry.name}@${version}` : entry.name;
    })
    .sort();
}

function list() {
  const sections = [
    { title: "Community Packages", directory: packagesDirectory() },
    { title: "Development Packages", directory: devPackagesDirectory() },
  ];

  let printedAny = false;
  for (const { title, directory } of sections) {
    const names = listDirectory(directory);
    if (names.length === 0) {
      continue;
    }
    printedAny = true;
    console.log(`${title} (${names.length})`);
    for (const name of names) {
      console.log(`└── ${name}`);
    }
    console.log("");
  }

  if (!printedAny) {
    console.log("No packages installed.");
  }
}

function link(target, { dev } = {}) {
  if (!target) {
    throw new Error("Specify a package directory to link, e.g. `lumine --link .`.");
  }

  const packagePath = path.resolve(target);
  if (!fs.existsSync(packagePath)) {
    throw new Error(`No such directory: ${packagePath}`);
  }

  const read = readMetadata(packagePath);
  const name = (read && read.metadata && read.metadata.name) || path.basename(packagePath);
  const linkDirectory = dev ? devPackagesDirectory() : packagesDirectory();
  const linkPath = path.join(linkDirectory, name);

  fs.mkdirSync(linkDirectory, { recursive: true });
  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.symlinkSync(packagePath, linkPath, symlinkType());

  console.log(`Linked ${packagePath} -> ${linkPath}`);
}

function unlink(target, { dev } = {}) {
  if (!target) {
    throw new Error("Specify a package name or directory to unlink, e.g. `lumine --unlink .`.");
  }

  // Accept either a package name or a path to the linked directory.
  const name = fs.existsSync(target) ? path.basename(path.resolve(target)) : target;
  const directories = dev
    ? [devPackagesDirectory()]
    : [packagesDirectory(), devPackagesDirectory()];

  let unlinked = false;
  for (const directory of directories) {
    const linkPath = path.join(directory, name);
    if (fs.existsSync(linkPath) && fs.lstatSync(linkPath).isSymbolicLink()) {
      fs.rmSync(linkPath, { recursive: true, force: true });
      console.log(`Unlinked ${linkPath}`);
      unlinked = true;
    }
  }

  if (!unlinked) {
    throw new Error(`No linked package named '${name}' was found.`);
  }
}

const COMMANDS = { install, uninstall, list, link, unlink };

// Runs a parsed package command. `command` is `{ name, arg, dev }`. Returns a
// process exit code.
async function runPackageCommand(command) {
  const handler = COMMANDS[command.name];
  if (!handler) {
    process.stderr.write(`Unknown package command: ${command.name}\n`);
    return 1;
  }

  try {
    await handler(command.arg, { dev: command.dev });
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message || error}\n`);
    return 1;
  }
}

module.exports = { runPackageCommand };
