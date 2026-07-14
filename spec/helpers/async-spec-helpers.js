async function conditionPromise(
  condition,
  description = "anonymous condition",
  // Filesystem-watcher and other event-driven conditions are markedly slower to
  // settle on loaded CI runners (especially Windows), so allow more headroom there.
  timeout = process.env.CI ? 30000 : 5000,
) {
  const startTime = Date.now();

  while (true) {
    await timeoutPromise(100);

    // if condition is sync
    if (condition.constructor.name !== "AsyncFunction" && condition()) {
      return;
    }
    // if condition is async
    else if (await condition()) {
      return;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error("Timed out waiting on " + description);
    }
  }
}

function timeoutPromise(timeout) {
  return new Promise((resolve) => {
    global.setTimeout(resolve, timeout);
  });
}

function emitterEventPromise(emitter, event, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error(`Timed out waiting for '${event}' event`));
    }, timeout);
    emitter.once(event, () => {
      clearTimeout(timeoutHandle);
      resolve();
    });
  });
}

exports.conditionPromise = conditionPromise;
exports.emitterEventPromise = emitterEventPromise;
exports.timeoutPromise = timeoutPromise;
