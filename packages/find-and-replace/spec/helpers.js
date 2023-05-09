const genPromiseToCheck = fn => new Promise(resolve => {
  const interval = setInterval(() => { if(fn()) resolve() }, 100)
  setTimeout(() => {
    resolve()
    clearInterval(interval)
  }, 4000)
})

module.exports = { genPromiseToCheck }
