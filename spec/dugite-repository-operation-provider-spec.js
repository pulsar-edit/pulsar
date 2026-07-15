const fs = require("fs");
const path = require("path");

const temp = require("temp").track();

const DugiteRepositoryOperationProvider = require("../src/dugite-repository-operation-provider");

const COLOR_CONFIG_ARGUMENT_COUNT = 8;

describe("DugiteRepositoryOperationProvider", () => {
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
      await repository.getOperations().stageFiles(["public-api.txt"]);
      await repository.getOperations().commit("Public API commit");

      expect(repository.getShortHead()).toBe("main");
      expect(repository.isPathModified("public-api.txt")).toBe(false);
    } finally {
      atom.repositories.forget(repository);
    }
  });
});
