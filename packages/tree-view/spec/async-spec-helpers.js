/** @babel */

export function beforeEach (fn) {
  global.beforeEach(function () {
    const result = fn()
    if (result instanceof Promise) {
      waitsForPromise(() => result)
    }
  })
}

export function afterEach (fn) {
  global.afterEach(function () {
    const result = fn()
    if (result instanceof Promise) {
      waitsForPromise(() => result)
    }
  })
}

['it', 'fit', 'ffit', 'fffit'].forEach(function (name) {
  module.exports[name] = function (description, fn) {
    if (fn === undefined) {
      global[name](description)
      return
    }

    global[name](description, function () {
      const result = fn()
      if (result instanceof Promise) {
        waitsForPromise(() => result)
      }
    })
  }
})

export async function conditionPromise (condition, description = 'anonymous condition') {
  const startTime = Date.now()

  while (true) {
    await timeoutPromise(100)

    if (await condition()) {
      return
    }

    if (Date.now() - startTime > 5000) {
      throw new Error('Timed out waiting on ' + description)
    }
  }
}

// Wait for a tree view's queued file operations to finish, along with
// whatever awaited them (dialogs closing, deletion's notifications and
// reselection, etc.).
//
// File operations always go async (they're queued, and consumers may delay
// them), but the commands that trigger them don't return promises; this is
// what a spec can wait on instead.
export async function fileOperationsSettled (treeView) {
  let queue
  do {
    queue = treeView.fileOperations.queue
    await queue
    // A macrotask, so that every continuation of the operation's promise has
    // run by the time we return. `setImmediate` rather than `setTimeout`,
    // because the spec helper fakes `setTimeout` unless a spec opts into the
    // real clock.
    await new Promise((resolve) => setImmediate(resolve))
  } while (queue !== treeView.fileOperations.queue)
}

export function timeoutPromise (timeout) {
  return new Promise(function (resolve) {
    global.setTimeout(resolve, timeout)
  })
}

function waitsForPromise (fn) {
  const promise = fn()
  global.waitsFor('spec promise to resolve', function (done) {
    promise.then(done, function (error) {
      jasmine.getEnv().currentSpec.fail(error)
      done()
    })
  })
}

export function emitterEventPromise (emitter, event, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error(`Timed out waiting for '${event}' event`))
    }, timeout)
    emitter.once(event, () => {
      clearTimeout(timeoutHandle)
      resolve()
    })
  })
}

export function promisify (original) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      args.push((err, ...results) => {
        if (err) {
          reject(err)
        } else {
          resolve(...results)
        }
      })

      return original(...args)
    })
  }
}

export function promisifySome (obj, fnNames) {
  const result = {}
  for (const fnName of fnNames) {
    result[fnName] = promisify(obj[fnName])
  }
  return result
}
