exports.beforeEach = function beforeEach (fn) {
  global.beforeEach(function () {
    const result = fn()
    if (result instanceof Promise) {
      waitsForPromise(() => result)
    }
  })
}

exports.afterEach = function afterEach (fn) {
  global.afterEach(function () {
    const result = fn()
    if (result instanceof Promise) {
      waitsForPromise(() => result)
    }
  })
}

;['it', 'fit', 'ffit', 'fffit'].forEach(function (name) {
  exports[name] = function (description, fn) {
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

exports.waitForCondition = function waitForCondition(fn) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (fn()) {
        resolve()
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }, 100)
    let timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for condition`))
      clearInterval(interval)
    }, 4000)
  })
}

exports.wait = function wait(ms) {
  return new Promise(r => setTimeout(r, ms))
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
