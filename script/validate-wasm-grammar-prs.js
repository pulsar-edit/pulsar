/*
 * This script is called via `validate-wasm-grammar-prs.yml`
 * It's purpose is to ensure that everytime a `.wasm` file is changed in a PR
 * That the `parserSource` key of the grammar that uses that specific `.wasm`
 * file is also updated.
 * This way we can ensure that the `parserSource` is always accurate, and is
 * never forgotten about.
 */

const cp = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const CSON = require("season");

// Change this if you want more logs
let verbose = true;

// Lets first find our common ancestor commit
// This lets us determine the commit where the branch or fork departed from
const commonAncestorCmd = cp.spawnSync("git", [ "merge-base", "origin/master", "HEAD^" ]);

if (commonAncestorCmd.status !== 0 || commonAncestorCmd.stderr.toString().length > 0) {
  console.error("Git Command has failed!");
  console.error("'git merge-base origin/master HEAD^'");
  console.error(commonAncestorCmd.stderr.toString());
  process.exit(1);
}

const commit = commonAncestorCmd.stdout.toString().trim();

if (verbose) {
  console.log(`Common Ancestor Commit: '${commit}'`);
}

const cmd = cp.spawnSync("git", [ "diff", "--name-only", "-r", "HEAD", commit])

if (cmd.status !== 0 || cmd.stderr.toString().length > 0) {
  console.error("Git Command has failed!");
  console.error(`'git diff --name-only -r HEAD ${commit}'`);
  console.error(cmd.stderr.toString());
  process.exit(1);
}

const changedFiles = cmd.stdout.toString().split("\n");
// This gives us an array of the name and path of every single changed file from the last two commits
// Now to check if there's any changes we care about.

if (verbose) {
  console.log("Array of changed files between commits:");
  console.log(changedFiles);
}

const wasmFilesChanged = changedFiles.filter(element => element.endsWith(".wasm"));

if (wasmFilesChanged.length === 0) {
  // No WASM files have been modified. Return success
  console.log("No WASM files have been changed.");
  process.exit(0);
}

// Now for every single wasm file that's been changed, we must validate those changes
// are also accompanied by a change in the `parserSource` key

for (const wasmFile of wasmFilesChanged) {
  const wasmPath = path.dirname(wasmFile);

  const files = fs.readdirSync(path.join(wasmPath, ".."));
  console.log(`Detected changes to: ${wasmFile}`);

  if (verbose) {
    console.log("Verbose file check details:");
    console.log(wasmFile);
    console.log(wasmPath);
    console.log(files);
    console.log("\n");
  }

  for (const file of files) {
    const filePath = path.join(wasmPath, "..", file);
    console.log(`Checking: ${filePath}`);

    if (fs.lstatSync(filePath).isFile()) {
      const contents = CSON.readFileSync(filePath);

      // We now have the contents of one of the grammar files for this specific grammar.
      // Since each grammar may contain multiple grammar files, we need to ensure
      // that this particular one is using the tree-sitter wasm file that was
      // actually changed.
      const grammarFile = contents.treeSitter?.grammar ?? "";

      if (path.basename(grammarFile) === path.basename(wasmFile)) {
        // This grammar uses the WASM file that's changed. So we must ensure our key has also changed
        // Sidenote we use `basename` here, since the `wasmFile` will be
        // a path relative from the root of the repo, meanwhile `grammarFile`
        // will be relative from the file itself

        // In order to check the previous state of what the key is, we first must retreive the file prior to this PR
        const getPrevFile = cp.spawnSync("git", [ "show", `${commit}:./${filePath}` ]);

        if (getPrevFile.status !== 0 || getPrevFile.stderr.toString().length > 0) {
          // This can fail for two major reasons
          // 1. The `git show` command has returned an error code other than `0`, failing.
          // 2. This is a new file, and it failed to find an earlier copy (which didn't exist)
          // So that we don't fail brand new TreeSitter grammars, we manually check for number 2

          if (getPrevFile.stderr.toString().includes("exists on disk, but not in")) {
            // Looks like this file is new. Skip this check
            if (verbose) {
              console.log("Looks like this file is new. Skipping...");
            }
            continue;
          }

          console.error("Git command failed!");
          console.error(`'git show ${commit}:./${filePath}'`);
          console.error(getPrevFile.stderr.toString());
          process.exit(1);
        }

        fs.writeFileSync(path.join(wasmPath, "..", `OLD-${file}`), getPrevFile.stdout.toString());

        const oldContents = CSON.readFileSync(path.join(wasmPath, "..", `OLD-${file}`));
        const oldParserSource = oldContents.treeSitter?.parserSource ?? "";
        const newParserSource = contents.treeSitter?.parserSource ?? "";

        if (newParserSource.length === 0) {
          console.error(`Failed to find the new \`parserSource\` within: '${filePath}'`);
          console.error(contents.treeSitter);
          process.exit(1);
        }

        if (oldParserSource == newParserSource) {
          // The repo and commit is identical! This means it hasn't been updated
          console.error(`The \`parserSource\` key of '${filePath}' has not been updated!`);
          console.error(`Current key: ${newParserSource} - Old key: ${oldParserSource}`);
          process.exit(1);
        }

        // Else it looks like it has been updated properly
        console.log(`Validated \`parserSource\` has been updated within '${filePath}' properly.`);
      } else {
        if (verbose) {
          console.log("This grammar file doesn't use a WASM file that's changed (On the current iteration)");
        }
      }
    }
  }
}
