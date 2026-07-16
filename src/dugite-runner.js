const { exec, parseError } = require("dugite");

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
  constructor({ execute = exec } = {}) {
    this.execute = execute;
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
    const result = await this.execute([...COLOR_CONFIG, ...args], workingDirectory, {
      env: environment,
      stdin: options.stdin,
      encoding: options.encoding,
      maxBuffer: options.maxBuffer,
      signal: options.signal,
      killSignal: options.killSignal,
      processCallback: options.processCallback,
    });
    const allowedExitCodes = options.allowedExitCodes || [0];
    if (!allowedExitCodes.includes(result.exitCode)) {
      throw new DugiteOperationError(args[0], result);
    }
    return result;
  }
}

module.exports = DugiteRunner;
module.exports.DugiteOperationError = DugiteOperationError;
