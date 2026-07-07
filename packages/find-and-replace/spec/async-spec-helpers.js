/** @babel */

export async function conditionPromise(condition) {
  const startTime = performance.now();

  while (true) {
    await nextAnimationFrame();

    if (await condition()) {
      return;
    }

    if (performance.now() - startTime > 5000) {
      throw new Error("Timed out waiting on condition");
    }
  }
}

function nextAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
