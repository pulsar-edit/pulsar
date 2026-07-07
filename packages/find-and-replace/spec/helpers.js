async function waitForCondition(fn) {
  const startTime = performance.now();

  while (true) {
    if (fn()) return;

    if (performance.now() - startTime > 4000) {
      throw new Error(`Timeout waiting for condition`);
    }

    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

async function wait(ms) {
  const startTime = performance.now();
  while (performance.now() - startTime < ms) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

module.exports = { waitForCondition, wait };
