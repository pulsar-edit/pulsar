const { exec, parseError } = require("dugite");

// Bound the number of concurrent `git` child processes across the whole
// renderer. Opening a project with many repositories otherwise fires a burst of
// status/refs refreshes — the refs provider alone spawns five `git` processes
// per repository — flooding the OS with dozens of simultaneous spawns at
// startup. A shared FIFO semaphore flattens that burst into a bounded pipeline
// without changing any provider's observable behavior.
const DEFAULT_MAX_CONCURRENT_GIT = 6;

class Semaphore {
  constructor(max) {
    this.max = max;
    this.active = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.active < this.max) {
      this.active++;
      return;
    }
    await new Promise((resolve) => this.queue.push(resolve));
  }

  release() {
    const next = this.queue.shift();
    if (next) {
      // Hand the freed slot directly to the next waiter without dropping the
      // active count, so a synchronous acquire() cannot slip in and exceed max.
      next();
    } else {
      this.active--;
    }
  }

  async run(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// Process-wide limiter shared by every DugiteRunner instance.
const sharedGitLimiter = new Semaphore(DEFAULT_MAX_CONCURRENT_GIT);

const COLOR_CONFIG = [
  "-c",
  "color.branch=false",
  "-c",
  "color.diff=false",
  "-c",
  "color.status=false",
  "-c",
  "color.ui=false",
];

class DugiteOperationError extends Error {
  constructor(command, result) {
    const stderr = String(result.stderr);
    const stdout = String(result.stdout);
    const detail = stderr.trim() || stdout.trim() || `exit code ${result.exitCode}`;
    super(`Git ${command} failed: ${detail}`);
    this.name = "DugiteOperationError";
    this.code = "ERR_GIT_COMMAND_FAILED";
    this.command = command;
    this.exitCode = result.exitCode;
    this.stdout = result.stdout;
    this.stderr = result.stderr;
    this.gitError = parseError(stderr);
  }
}

class DugiteRunner {
  constructor({ execute = exec, limiter = sharedGitLimiter } = {}) {
    this.execute = execute;
    this.limiter = limiter;
  }

  async run(args, workingDirectory, options = {}) {
    const result = await this.runResult(args, workingDirectory, options);
    return result.stdout;
  }

  async runResult(args, workingDirectory, options = {}) {
    const environment = {
      GIT_TERMINAL_PROMPT: options.allowPrompt ? "1" : "0",
      GIT_EDITOR: "true",
      LC_ALL: "C",
      ...options.env,
    };
    const configArguments = [];
    for (const [key, value] of Object.entries(options.config || {})) {
      configArguments.push("-c", `${key}=${value}`);
    }
    const runExec = () =>
      this.execute([...COLOR_CONFIG, ...configArguments, ...args], workingDirectory, {
        env: environment,
        stdin: options.stdin,
        encoding: options.encoding,
        maxBuffer: options.maxBuffer,
        signal: options.signal,
        killSignal: options.killSignal,
        processCallback: options.processCallback,
      });
    // Interactive/credential operations may block for a long time; keep them out
    // of the shared read budget so a hung prompt cannot starve status refreshes.
    const result = options.allowPrompt ? await runExec() : await this.limiter.run(runExec);
    const allowedExitCodes = options.allowedExitCodes || [0];
    if (!allowedExitCodes.includes(result.exitCode)) {
      throw new DugiteOperationError(args[0], result);
    }
    return result;
  }
}

module.exports = DugiteRunner;
module.exports.DugiteOperationError = DugiteOperationError;
module.exports.Semaphore = Semaphore;
module.exports.sharedGitLimiter = sharedGitLimiter;
module.exports.DEFAULT_MAX_CONCURRENT_GIT = DEFAULT_MAX_CONCURRENT_GIT;
