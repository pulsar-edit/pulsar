// Invoked by git through GIT_ASKPASS / SSH_ASKPASS when it needs a password or
// passphrase (typically an SSH key passphrase). Tries the user's own askpass
// program first, then falls back to a dialog requested over the broker socket.
//
// Run as `<electron> --ELECTRON_RUN_AS_NODE askpass.js <sockAddr> <prompt>`.

const net = require("net");
const { execFile } = require("child_process");

const sockAddr = process.argv[2];
const prompt = process.argv[3];

const diagnostics = Boolean(process.env.GIT_TRACE && process.env.GIT_TRACE.length !== 0);
const userAskpass = process.env.LUMINE_GIT_AUTH_ORIGINAL_ASKPASS || "";
const workdir = process.env.LUMINE_GIT_AUTH_WORKDIR || undefined;

function log(message) {
  if (diagnostics) process.stderr.write(`lumine-askpass: ${message}\n`);
}

function socketOptions() {
  const common = { allowHalfOpen: true };
  const tcp = /tcp:(\d+)/.exec(sockAddr);
  if (tcp) {
    const port = parseInt(tcp[1], 10);
    if (Number.isNaN(port)) throw new Error(`Non-integer TCP port: ${tcp[1]}`);
    return { port, host: "127.0.0.1", ...common };
  }
  const unix = /unix:(.+)/.exec(sockAddr);
  if (unix) return { path: unix[1], ...common };
  throw new Error(`Malformed auth socket address: ${sockAddr}`);
}

// Delegate to the user's configured askpass, if any (e.g. an OS keyring askpass).
function fromUserAskpass() {
  return new Promise((resolve, reject) => {
    if (userAskpass.length === 0) {
      reject(new Error("No user askpass"));
      return;
    }
    log(`trying user askpass: ${userAskpass}`);
    execFile("sh", ["-c", `'${userAskpass}' '${prompt}'`], { cwd: workdir }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function fromDialog() {
  const query = { kind: "askpass", prompt, includeUsername: false, pid: process.pid };
  return new Promise((resolve, reject) => {
    const socket = net.connect(socketOptions(), () => {
      let payload = "";
      socket.on("data", (chunk) => {
        payload += chunk;
      });
      socket.on("end", () => {
        try {
          resolve(JSON.parse(payload).password);
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

fromUserAskpass()
  .catch(() => fromDialog())
  .then(
    (password) => {
      process.stdout.write(password || "");
      process.exit(0);
    },
    (error) => {
      log(`failure: ${error.stack || error}`);
      process.exit(1);
    },
  );
