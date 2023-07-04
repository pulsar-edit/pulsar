exports.beforeEach = function (fn) {
    global.beforeEach(function () {
        const result = fn();
        if (result instanceof Promise) {
            waitsForPromise(() => result);
        }
    });
};

exports.afterEach = function (fn) {
    global.afterEach(function () {
        const result = fn();
        if (result instanceof Promise) {
            waitsForPromise(() => result);
        }
    });
};

for (const name of ['it', 'fit', 'ffit', 'fffit']) {
    exports[name] = function (description, fn) {
        if (fn === undefined) {
            global[name](description);
            return;
        }

        global[name](description, function () {
            const result = fn();
            if (result instanceof Promise) {
                waitsForPromise(() => result);
            }
        });
    };
}

exports.conditionPromise = async function (
    condition,
    description = condition.toString()
) {
    const startTime = Date.now();

    while (true) {
        await exports.timeoutPromise(100);

        if (await condition()) {
            return;
        }

        if (Date.now() - startTime > 120000) {
            throw new Error('Timed out waiting on ' + description);
        }
    }
};

exports.timeoutPromise = function (timeout) {
    return new Promise(function (resolve) {
        global.setTimeout(resolve, timeout);
    });
};

exports.waitsForPromise = function (fn) {
    const promise = fn();
    global.waitsFor('spec promise to resolve', function (done) {
        promise.then(done, function (error) {
            jasmine.getEnv().currentSpec.fail(error);
            done();
        });
    });
};
