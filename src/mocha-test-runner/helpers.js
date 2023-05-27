function findElement(selector, parent = document) {
  return promiseToCheck( () => parent.querySelector(selector) );
}

function promiseToCheck(fn, waitTime = 2000) {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      const result = fn();
      if(result) {
        clearInterval(interval)
        resolve(result)
      };
    }, 50)

    setTimeout(() => {
      resolve()
      clearInterval(interval)
    }, waitTime)
  })
}

module.exports = {
  findElement,
  promiseToCheck
}
