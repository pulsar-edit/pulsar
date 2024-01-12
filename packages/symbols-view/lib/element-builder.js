
function parseTagName (selector) {
  if (!selector.includes('.')) {
    return [selector, null];
  }
  let tagName = selector.substring(0, selector.indexOf('.'));
  let classes = selector.substring(selector.indexOf('.') + 1);
  let classList = classes.split('.');
  return [tagName ?? 'div', classList];
}

function el (selector, ...args) {
  let attributes = null;

  if (typeof args[0] === 'object' && !args[0].nodeType) {
    attributes = args.shift();
  }

  // Extract a tag name and any number of class names from the first argument.
  let [tagName, classList] = parseTagName(selector);

  let element = document.createElement(tagName);
  if (attributes) {
    // If an object is given as a second argument, it's a list of
    // attribute/value pairs.
    for (let [attr, value] of Object.entries(attributes)) {
      element.setAttribute(attr, value);
    }
  }
  // Any further arguments are children of the element.
  for (let item of args) {
    if (!item) continue;
    if (typeof item === 'string') {
      item = document.createTextNode(item);
    } else if (Array.isArray(item)) {
      // This is an array; append its children, but do not append it.
      for (let n of item) {
        element.appendChild(n);
      }
      continue;
    }
    element.appendChild(item);
  }

  if (classList) {
    element.classList.add(...classList);
  }

  return element;
}

module.exports = el;
