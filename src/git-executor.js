const { spawn } = require("child_process");

// Runs the system git binary via child_process for GitRunner. The exec contract
// keeps the rest of the git stack unchanged: `exec(args, workingDirectory,
// options)` resolves to `{exitCode, stdout, stderr}` and rejects with an
// `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`-coded error when stdout exceeds `maxBuffer`
// (GitRepository.getDiff maps that to ERR_GIT_DIFF_TOO_LARGE). Supported options:
// env, stdin, encoding ("buffer" for a Buffer stdout), maxBuffer, signal,
// killSignal, processCallback.

const MAX_BUFFER_EXCEEDED_CODE = "ERR_CHILD_PROCESS_STDIO_MAXBUFFER";
const DEFAULT_MAX_BUFFER = 10 * 1024 * 1024;

function createGitExec(gitPath) {
  return function exec(args, workingDirectory, options = {}) {
    return new Promise((resolve, reject) => {
      const encoding = options.encoding === "buffer" ? "buffer" : "utf8";
      const maxBuffer = options.maxBuffer ?? DEFAULT_MAX_BUFFER;
      const killSignal = options.killSignal || "SIGTERM";

      let child;
      try {
        child = spawn(gitPath, args, {
          cwd: workingDirectory,
          env: options.env ? { ...process.env, ...options.env } : process.env,
          windowsHide: true,
        });
      } catch (error) {
        reject(error);
        return;
      }

      let settled = false;
      const stdoutChunks = [];
      const stderrChunks = [];
      let stdoutLength = 0;
      let maxBufferExceeded = false;

      const onAbort = () => child.kill(killSignal);
      if (options.signal) {
        if (options.signal.aborted) child.kill(killSignal);
        else options.signal.addEventListener("abort", onAbort, { once: true });
      }
      const cleanup = () => {
        if (options.signal) options.signal.removeEventListener("abort", onAbort);
      };

      if (typeof options.processCallback === "function") options.processCallback(child);

      child.stdout.on("data", (chunk) => {
        stdoutLength += chunk.length;
        if (stdoutLength > maxBuffer) {
          maxBufferExceeded = true;
          child.kill(killSignal);
          return;
        }
        stdoutChunks.push(chunk);
      });
      child.stderr.on("data", (chunk) => stderrChunks.push(chunk));

      child.on("error", (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      });

      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (maxBufferExceeded) {
          const error = new Error(`git output exceeded the maxBuffer of ${maxBuffer} bytes`);
          error.code = MAX_BUFFER_EXCEEDED_CODE;
          reject(error);
          return;
        }
        const stdoutBuffer = Buffer.concat(stdoutChunks);
        resolve({
          exitCode: code == null ? 1 : code,
          stdout: encoding === "buffer" ? stdoutBuffer : stdoutBuffer.toString("utf8"),
          stderr: Buffer.concat(stderrChunks).toString("utf8"),
        });
      });

      // Feed stdin (commit messages, patches, `update-index --index-info`) then
      // close it. Ignore EPIPE if git exits before reading all of it.
      if (child.stdin) {
        child.stdin.on("error", () => {});
        child.stdin.end(options.stdin != null ? options.stdin : undefined);
      }
    });
  };
}

module.exports = { createGitExec, DEFAULT_MAX_BUFFER };
