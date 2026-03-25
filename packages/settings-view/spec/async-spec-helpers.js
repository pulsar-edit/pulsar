async function conditionPromise(
  condition,
  description = 'anonymous condition',
  timeout = 5000
) {
  const startTime = Date.now();

  while (true) {
    await timeoutPromise(100);

    // if condition is sync
    if (condition.constructor.name !== 'AsyncFunction' && condition()) {
      return;
    }
    // if condition is async
    else if (await condition()) {
      return;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error('Timed out waiting on ' + description);
    }
  }
}

function timeoutPromise(timeout) {
  return new Promise(resolve => {
    global.setTimeout(resolve, timeout);
  });
}

exports.conditionPromise = conditionPromise;
exports.timeoutPromise = timeoutPromise;
