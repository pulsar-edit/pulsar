const net = require("net");
const os = require("os");
const path = require("path");
const fs = require("fs/promises");
const { Emitter } = require("event-kit");

// The auth broker gives the system git that runs in the git-host worker a way to
// prompt the user for credentials and SSH/GPG passphrases from the editor GUI —
// the piece system git cannot supply itself because it would prompt on a tty.
//
// It is deliberately forge-agnostic and askpass-only, exactly like VS Code:
// because Lumine runs the user's system git, git's own credential helpers (Git
// Credential Manager, osxkeychain, libsecret, cache, ssh-agent) already run and
// remain the source of truth for storage and retrieval. This broker adds no
// credential helper and no editor-owned store — it only installs GIT_ASKPASS /
// SSH_ASKPASS, which git falls back to for SSH passphrases and for HTTPS
// username/password when no helper provides them, and a GPG passphrase wrapper.
//
// The helper script (a short-lived process spawned by git in the worker's
// subtree) connects back to a local socket owned here in the renderer and
// exchanges a JSON prompt for a JSON answer that a dialog produced.

const SCRIPT_DIRECTORY = __dirname;
const HELPER_SCRIPTS = ["askpass.js", "askpass.sh", "ssh-wrapper.sh", "gpg-wrapper.sh"];

// Git's bundled sh on Windows (MSYS) wants forward slashes in the paths it
// receives through the environment.
function toHelperPath(candidate) {
  return process.platform === "win32" ? String(candidate).replace(/\\/g, "/") : String(candidate);
}

class GitAuthBroker {
  constructor({ promptForInput } = {}) {
    this.promptForInput =
      promptForInput || (() => Promise.reject(new Error("No credential prompt handler is set")));
    this.emitter = new Emitter();
    this.startPromise = null;
    this.tempDirectory = null;
    this.server = null;
    this.address = null;
  }

  setPromptHandler(promptForInput) {
    this.promptForInput = promptForInput;
  }

  onDidCancel(callback) {
    return this.emitter.on("did-cancel", callback);
  }

  // Start (once) the helper temp directory and the prompt socket.
  ensureStarted() {
    if (!this.startPromise) {
      this.startPromise = this.start().catch((error) => {
        this.startPromise = null;
        throw error;
      });
    }
    return this.startPromise;
  }

  async start() {
    this.tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "lumine-git-auth-"));
    await Promise.all(
      HELPER_SCRIPTS.map(async (name) => {
        const destination = path.join(this.tempDirectory, name);
        await fs.copyFile(path.join(SCRIPT_DIRECTORY, name), destination);
        if (name.endsWith(".sh")) await fs.chmod(destination, 0o700);
      }),
    );
    this.server = await this.listen();
  }

  socketOptions() {
    if (process.platform === "win32") {
      return { port: 0, host: "127.0.0.1" };
    }
    return { path: path.join(this.tempDirectory, "auth.sock") };
  }

  listen() {
    return new Promise((resolve) => {
      const server = net.createServer({ allowHalfOpen: true }, (connection) => {
        connection.setEncoding("utf8");
        let payload = "";
        connection.on("data", (chunk) => {
          payload += chunk;
        });
        connection.on("end", () => this.handleConnection(connection, payload));
        connection.on("error", () => {});
      });
      server.listen(this.socketOptions(), () => {
        this.address = server.address();
        resolve(server);
      });
    });
  }

  async handleConnection(connection, payload) {
    let query;
    try {
      query = JSON.parse(payload);
      const answer = await this.promptForInput(query);
      await new Promise((resolve) => connection.end(JSON.stringify(answer), "utf8", resolve));
    } catch {
      connection.destroy();
      this.emitter.emit("did-cancel", query && query.pid ? { handlerPid: query.pid } : undefined);
    }
  }

  // The address the helper scripts connect to, encoded the way they parse it:
  // `tcp:<port>` on Windows, `unix:<path>` elsewhere.
  getAddress() {
    if (!this.address) throw new Error("Auth broker is not listening");
    if (this.address.port) return `tcp:${this.address.port}`;
    return `unix:${toHelperPath(this.address)}`;
  }

  scriptPath(name) {
    return toHelperPath(path.join(this.tempDirectory, name));
  }

  // The environment that routes a git subprocess's askpass prompts to this
  // broker. Merged into the operation's options so it reaches the worker's git
  // child; harmless for commands that never prompt.
  getEnvironment({ workingDirectory, electronPath = process.execPath }) {
    const env = {
      LUMINE_GIT_AUTH_SOCK: this.getAddress(),
      LUMINE_GIT_AUTH_ELECTRON: toHelperPath(electronPath),
      LUMINE_GIT_AUTH_ASKPASS_JS: this.scriptPath("askpass.js"),
      LUMINE_GIT_AUTH_WORKDIR: workingDirectory || "",
      LUMINE_GIT_AUTH_ORIGINAL_ASKPASS: process.env.GIT_ASKPASS || process.env.SSH_ASKPASS || "",
      GIT_ASKPASS: this.scriptPath("askpass.sh"),
      SSH_ASKPASS: this.scriptPath("askpass.sh"),
    };

    if (process.platform === "linux") {
      env.LUMINE_GIT_AUTH_ORIGINAL_SSH_COMMAND = process.env.GIT_SSH_COMMAND || "";
      env.GIT_SSH_COMMAND = this.scriptPath("ssh-wrapper.sh");
    }
    // ssh only honors SSH_ASKPASS when it has no controlling tty and DISPLAY is
    // set; macOS launches with DISPLAY unset.
    if (!process.env.DISPLAY || process.env.DISPLAY.length === 0) {
      env.DISPLAY = "lumine-git-auth";
    }

    return { env };
  }

  // The git config that routes GPG signing passphrase prompts here (used only
  // for signed commit/merge operations).
  getGpgConfig() {
    return { "gpg.program": this.scriptPath("gpg-wrapper.sh") };
  }

  async terminate() {
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
    }
    if (this.tempDirectory) {
      await fs.rm(this.tempDirectory, { recursive: true, force: true });
    }
    this.server = null;
    this.tempDirectory = null;
    this.address = null;
    this.startPromise = null;
    this.emitter.dispose();
  }
}

module.exports = GitAuthBroker;
