function findElement(selector, options = {}) {
  let {parent, text} = options;
  parent ||= atom.views.getView(atom.workspace);
  return promiseToCheck( () => {
    let elements = [...parent.querySelectorAll(selector)]
    if(typeof(text) === 'string') {
      elements = elements.filter(e => e.innerText === text)
    } else if(text instanceof RegExp) {
      elements = elements.filter(e => e.innerText.match(text))
    }
    return elements[0]
  })
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
