const { userAgent } = process.env;
const taskPath = process.argv.at(-1);
const compileCachePath = process.env.PULSAR_COMPILE_CACHE_PATH;

const CompileCache = require('./compile-cache');
CompileCache.setCacheDirectory(compileCachePath);
CompileCache.install(`${process.resourcesPath}`, require);

function setupGlobals() {
	global.attachEvent = () => {};

	const console = {
		warn() {
      return global.emit('task:warn', ...arguments);
    },
    log() {
      return global.emit('task:log', ...arguments);
    },
    error() {
      return global.emit('task:error', ...arguments);
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

function handleEvents() {
	process.on('uncaughtException', error => {
		console.error(error.message, error.stack);
	});

	return process.on('message', function ({ event, args } = {}) {
		if (event !== 'start') return;
		handler(...args);
	});
}

setupGlobals();
handleEvents();
handler = require(taskPath);
