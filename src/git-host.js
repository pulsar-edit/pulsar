const ChildProcess = require("child_process");

// Renderer-side transport for the git-host worker: one long-lived forked process
// per window that runs every Git `git` command and its output off the
// renderer main thread, VS Code-extension-host style. Requests are correlated by
// id to their replies; an AbortSignal is translated into an out-of-band cancel;
// a worker crash rejects all pending requests with a retriable error and the
// next request lazily re-forks.
//
// Modeled on the WorkerProcessWatcher pattern in path-watcher.js, improved with
// crash-restart and true cancellation.

function abortError() {
  const error = new Error("The git operation was aborted");
  error.name = "AbortError";
  error.code = "ABORT_ERR";
  return error;
}

function restartError() {
  const error = new Error("git-host worker exited before the request completed");
  error.code = "ERR_GIT_HOST_RESTART";
  error.retriable = true;
  return error;
}

// Rebuild a real Error from the fields the worker serialized, preserving the
// `code`/`exitCode`/`stderr` that callers branch on (e.g. GitRepository.getDiff
// maps ERR_CHILD_PROCESS_STDIO_MAXBUFFER -> ERR_GIT_DIFF_TOO_LARGE).
function reviveError(serialized) {
  const error = new Error(serialized.message);
  if (serialized.name) error.name = serialized.name;
  if (serialized.code !== undefined) error.code = serialized.code;
  if (serialized.exitCode !== undefined) error.exitCode = serialized.exitCode;
  if (serialized.stderr !== undefined) error.stderr = serialized.stderr;
  if (serialized.stdout !== undefined) error.stdout = serialized.stdout;
  if (serialized.command !== undefined) error.command = serialized.command;
  if (serialized.gitError !== undefined) error.gitError = serialized.gitError;
  return error;
}

let singleton = null;

// null = auto (fork in production, run in-process under specs so package tests
// do not spawn a worker per test); true/false force the mode. The dedicated
// git-host transport specs set this to true to exercise the forked path.
let forkModeOverride = null;

// Test seam: replaces ChildProcess.fork so the transport (correlation, crash,
// cancel) can be driven deterministically with a fake child.
let childFactoryOverride = null;

class GitHost {
  // Per-window singleton. Consumers (the git-host client providers) always go
  // through here so every repository shares one worker.
  static instance() {
    if (!singleton) singleton = new GitHost();
    return singleton;
  }

  // Tear down and drop the singleton. Used on window unload and by specs.
  static reset() {
    if (singleton) {
      singleton.terminate();
      singleton = null;
    }
  }

  // Test hook: force forking (true) or in-process execution (false); null
  // restores automatic selection.
  static setForkModeForTesting(mode) {
    forkModeOverride = mode;
  }

  // Test hook: inject a fake child factory `(bootstrapPath, argv, options) =>
  // child`; null restores ChildProcess.fork.
  static setChildFactoryForTesting(factory) {
    childFactoryOverride = factory;
  }

  constructor() {
    this.child = null;
    this.readyPromise = null;
    this.resolveReady = null;
    this.rejectReady = null;
    this.pending = new Map(); // id -> { resolve, reject, signal, onAbort }
    this.nextId = 0;
    this.inProcessOps = null; // op table when running without a forked worker
  }

  shouldFork() {
    if (forkModeOverride !== null) return forkModeOverride;
    // Run in-process under the spec harness; fork in a real window.
    return !globalThis.atom?.inSpecMode?.();
  }

  // Whether to trust repositories owned by another user account
  // (`git.trustAllRepositories`, default true). Passed to the worker via
  // its fork environment and used directly by the in-process runner.
  trustAllRepositories() {
    const value = globalThis.atom?.config?.get?.("git.trustAllRepositories");
    return value !== false;
  }

  // The configured git binary path (`git.path`), passed to the worker so
  // its runner resolves the same git the renderer would.
  gitPath() {
    return globalThis.atom?.config?.get?.("git.path") || "";
  }

  childEnv() {
    const compileCachePath = require("./compile-cache").getCacheDirectory();
    return Object.assign({}, process.env, {
      ELECTRON_RUN_AS_NODE: "1",
      ELECTRON_NO_ATTACH_CONSOLE: "1",
      LUMINE_COMPILE_CACHE_PATH: compileCachePath,
      LUMINE_GIT_TRUST_ALL: this.trustAllRepositories() ? "1" : "0",
      LUMINE_GIT_PATH: this.gitPath(),
    });
  }

  ensureStarted() {
    if (this.readyPromise) return this.readyPromise;

    if (!this.shouldFork()) {
      const GitRunner = require("./git-runner");
      const createGitHostOps = require("./git-host-ops");
      this.inProcessOps = createGitHostOps(
        new GitRunner({ trustAllRepositories: this.trustAllRepositories() }),
      );
      this.readyPromise = Promise.resolve();
      return this.readyPromise;
    }

    this.readyPromise = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;

      const fork = childFactoryOverride || ((p, argv, opts) => ChildProcess.fork(p, argv, opts));
      const child = fork(require.resolve("./git-host-bootstrap"), ["--no-deprecation"], {
        env: this.childEnv(),
        silent: true,
        windowsHide: true,
        serialization: "advanced",
      });
      this.child = child;

      child.on("message", (message) => this.handleMessage(message));
      child.on("exit", () => this.handleExit());
      child.on("error", () => this.handleExit());
      child.stdout?.on("data", (data) => console.log(String(data)));
      child.stderr?.on("data", (data) => console.error(String(data)));
    });

    return this.readyPromise;
  }

  handleMessage(message) {
    if (!message) return;
    switch (message.event) {
      case "git:ready":
        this.resolveReady?.();
        this.resolveReady = null;
        this.rejectReady = null;
        return;
      case "git:reply": {
        const entry = this.pending.get(message.id);
        if (!entry) return;
        this.pending.delete(message.id);
        this.detachAbort(entry);
        if (message.error) entry.reject(reviveError(message.error));
        else entry.resolve(message.result);
        return;
      }
      case "console:log":
        console.log(...(message.args || []));
        return;
      case "console:warn":
        console.warn(...(message.args || []));
        return;
      case "console:error":
        console.error(...(message.args || []));
        return;
    }
  }

  handleExit() {
    // Reject a start that never reached readiness, then fail every pending
    // request with a retriable error and drop state so the next request forks a
    // fresh worker. Background refreshes already swallow rejections.
    this.rejectReady?.(restartError());
    this.resolveReady = null;
    this.rejectReady = null;

    for (const entry of this.pending.values()) {
      this.detachAbort(entry);
      entry.reject(restartError());
    }
    this.pending.clear();

    if (this.child) {
      this.child.removeAllListeners();
      this.child = null;
    }
    this.readyPromise = null;
  }

  detachAbort(entry) {
    if (entry.signal && entry.onAbort) {
      entry.signal.removeEventListener("abort", entry.onAbort);
    }
  }

  async request(op, payload, { signal } = {}) {
    if (signal?.aborted) throw abortError();
    if (globalThis.window?.atom?.unloading) throw restartError();

    await this.ensureStarted();

    // In-process mode (spec harness): run the op directly, translating the
    // caller's AbortSignal to a local controller so cancellation still works.
    if (this.inProcessOps) {
      const run = this.inProcessOps[op];
      if (!run) {
        const error = new Error(`Unknown git-host op: ${op}`);
        error.code = "ERR_GIT_HOST_UNKNOWN_OP";
        throw error;
      }
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      if (signal) signal.addEventListener("abort", onAbort, { once: true });
      try {
        return await run(payload, { signal: controller.signal });
      } finally {
        if (signal) signal.removeEventListener("abort", onAbort);
      }
    }

    // A crash during startup nulls the child; surface it as retriable.
    if (!this.child) throw restartError();

    const id = String(this.nextId++);
    return new Promise((resolve, reject) => {
      const entry = { resolve, reject, signal, onAbort: null };
      if (signal) {
        entry.onAbort = () => {
          if (!this.pending.has(id)) return;
          this.pending.delete(id);
          this.sendCancel(id);
          reject(abortError());
        };
        signal.addEventListener("abort", entry.onAbort, { once: true });
      }
      this.pending.set(id, entry);
      this.child.send({ event: "git:request", id, op, payload });
    });
  }

  sendCancel(id) {
    this.child?.send({ event: "git:cancel", id });
  }

  terminate() {
    for (const entry of this.pending.values()) {
      this.detachAbort(entry);
      entry.reject(restartError());
    }
    this.pending.clear();

    if (this.child) {
      this.child.removeAllListeners();
      this.child.stdout?.removeAllListeners();
      this.child.stderr?.removeAllListeners();
      this.child.kill();
      this.child = null;
    }
    this.readyPromise = null;
    this.resolveReady = null;
    this.rejectReady = null;
    this.inProcessOps = null;
  }
}

module.exports = GitHost;
