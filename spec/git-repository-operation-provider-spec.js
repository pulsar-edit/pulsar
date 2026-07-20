const fs = require("fs");
const path = require("path");

const temp = require("temp").track();

const GitRepositoryOperationProvider = require("../src/git-repository-operation-provider");

describe("GitRepositoryOperationProvider", () => {
  it("exposes the embedded Git transport", async () => {
    const calls = [];
    const provider = new GitRepositoryOperationProvider({
      exec: async (args, workingDirectory, options, raw) => {
        calls.push({ args, workingDirectory, options, raw });
        return { exitCode: 0, stdout: "git version test", stderr: "" };
      },
    });
    const workingDirectory = temp.mkdirSync("git-transport");

    const result = await provider.executeGit(["--version"], workingDirectory, { env: { A: "B" } });

    expect(result.stdout).toBe("git version test");
    expect(calls).toEqual([
      {
        args: ["--version"],
        workingDirectory,
        options: { env: { A: "B" } },
        raw: true,
      },
    ]);
    expect(path.isAbsolute(provider.getGitExecutablePath())).toBe(true);
  });

  it("injects the auth broker environment into remote operations only", async () => {
    const calls = [];
    const authBroker = {
      started: 0,
      ensureStarted() {
        this.started++;
        return Promise.resolve();
      },
      getEnvironment({ workingDirectory }) {
        return {
          env: { GIT_ASKPASS: "/tmp/askpass.sh", LUMINE_GIT_AUTH_WORKDIR: workingDirectory },
        };
      },
    };
    const provider = new GitRepositoryOperationProvider({
      exec: async (args, workingDirectory, options) => {
        calls.push({ command: args[0], options });
        return { exitCode: 0, stdout: "", stderr: "" };
      },
      authBroker,
    });
    const workingDirectory = temp.mkdirSync("git-auth-env");
    const operations = provider.createRepositoryOperations({ workingDirectory });

    await operations.fetch("origin", "main");
    await operations.push("origin", "refs/heads/main");
    await operations.pull("origin", "main");
    await operations.stageFiles(["a.txt"]);

    const envFor = (command) => calls.find((call) => call.command === command).options.env;
    expect(envFor("fetch").GIT_ASKPASS).toBe("/tmp/askpass.sh");
    expect(envFor("fetch").LUMINE_GIT_AUTH_WORKDIR).toBe(workingDirectory);
    expect(envFor("push").GIT_ASKPASS).toBe("/tmp/askpass.sh");
    expect(envFor("pull").GIT_ASKPASS).toBe("/tmp/askpass.sh");
    // A non-remote operation gets no auth environment.
    expect(envFor("add")).toBeUndefined();
    expect(authBroker.started).toBe(3);
  });

  it("injects the GPG signing environment into commit and merge when enabled", async () => {
    const calls = [];
    const authBroker = {
      started: 0,
      ensureStarted() {
        this.started++;
        return Promise.resolve();
      },
      getSigningEnvironment({ workingDirectory }) {
        return {
          env: {
            GIT_ASKPASS: "/tmp/askpass.sh",
            LUMINE_GIT_AUTH_GPG_PROMPT: "1",
            LUMINE_GIT_AUTH_WORKDIR: workingDirectory,
          },
          config: { "gpg.program": "/tmp/gpg-wrapper.sh" },
        };
      },
    };
    const provider = new GitRepositoryOperationProvider({
      exec: async (args, workingDirectory, options) => {
        calls.push({ command: args[0], options });
        return { exitCode: 0, stdout: "", stderr: "" };
      },
      authBroker,
    });
    const workingDirectory = temp.mkdirSync("git-signing-env");
    const operations = provider.createRepositoryOperations({ workingDirectory });

    atom.config.set("git.promptForGpgPassphrase", true);
    try {
      await operations.commit("Subject");
      await operations.merge("topic");
      await operations.stageFiles(["a.txt"]);
    } finally {
      atom.config.set("git.promptForGpgPassphrase", false);
    }

    const optionsFor = (command) => calls.find((call) => call.command === command).options;
    expect(optionsFor("commit").env.LUMINE_GIT_AUTH_GPG_PROMPT).toBe("1");
    expect(optionsFor("commit").env.GIT_ASKPASS).toBe("/tmp/askpass.sh");
    expect(optionsFor("commit").config["gpg.program"]).toBe("/tmp/gpg-wrapper.sh");
    expect(optionsFor("commit").allowPrompt).toBe(true);
    // The commit message still rides on stdin, not in the argument vector.
    expect(optionsFor("commit").stdin).toBe("Subject");
    expect(optionsFor("merge").config["gpg.program"]).toBe("/tmp/gpg-wrapper.sh");
    expect(optionsFor("merge").allowPrompt).toBe(true);
    // A non-signing operation gets no signing environment.
    expect(optionsFor("add").config).toBeUndefined();
    expect(authBroker.started).toBe(2);
  });

  it("leaves commit and merge on the gpg-agent path when the passphrase prompt is disabled", async () => {
    const calls = [];
    const authBroker = {
      ensureStarted() {
        throw new Error("ensureStarted must not run when the passphrase prompt is disabled");
      },
      getSigningEnvironment() {
        throw new Error(
          "getSigningEnvironment must not run when the passphrase prompt is disabled",
        );
      },
    };
    const provider = new GitRepositoryOperationProvider({
      exec: async (args, workingDirectory, options) => {
        calls.push({ command: args[0], options });
        return { exitCode: 0, stdout: "", stderr: "" };
      },
      authBroker,
    });
    const workingDirectory = temp.mkdirSync("git-signing-off");
    const operations = provider.createRepositoryOperations({ workingDirectory });

    atom.config.set("git.promptForGpgPassphrase", false);
    await operations.commit("Subject");
    await operations.merge("topic");

    const optionsFor = (command) => calls.find((call) => call.command === command).options;
    expect(optionsFor("commit").config).toBeUndefined();
    expect(optionsFor("commit").allowPrompt).toBeUndefined();
    expect(optionsFor("merge").config).toBeUndefined();
  });

  it("layers auth and signing environments onto pull", async () => {
    const calls = [];
    const authBroker = {
      ensureStarted() {
        return Promise.resolve();
      },
      getEnvironment({ workingDirectory }) {
        return {
          env: { GIT_ASKPASS: "/tmp/askpass.sh", LUMINE_GIT_AUTH_WORKDIR: workingDirectory },
        };
      },
      getSigningEnvironment() {
        return {
          env: { GIT_ASKPASS: "/tmp/askpass.sh", LUMINE_GIT_AUTH_GPG_PROMPT: "1" },
          config: { "gpg.program": "/tmp/gpg-wrapper.sh" },
        };
      },
    };
    const provider = new GitRepositoryOperationProvider({
      exec: async (args, workingDirectory, options) => {
        calls.push({ command: args[0], options });
        return { exitCode: 0, stdout: "", stderr: "" };
      },
      authBroker,
    });
    const workingDirectory = temp.mkdirSync("git-pull-signing");
    const operations = provider.createRepositoryOperations({ workingDirectory });

    // A pull fetches (needs credentials) and may sign a merge/rebase commit.
    atom.config.set("git.promptForGpgPassphrase", false);
    await operations.pull("origin", "main");
    atom.config.set("git.promptForGpgPassphrase", true);
    try {
      await operations.pull("origin", "main");
    } finally {
      atom.config.set("git.promptForGpgPassphrase", false);
    }

    const [disabled, enabled] = calls;
    // Disabled: the auth environment, but nothing GPG.
    expect(disabled.options.env.GIT_ASKPASS).toBe("/tmp/askpass.sh");
    expect(disabled.options.config).toBeUndefined();
    expect(disabled.options.allowPrompt).toBeUndefined();
    // Enabled: the auth environment plus the signing config.
    expect(enabled.options.env.GIT_ASKPASS).toBe("/tmp/askpass.sh");
    expect(enabled.options.env.LUMINE_GIT_AUTH_GPG_PROMPT).toBe("1");
    expect(enabled.options.config["gpg.program"]).toBe("/tmp/gpg-wrapper.sh");
    expect(enabled.options.allowPrompt).toBe(true);
  });

  it("maps repository operations to Git commands without placing commit messages in arguments", async () => {
    const calls = [];
    const provider = new GitRepositoryOperationProvider({
      exec: async (args, workingDirectory, options) => {
        calls.push({ args, workingDirectory, options });
        return { exitCode: 0, stdout: "", stderr: "" };
      },
    });
    const workingDirectory = path.join(temp.mkdirSync("git-command-mapping"), "repo");
    const operations = provider.createRepositoryOperations({ workingDirectory });

    await operations.stageFiles(["one.txt", "two.txt"]);
    await operations.commit("Subject", {
      amend: true,
      coAuthors: [{ name: "Example User", email: "user@example.com" }],
    });

    // The worker receives the bare argument vector; color/trust config and the
    // GIT_TERMINAL_PROMPT environment are applied by the worker's GitRunner.
    expect(calls[0].args).toEqual(["add", "--", "one.txt", "two.txt"]);
    expect(calls[0].workingDirectory).toBe(workingDirectory);
    expect(calls[1].args).toEqual(["commit", "--file=-", "--amend"]);
    expect(calls[1].options.stdin).toBe(
      "Subject\n\nCo-authored-by: Example User <user@example.com>",
    );
  });

  it("supports injected configuration, cleanup modes, and merge-file labels", async () => {
    const calls = [];
    const provider = new GitRepositoryOperationProvider({
      exec: async (args, workingDirectory, options) => {
        calls.push({ args, workingDirectory, options });
        if (args.includes("merge-file")) {
          return { exitCode: 1, stdout: "<<<<<<< current\n", stderr: "" };
        }
        return { exitCode: 0, stdout: "", stderr: "" };
      },
    });
    const workingDirectory = temp.mkdirSync("git-option-mapping");
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

    // The per-command `-c` config is passed through in options and applied by the
    // worker's GitRunner, not baked into the argument vector here.
    expect(calls[0].args).toEqual(["commit", "--file=-", "--cleanup=strip"]);
    expect(calls[0].options.config).toEqual({ "gpg.program": "/tmp/wrapper.sh" });
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
    const provider = new GitRepositoryOperationProvider();
    const workingDirectory = temp.mkdirSync("git-conflict-index");
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
    const provider = new GitRepositoryOperationProvider();
    const workingDirectory = temp.mkdirSync("git-real-repository");

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
    const provider = new GitRepositoryOperationProvider();
    const sourcePath = temp.mkdirSync("git-clone-source");
    const destinationPath = path.join(temp.mkdirSync("git-clone-parent"), "destination");

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
    const provider = new GitRepositoryOperationProvider();
    const workingDirectory = temp.mkdirSync("git-error-repository");
    await provider.initializeRepository(workingDirectory);

    let error;
    try {
      await provider.run(["checkout", "missing-reference"], workingDirectory);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error.name).toBe("GitOperationError");
    expect(error.code).toBe("ERR_GIT_COMMAND_FAILED");
    expect(error.command).toBe("checkout");
    expect(error.exitCode).not.toBe(0);
    expect(error.stderr.length).toBeGreaterThan(0);
  });

  it("drives the public repository API with Git writes and git-utils reads", async () => {
    const workingDirectory = temp.mkdirSync("git-public-repository-api");
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
