const { userAgent } = process.env;
const taskPath = process.argv.at(-1);
const compileCachePath = process.env.PULSAR_COMPILE_CACHE_PATH;

const CompileCache = require('./compile-cache');
CompileCache.setCacheDirectory(compileCachePath);
CompileCache.install(`${process.resourcesPath}`, require);

function setupGlobals() {
  global.attachEvent = () => {};

  const console = {
    warn(...args) {
      return global.emit('task:warn', ['watcher-task', ...args]);
    },
    log(...args) {
      return global.emit('task:log', ['watcher-task', ...args]);
    },
    error(...args) {
      return global.emit('task:error', ['watcher-task', ...args]);
    },
    trace() {}
  };

  global.__defineGetter__('console', () => console);

  global.document = {
    createElement() {
      return {
        setAttribute() {},
        getElementsByTagName() {
          return [];
        },
        appendChild() {}
      };
    },
    documentElement: {
      insertBefore() {},
      removeChild() {}
    },
    getElementById() {
      return {};
    },
    createComment() {
      return {};
    },
    createDocumentFragment() {
      return {};
    }
  };

  global.emit = (event, ...args) => process.send({ event, args });
  global.navigator = { userAgent };

  return (global.window = global);
}

let handler;

// Report a fatal startup failure to the parent, then exit nonzero.
//
// Staying alive without a `handler` would mean silently ignoring every `start`
// message we're sent; exiting instead lets `WatcherTask` apply its usual
// restart accounting and ultimately raise `task:failed`.
function failToStart(message, error) {
  let exit = () => process.exit(1);
  try {
    // Wait for the write to be acknowledged so the error isn't lost when we
    // exit, but don't wait forever if it never is.
    process.send(
      { event: 'task:error', args: [['watcher-task', message, error.message, error.stack]] },
      exit
    );
    setTimeout(exit, 1000);
  } catch (sendError) {
    exit();
  }
}

function handleEvents() {
  process.on('uncaughtException', error => {
    console.error(error.message, error.stack);
  });

  return process.on('message', function ({ event, args } = {}) {
    if (event !== 'start') return;
    // We may still be waiting to exit after a failed startup.
    if (typeof handler !== 'function') return;
    handler(...args);
  });
}

setupGlobals();
handleEvents();

try {
  handler = require(taskPath);
  if (typeof handler !== 'function') {
    throw new TypeError('worker task did not export a function');
  }
} catch (error) {
  failToStart(`Could not start worker task at ${taskPath}`, error);
}
