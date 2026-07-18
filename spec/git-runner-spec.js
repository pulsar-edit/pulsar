const GitRunner = require("../src/git-runner");
const { Semaphore } = GitRunner;

// Flush enough microtask turns for the semaphore's async acquire() handoffs to
// settle before asserting on in-flight state.
async function flush() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

// Records how many fake `git` executions are running at once and hands back a
// resolver per call so the test can drain them one at a time.
function trackingExecute() {
  const state = { active: 0, peak: 0, resolvers: [] };
  const execute = () =>
    new Promise((resolve) => {
      state.active++;
      state.peak = Math.max(state.peak, state.active);
      state.resolvers.push(() => {
        state.active--;
        resolve({ exitCode: 0, stdout: "", stderr: "" });
      });
    });
  return { execute, state };
}

describe("GitRunner concurrency", () => {
  it("never runs more concurrent executions than the limiter allows", async () => {
    const { execute, state } = trackingExecute();
    const runner = new GitRunner({ execute, limiter: new Semaphore(2) });

    const all = Promise.all(Array.from({ length: 6 }, () => runner.run(["status"], "/repo")));

    await flush();
    expect(state.active).toBe(2);
    expect(state.peak).toBe(2);

    // Drain one execution at a time; each freed slot admits exactly one queued
    // execution, so the active count must never exceed the cap.
    for (let i = 0; i < 6; i++) {
      expect(state.active).toBeLessThanOrEqual(2);
      if (state.resolvers.length) state.resolvers.shift()();
      await flush();
    }

    await all;
    expect(state.peak).toBe(2);
  });

  it("bypasses the limiter for interactive (allowPrompt) operations", async () => {
    const { execute, state } = trackingExecute();
    const runner = new GitRunner({ execute, limiter: new Semaphore(2) });

    const all = Promise.all(
      Array.from({ length: 5 }, () => runner.run(["fetch"], "/repo", { allowPrompt: true })),
    );

    await flush();
    // All five run at once despite the cap of 2, because a hung credential
    // prompt must not starve the shared read budget.
    expect(state.peak).toBe(5);

    state.resolvers.forEach((release) => release());
    await all;
  });
});

describe("GitRunner repository trust", () => {
  function capturingExecute() {
    const calls = [];
    const execute = (args) => {
      calls.push(args);
      return Promise.resolve({ exitCode: 0, stdout: "", stderr: "" });
    };
    return { execute, calls };
  }

  it("adds -c safe.directory=* when trustAllRepositories is set", async () => {
    const { execute, calls } = capturingExecute();
    const runner = new GitRunner({ execute, trustAllRepositories: true });

    await runner.run(["status"], "/repo");

    const args = calls[0];
    const index = args.indexOf("safe.directory=*");
    expect(index).toBeGreaterThan(-1);
    expect(args[index - 1]).toBe("-c");
    // The bypass precedes the git subcommand.
    expect(index).toBeLessThan(args.indexOf("status"));
  });

  it("does not add safe.directory when trustAllRepositories is not set", async () => {
    const { execute, calls } = capturingExecute();
    const runner = new GitRunner({ execute });

    await runner.run(["status"], "/repo");

    expect(calls[0]).not.toContain("safe.directory=*");
  });
});
