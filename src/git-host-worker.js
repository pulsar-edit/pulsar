// The git-host worker's child-process entry logic. Runs under
// ELECTRON_RUN_AS_NODE (loaded by git-host-bootstrap.js). Owns a single shared
// DugiteRunner (whose concurrency limiter bounds the real `git` spawns here, off
// the renderer thread) and an op dispatch table. Every request is tracked by id
// so an out-of-band `git:cancel` can abort the matching in-flight git child.

const DugiteRunner = require("./dugite-runner");
const createGitHostOps = require("./git-host-ops");

// core.git.trustAllRepositories is passed in the fork environment; trust unless
// it was explicitly disabled ("0").
const runner = new DugiteRunner({ trustAllRepositories: process.env.LUMINE_GIT_TRUST_ALL !== "0" });
const ops = createGitHostOps(runner);

// id -> AbortController for the in-flight request, so git:cancel can abort it.
const inflight = new Map();

function serializeError(error) {
  if (!error) return { message: "Unknown git-host error" };
  return {
    message: error.message ?? String(error),
    name: error.name,
    code: error.code,
    exitCode: error.exitCode,
    stderr: error.stderr != null ? String(error.stderr) : undefined,
    stdout: error.stdout != null ? String(error.stdout) : undefined,
    command: error.command,
    gitError: error.gitError,
  };
}

function reply(id, result) {
  process.send({ event: "git:reply", id, result });
}

function replyError(id, error) {
  process.send({ event: "git:reply", id, error: serializeError(error) });
}

async function handleRequest({ id, op, payload }) {
  const run = ops[op];
  if (!run) {
    const error = new Error(`Unknown git-host op: ${op}`);
    error.code = "ERR_GIT_HOST_UNKNOWN_OP";
    replyError(id, error);
    return;
  }

  const controller = new AbortController();
  inflight.set(id, controller);
  try {
    const result = await run(payload, { signal: controller.signal });
    reply(id, result);
  } catch (error) {
    replyError(id, error);
  } finally {
    inflight.delete(id);
  }
}

process.on("message", (message) => {
  if (!message) return;
  if (message.event === "git:request") {
    handleRequest(message);
  } else if (message.event === "git:cancel") {
    inflight.get(message.id)?.abort();
  }
});

// Exit cleanly when the renderer goes away so no orphan worker lingers.
process.on("disconnect", () => process.exit(0));

// Signal readiness after the message handler is installed.
process.send({ event: "git:ready" });
