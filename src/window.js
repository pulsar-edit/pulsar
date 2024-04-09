/**
 * @global
 * @function measure
 * @desc Public: Measure how long a function takes to run.
 * @param {string} description - A string description that will be logged to the
 * console when the function completes.
 * @param {function} fn - A function to measure the duration of.
 * @returns {*} Returns the value returned by the given function.
 */
window.measure = function(description, fn) {
  let start = Date.now();
  let value = fn();
  let result = Date.now() - start;
  console.log(description, result);
  return value;
};

/**
 * @global
 * @function profile
 * @desc Public: Create a dev tools profile for a function.
 * @param {string} description - A string description that will be available in
 * the profiles tab of the dev tools.
 * @param {function} fn - A Function to profile.
 * @returns {*} Returns the value returned by the given function.
 */
window.profile = function(description, fn) {
  window.measure(description, function() {
    console.profile(description);
    let value = fn();
    console.profileEnd(description);
    return value;
  });
};
