const _ = require("underscore-plus");
const { mockDebounce } = require("../helpers/mock-debounce");

jasmine.useRealClock = function() {
  jasmine.unspy(window, 'setTimeout');
  jasmine.unspy(window, 'clearTimeout');
  jasmine.unspy(window, 'setInterval');
  jasmine.unspy(window, 'clearInterval');
  jasmine.unspy(_._, 'now');
  jasmine.unspy(Date, 'now');
};

let now;
let timeoutCount;
let intervalCount;
let timeouts;
let intervalTimeouts;

const resetTimeouts = function() {
  now = 0;
  timeoutCount = 0;
  intervalCount = 0;
  timeouts = [];
  intervalTimeouts = {};
};

const fakeSetTimeout = function(callback, ms) {
  if (ms == null) { ms = 0; }
  const id = ++timeoutCount;
  timeouts.push([id, now + ms, callback]);
  return id;
};

const fakeClearTimeout = (idToClear) => {
  timeouts = timeouts.filter(function (...args) {
    const [id] = Array.from(args[0]);
    return id !== idToClear;
  });
}

const fakeSetInterval = function(callback, ms) {
  const id = ++intervalCount;
  var action = function() {
    callback();
    return intervalTimeouts[id] = fakeSetTimeout(action, ms);
  };
  intervalTimeouts[id] = fakeSetTimeout(action, ms);
  return id;
};

fakeClearInterval = function(idToClear) {
  fakeClearTimeout(intervalTimeouts[idToClear]);
};

window.advanceClock = function(delta) {
  if (delta == null) { delta = 1; }
  now += delta;
  const callbacks = [];

  timeouts = timeouts.filter(function(...args) {
    let id, strikeTime;
    let callback;
    [id, strikeTime, callback] = Array.from(args[0]);
    if (strikeTime <= now) {
      callbacks.push(callback);
      return false;
    } else {
      return true;
    }
  });

  return (() => {
    const result = [];
    for (let callback of Array.from(callbacks)) {       result.push(callback());
    }
    return result;
  })();
};

beforeEach(() => {
  resetTimeouts();
  spyOn(_._, "now").and.callFake(() => now);
  spyOn(Date, 'now').and.callFake(() => now);
  spyOn(window, "setTimeout").and.callFake(fakeSetTimeout);
  spyOn(window, "clearTimeout").and.callFake(fakeClearTimeout);
  spyOn(window, 'setInterval').and.callFake(fakeSetInterval);
  spyOn(window, 'clearInterval').and.callFake(fakeClearInterval);
  spyOn(_, "debounce").and.callFake(mockDebounce);
})
