const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function adviseBefore(object, method, fn) {
  const original = object[method];
  object[method] = function (...args) {
    if (fn.apply(this, args) !== false) return original.apply(this, args);
  };
}

module.exports = { escapeRegExp, adviseBefore };
