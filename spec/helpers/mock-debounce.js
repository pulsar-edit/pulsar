function mockDebounce(func, wait, immediate) {
  // This is nearly a copy paste implementation of Underscore's Debounce Function 
  // The only reason this is being mocked is because the older implementation being used within 
  // underscore-plus has a debounce that checks Date().getTime(), whereas the more recent version 
  // and whats expected of the other mock's is Date.now
  // Meaning debounce is able to rely on system time, while the tests manipulate 
  // the `window` time to test features that need time to pass between them.
  
  var timeout, previous, args, result, context;
  
  // Declaring Rest Arguments here, since its included elsewhere in underscore 
  var restArguments = function(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length = startIndex, 0),
        rest = Array(length),
        index = 0;
      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };
  
  // now this is whats from the original debounce 
  var later = function() {
    // The original Debounce uses its own now.js function here, whereas we can use Date.now()
    var passed = Date.now() - previous;
    if (wait > passed) {
      timeout = setTimeout(later, wait - passed);
    } else {
      timeout = null;
      if (!immediate) result = func.apply(context, args);
      if (!timeout) args = context = null;
    }
  };
  
  var debounced = restArguments(function(_args) {
    context = this;
    args = _args;
    previous = Date.now();
    if (!timeout) {
      timeout = setTimeout(later, wait);
      if (immediate) result = func.apply(context, args);
    }
    return result;
  });
  
  debounced.cancel = function() {
    clearTimeout(timeout);
    timeout = args = context = null;
  };
  
  return debounced;
}

module.exports = {
  mockDebounce,
};
