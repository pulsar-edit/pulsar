function waitForCondition(fn) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (fn()) {
        resolve();
        clearInterval(interval);
        clearTimeout(timeout);
      }
    }, 100);
    let timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for condition`));
      clearInterval(interval);
    }, 4000);
  });
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { waitForCondition, wait };
