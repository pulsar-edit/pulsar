const fs = require("fs");
const path = require("path");

const temp = require("temp").track();

const DugiteRepositoryOperationProvider = require("../src/dugite-repository-operation-provider");

const COLOR_CONFIG_ARGUMENT_COUNT = 8;

describe("DugiteRepositoryOperationProvider", () => {
  it("exposes the embedded Git transport", async () => {
    const calls = [];
    const provider = new DugiteRepositoryOperationProvider({
      execute: async (args, workingDirectory, options) => {
        calls.push({ args, workingDirectory, options });
        return { exitCode: 0, stdout: "git version test", stderr: "" };
      },
    });
    const workingDirectory = temp.mkdirSync("dugite-transport");

    const result = await provider.executeGit(["--version"], workingDirectory, { env: { A: "B" } });

    expect(result.stdout).toBe("git version test");
    expect(calls).toEqual([
      {
        args: ["--version"],
        workingDirectory,
        options: { env: { A: "B" } },
      },
    ]);
    expect(path.isAbsolute(provider.getGitExecutablePath())).toBe(true);
  });

  it("maps repository operations to Git commands without placing commit messages in arguments", async () => {
    const calls = [];
    const provider = new DugiteRepositoryOperationProvider({
      execute: async (args, workingDirectory, options) => {
        calls.push({
          args: args.slice(COLOR_CONFIG_ARGUMENT_COUNT),
          workingDirectory,
          options,
        });
        return { exitCode: 0, stdout: "", stderr: "" };
      },
    });
    const workingDirectory = path.join(temp.mkdirSync("dugite-command-mapping"), "repo");
    const operations = provider.createRepositoryOperations({ workingDirectory });

    await operations.stageFiles(["one.txt", "two.txt"]);
    await operations.commit("Subject", {
      amend: true,
      coAuthors: [{ name: "Example User", email: "user@example.com" }],
    });

    expect(calls[0].args).toEqual(["add", "--", "one.txt", "two.txt"]);
    expect(calls[0].workingDirectory).toBe(workingDirectory);
    expect(calls[1].args).toEqual(["commit", "--file=-", "--amend"]);
    expect(calls[1].options.stdin).toBe(
      "Subject\n\nCo-authored-by: Example User <user@example.com>",
    );
    expect(calls[1].options.env.GIT_TERMINAL_PROMPT).toBe("0");
  });

  it("supports injected configuration, cleanup modes, and merge-file labels", async () => {
    const calls = [];
    const provider = new DugiteRepositoryOperationProvider({
      execute: async (args, workingDirectory, options) => {
        calls.push({ args: args.slice(COLOR_CONFIG_ARGUMENT_COUNT), workingDirectory, options });
        if (args.includes("merge-file")) {
          return { exitCode: 1, stdout: "<<<<<<< current\n", stderr: "" };
        }
        return { exitCode: 0, stdout: "", stderr: "" };
      },
    });
    const workingDirectory = temp.mkdirSync("dugite-option-mapping");
    const operations = provider.createRepositoryOperations({ workingDirectory });

    await operations.commit("Subject", {
      cleanup: "strip",
      config: { "gpg.program": "/tmp/wrapper.sh" },
    });
    const conflictCode = await operations.mergeFile(
      "ours.txt",
      "base.txt",
      "theirs.txt",
      "out.txt",
      {
        labels: ["current", "after discard", "before discard"],
      },
    );

    expect(calls[0].args).toEqual([
      "-c",
      "gpg.program=/tmp/wrapper.sh",
      "commit",
      "--file=-",
      "--cleanup=strip",
    ]);
    expect(calls[1].args).toEqual([
      "merge-file",
      "--stdout",
      "-L",
      "current",
      "-L",
      "after discard",
      "-L",
      "before discard",
      "ours.txt",
      "base.txt",
      "theirs.txt",
    ]);
    expect(conflictCode).toBe(1);
    expect(fs.readFileSync(path.join(workingDirectory, "out.txt"), "utf8")).toBe(
      "<<<<<<< current\n",
    );
  });

  it("writes merge conflict stages to the index for a tracked file", async () => {
    const provider = new DugiteRepositoryOperationProvider();
    const workingDirectory = temp.mkdirSync("dugite-conflict-index");
    await provider.initializeRepository(workingDirectory, { initialBranch: "main" });
    const operations = provider.createRepositoryOperations({ workingDirectory });
    await operations.setConfig("user.name", "Lumine Specs");
    await operations.setConfig("user.email", "specs@lumine.invalid");
    fs.writeFileSync(path.join(workingDirectory, "conflict.txt"), "committed\n");
    await operations.stageFiles(["conflict.txt"]);
    await operations.commit("Initial commit");

    const oursSha = await operations.createBlob({ stdin: "ours\n" });
    const theirsSha = await operations.createBlob({ stdin: "theirs\n" });
    await operations.writeMergeConflictToIndex("conflict.txt", null, oursSha, theirsSha);

    const stageLines = (
      await provider.run(["ls-files", "-s", "--", "conflict.txt"], workingDirectory)
    )
      .trim()
      .split("\n");
    expect(stageLines.map((line) => line.split(/\s+/)[2])).toEqual(["2", "3"]);
    expect(stageLines[0]).toContain(oursSha);
    expect(stageLines[1]).toContain(theirsSha);
  });

  it("initializes, writes, and commits through the embedded Git distribution", async () => {
    const provider = new DugiteRepositoryOperationProvider();
    const workingDirectory = temp.mkdirSync("dugite-real-repository");

    await provider.initializeRepository(workingDirectory, { initialBranch: "main" });
    const operations = provider.createRepositoryOperations({ workingDirectory });
    await operations.setConfig("user.name", "Lumine Specs");
    await operations.setConfig("user.email", "specs@lumine.invalid");
    fs.writeFileSync(path.join(workingDirectory, "README.md"), "# Test\n");
    await operations.stageFiles(["README.md"]);
    await operations.unstageFiles(["README.md"]);
    expect((await provider.run(["diff", "--cached", "--name-only"], workingDirectory)).trim()).toBe(
      "",
    );
    await operations.stageFiles(["README.md"]);
    await operations.commit("Initial commit");

    expect((await provider.run(["branch", "--show-current"], workingDirectory)).trim()).toBe(
      "main",
    );
    expect((await provider.run(["log", "-1", "--format=%s"], workingDirectory)).trim()).toBe(
      "Initial commit",
    );
  });

  it("clones a local repository through the embedded Git distribution", async () => {
    const provider = new DugiteRepositoryOperationProvider();
    const sourcePath = temp.mkdirSync("dugite-clone-source");
    const destinationPath = path.join(temp.mkdirSync("dugite-clone-parent"), "destination");

    await provider.initializeRepository(sourcePath, { initialBranch: "main" });
    const sourceOperations = provider.createRepositoryOperations({ workingDirectory: sourcePath });
    await sourceOperations.setConfig("user.name", "Lumine Specs");
    await sourceOperations.setConfig("user.email", "specs@lumine.invalid");
    fs.writeFileSync(path.join(sourcePath, "file.txt"), "content\n");
    await sourceOperations.stageFiles(["file.txt"]);
    await sourceOperations.commit("Clone source");

    await provider.cloneRepository(sourcePath, destinationPath, { noLocal: true });

    expect(fs.readFileSync(path.join(destinationPath, "file.txt"), "utf8").trim()).toBe("content");
    expect((await provider.run(["log", "-1", "--format=%s"], destinationPath)).trim()).toBe(
      "Clone source",
    );
  });

  it("returns structured errors for failed Git commands", async () => {
    const provider = new DugiteRepositoryOperationProvider();
    const workingDirectory = temp.mkdirSync("dugite-error-repository");
    await provider.initializeRepository(workingDirectory);

    let error;
    try {
      await provider.run(["checkout", "missing-reference"], workingDirectory);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error.name).toBe("DugiteOperationError");
    expect(error.code).toBe("ERR_GIT_COMMAND_FAILED");
    expect(error.command).toBe("checkout");
    expect(error.exitCode).not.toBe(0);
    expect(error.stderr.length).toBeGreaterThan(0);
  });

  it("drives the public repository API with Dugite writes and git-utils reads", async () => {
    const workingDirectory = temp.mkdirSync("dugite-public-repository-api");
    const repository = await atom.repositories.initialize(workingDirectory, {
      initialBranch: "main",
    });

    try {
      expect(repository.getOperations().isAvailable("commit")).toBe(true);
      await repository.getOperations().setConfig("user.name", "Lumine Specs");
      await repository.getOperations().setConfig("user.email", "specs@lumine.invalid");
      fs.writeFileSync(path.join(workingDirectory, "public-api.txt"), "public api\n");

      const untrackedSnapshot = await repository.refreshStatusSnapshot();
      expect(repository.getStatusEntry("public-api.txt")).toBe(untrackedSnapshot.files[0]);
      expect(repository.getStatusEntry("public-api.txt").untracked).toBe(true);

      await repository.getOperations().stageFiles(["public-api.txt"]);
      expect(repository.getStatusEntry("public-api.txt").indexStatus).toBe("A");
      await repository.getOperations().commit("Public API commit");

      expect(repository.getShortHead()).toBe("main");
      expect(repository.isPathModified("public-api.txt")).toBe(false);
      expect(repository.getStatusSnapshot().files).toEqual([]);
    } finally {
      atom.repositories.forget(repository);
    }
  });
});
