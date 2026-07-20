const net = require("net");
const fs = require("fs");

const GitAuthBroker = require("../src/git-auth-broker");

// Connect to the broker's prompt socket the way a helper script does, send a
// JSON query, and resolve with the JSON reply (or reject if the socket closes
// without one).
function requestPrompt(broker, query) {
  const address = broker.getAddress();
  const tcp = /^tcp:(\d+)$/.exec(address);
  const options = tcp
    ? { port: Number(tcp[1]), host: "127.0.0.1", allowHalfOpen: true }
    : { path: /^unix:(.+)$/.exec(address)[1], allowHalfOpen: true };

  return new Promise((resolve, reject) => {
    const socket = net.connect(options, () => {
      let payload = "";
      socket.on("data", (chunk) => {
        payload += chunk;
      });
      socket.on("end", () => {
        try {
          resolve(JSON.parse(payload));
        } catch (error) {
          reject(error);
        }
      });
      socket.end(JSON.stringify(query), "utf8");
    });
    socket.setEncoding("utf8");
    socket.on("error", reject);
  });
}

describe("GitAuthBroker", () => {
  let broker;

  afterEach(async () => {
    if (broker) {
      await broker.terminate();
      broker = null;
    }
  });

  it("materializes askpass-only helper scripts and env, with no credential helper", async () => {
    broker = new GitAuthBroker();
    await broker.ensureStarted();

    for (const name of ["askpass.js", "askpass.sh", "ssh-wrapper.sh", "gpg-wrapper.sh"]) {
      expect(fs.existsSync(require("path").join(broker.tempDirectory, name))).toBe(true);
    }

    const { env, config } = broker.getEnvironment({ workingDirectory: "/repo" });
    expect(env.GIT_ASKPASS).toMatch(/askpass\.sh$/);
    expect(env.SSH_ASKPASS).toBe(env.GIT_ASKPASS);
    expect(env.LUMINE_GIT_AUTH_SOCK).toBe(broker.getAddress());
    // Storage is delegated to git's own helpers: the broker adds none.
    expect(config).toBeUndefined();
    expect(broker.getGpgConfig()["gpg.program"]).toMatch(/gpg-wrapper\.sh$/);
  });

  it("composes a signing environment that routes the passphrase through askpass", async () => {
    broker = new GitAuthBroker();
    await broker.ensureStarted();

    const { env, config } = broker.getSigningEnvironment({ workingDirectory: "/repo" });
    // The wrapper collects the passphrase with GIT_ASKPASS, so the askpass
    // environment must ride along with the gpg.program override.
    expect(env.GIT_ASKPASS).toMatch(/askpass\.sh$/);
    expect(env.LUMINE_GIT_AUTH_GPG_PROMPT).toBe("1");
    expect(config["gpg.program"]).toMatch(/gpg-wrapper\.sh$/);
  });

  it("answers a prompt with the value the handler produces", async () => {
    const prompts = [];
    broker = new GitAuthBroker({
      promptForInput: async (query) => {
        prompts.push(query);
        return { password: "hunter2" };
      },
    });
    await broker.ensureStarted();

    const reply = await requestPrompt(broker, { kind: "askpass", prompt: "Password:", pid: 123 });
    expect(reply.password).toBe("hunter2");
    expect(prompts.length).toBe(1);
    expect(prompts[0].prompt).toBe("Password:");
  });

  it("emits did-cancel with the helper pid when the handler rejects", async () => {
    broker = new GitAuthBroker({ promptForInput: () => Promise.reject(new Error("cancelled")) });
    await broker.ensureStarted();

    const cancelled = new Promise((resolve) => broker.onDidCancel((info) => resolve(info)));
    requestPrompt(broker, { prompt: "x", pid: 77 }).catch(() => {});

    expect((await cancelled).handlerPid).toBe(77);
  });

  it("removes the helper directory on terminate", async () => {
    broker = new GitAuthBroker();
    await broker.ensureStarted();
    const directory = broker.tempDirectory;
    expect(fs.existsSync(directory)).toBe(true);

    await broker.terminate();
    expect(fs.existsSync(directory)).toBe(false);
    broker = null;
  });
});
