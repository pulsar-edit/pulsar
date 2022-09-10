(function() {
  var CompositeDisposable, FindParentDir, Grim, TextEditor, TextEditorElement, TextMateLanguageMode, TreeSitterLanguageMode, addCustomMatchers, clipboard, emitObject, ensureNoDeprecatedFunctionCalls, ensureNoDeprecatedStylesheets, fixturePackagesPath, fs, grimDeprecationsSnapshot, jasmineStyle, packageMetadata, path, pathwatcher, specDirectory, specPackageName, specPackagePath, specProjectPath, stylesDeprecationsSnapshot, testPaths, warnIfLeakingPathSubscriptions, _,
    __slice = [].slice;

  require('jasmine-json');

  require('../src/window');

  require('../vendor/jasmine-jquery');

  path = require('path');

  _ = require('underscore-plus');

  fs = require('fs-plus');

  Grim = require('grim');

  pathwatcher = require('pathwatcher');

  FindParentDir = require('find-parent-dir');

  CompositeDisposable = require('event-kit').CompositeDisposable;

  TextEditor = require('../src/text-editor');

  TextEditorElement = require('../src/text-editor-element');

  TextMateLanguageMode = require('../src/text-mate-language-mode');

  TreeSitterLanguageMode = require('../src/tree-sitter-language-mode');

  clipboard = require('electron').clipboard;

  jasmineStyle = document.createElement('style');

  jasmineStyle.textContent = atom.themes.loadStylesheet(atom.themes.resolveStylesheet('../static/jasmine'));

  document.head.appendChild(jasmineStyle);

  fixturePackagesPath = path.resolve(__dirname, './fixtures/packages');

  atom.packages.packageDirPaths.unshift(fixturePackagesPath);

  document.querySelector('html').style.overflow = 'auto';

  document.body.style.overflow = 'auto';

  Set.prototype.jasmineToString = function() {
    var first, result;
    result = "Set {";
    first = true;
    this.forEach(function(element) {
      if (!first) {
        result += ", ";
      }
      return result += element.toString();
    });
    first = false;
    return result + "}";
  };

  Set.prototype.isEqual = function(other) {
    var next, values;
    if (other instanceof Set) {
      if (this.size !== other.size) {
        return false;
      }
      values = this.values();
      while (!(next = values.next()).done) {
        if (!other.has(next.value)) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  };

  jasmine.getEnv().addEqualityTester(function(a, b) {
    if ((a != null ? a.jasmineMatches : void 0) != null) {
      return a.jasmineMatches(b);
    }
    if ((b != null ? b.jasmineMatches : void 0) != null) {
      return b.jasmineMatches(a);
    }
    return _.isEqual(a, b);
  });

  if (process.env.CI) {
    jasmine.getEnv().defaultTimeoutInterval = 120000;
  } else {
    jasmine.getEnv().defaultTimeoutInterval = 5000;
  }

  testPaths = atom.getLoadSettings().testPaths;

  if (specPackagePath = FindParentDir.sync(testPaths[0], 'package.json')) {
    packageMetadata = require(path.join(specPackagePath, 'package.json'));
    specPackageName = packageMetadata.name;
  }

  if (specDirectory = FindParentDir.sync(testPaths[0], 'fixtures')) {
    specProjectPath = path.join(specDirectory, 'fixtures');
  } else {
    specProjectPath = require('os').tmpdir();
  }

  beforeEach(function() {
    var clipboardContent, resolvePackagePath, spy;
    spyOn(Object.getPrototypeOf(atom.history), 'saveState').andReturn(Promise.resolve());
    atom.project.setPaths([specProjectPath]);
    window.resetTimeouts();
    spyOn(_._, "now").andCallFake(function() {
      return window.now;
    });
    spyOn(Date, 'now').andCallFake(function() {
      return window.now;
    });
    spyOn(window, "setTimeout").andCallFake(window.fakeSetTimeout);
    spyOn(window, "clearTimeout").andCallFake(window.fakeClearTimeout);
    spy = spyOn(atom.packages, 'resolvePackagePath').andCallFake(function(packageName) {
      if (specPackageName && packageName === specPackageName) {
        return resolvePackagePath(specPackagePath);
      } else {
        return resolvePackagePath(packageName);
      }
    });
    resolvePackagePath = _.bind(spy.originalValue, atom.packages);
    spyOn(atom.menu, 'sendToBrowserProcess');
    atom.config.set("core.destroyEmptyPanes", false);
    atom.config.set("editor.fontFamily", "Courier");
    atom.config.set("editor.fontSize", 16);
    atom.config.set("editor.autoIndent", false);
    atom.config.set("core.disabledPackages", ["package-that-throws-an-exception", "package-with-broken-package-json", "package-with-broken-keymap"]);
    advanceClock(1000);
    window.setTimeout.reset();
    TextEditorElement.prototype.setUpdatedSynchronously(true);
    spyOn(pathwatcher.File.prototype, "detectResurrectionAfterDelay").andCallFake(function() {
      return this.detectResurrection();
    });
    spyOn(TextEditor.prototype, "shouldPromptToSave").andReturn(false);
    TextMateLanguageMode.prototype.chunkSize = Infinity;
    TreeSitterLanguageMode.prototype.syncTimeoutMicros = Infinity;
    spyOn(TextMateLanguageMode.prototype, "tokenizeInBackground").andCallFake(function() {
      return this.tokenizeNextChunk();
    });
    spyOn(TextEditor.prototype, "onDidTokenize").andCallFake(function(callback) {
      return new CompositeDisposable(this.emitter.on("did-tokenize", callback), this.onDidChangeGrammar((function(_this) {
        return function() {
          var languageMode, _ref;
          languageMode = _this.buffer.getLanguageMode();
          if ((_ref = languageMode.tokenizeInBackground) != null ? _ref.originalValue : void 0) {
            return callback();
          }
        };
      })(this)));
    });
    clipboardContent = 'initial clipboard content';
    spyOn(clipboard, 'writeText').andCallFake(function(text) {
      return clipboardContent = text;
    });
    spyOn(clipboard, 'readText').andCallFake(function() {
      return clipboardContent;
    });
    return addCustomMatchers(this);
  });

  afterEach(function() {
    ensureNoDeprecatedFunctionCalls();
    ensureNoDeprecatedStylesheets();
    waitsForPromise(function() {
      return atom.reset();
    });
    return runs(function() {
      if (!window.debugContent) {
        document.getElementById('jasmine-content').innerHTML = '';
      }
      warnIfLeakingPathSubscriptions();
      return waits(0);
    });
  });

  warnIfLeakingPathSubscriptions = function() {
    var watchedPaths;
    watchedPaths = pathwatcher.getWatchedPaths();
    if (watchedPaths.length > 0) {
      console.error("WARNING: Leaking subscriptions for paths: " + watchedPaths.join(", "));
    }
    return pathwatcher.closeAllWatchers();
  };

  ensureNoDeprecatedFunctionCalls = function() {
    var deprecations, error, originalPrepareStackTrace;
    deprecations = _.clone(Grim.getDeprecations());
    Grim.clearDeprecations();
    if (deprecations.length > 0) {
      originalPrepareStackTrace = Error.prepareStackTrace;
      Error.prepareStackTrace = function(error, stack) {
        var deprecation, functionName, location, output, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
        output = [];
        for (_i = 0, _len = deprecations.length; _i < _len; _i++) {
          deprecation = deprecations[_i];
          output.push(deprecation.originName + " is deprecated. " + deprecation.message);
          output.push(_.multiplyString("-", output[output.length - 1].length));
          _ref = deprecation.getStacks();
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            stack = _ref[_j];
            for (_k = 0, _len2 = stack.length; _k < _len2; _k++) {
              _ref1 = stack[_k], functionName = _ref1.functionName, location = _ref1.location;
              output.push(functionName + " -- " + location);
            }
          }
          output.push("");
        }
        return output.join("\n");
      };
      error = new Error("Deprecated function(s) " + (deprecations.map(function(_arg) {
        var originName;
        originName = _arg.originName;
        return originName;
      }).join(', ')) + ") were called.");
      error.stack;
      Error.prepareStackTrace = originalPrepareStackTrace;
      throw error;
    }
  };

  ensureNoDeprecatedStylesheets = function() {
    var deprecation, deprecations, sourcePath, title, _results;
    deprecations = _.clone(atom.styles.getDeprecations());
    atom.styles.clearDeprecations();
    _results = [];
    for (sourcePath in deprecations) {
      deprecation = deprecations[sourcePath];
      title = sourcePath !== 'undefined' ? "Deprecated stylesheet at '" + sourcePath + "':" : "Deprecated stylesheet:";
      throw new Error(title + "\n" + deprecation.message);
    }
    return _results;
  };

  emitObject = jasmine.StringPrettyPrinter.prototype.emitObject;

  jasmine.StringPrettyPrinter.prototype.emitObject = function(obj) {
    if (obj.inspect) {
      return this.append(obj.inspect());
    } else {
      return emitObject.call(this, obj);
    }
  };

  jasmine.unspy = function(object, methodName) {
    if (!object[methodName].hasOwnProperty('originalValue')) {
      throw new Error("Not a spy");
    }
    return object[methodName] = object[methodName].originalValue;
  };

  jasmine.attachToDOM = function(element) {
    var jasmineContent;
    jasmineContent = document.querySelector('#jasmine-content');
    if (!jasmineContent.contains(element)) {
      return jasmineContent.appendChild(element);
    }
  };

  grimDeprecationsSnapshot = null;

  stylesDeprecationsSnapshot = null;

  jasmine.snapshotDeprecations = function() {
    grimDeprecationsSnapshot = _.clone(Grim.deprecations);
    return stylesDeprecationsSnapshot = _.clone(atom.styles.deprecationsBySourcePath);
  };

  jasmine.restoreDeprecationsSnapshot = function() {
    Grim.deprecations = grimDeprecationsSnapshot;
    return atom.styles.deprecationsBySourcePath = stylesDeprecationsSnapshot;
  };

  jasmine.useRealClock = function() {
    jasmine.unspy(window, 'setTimeout');
    jasmine.unspy(window, 'clearTimeout');
    jasmine.unspy(_._, 'now');
    return jasmine.unspy(Date, 'now');
  };

  jasmine.useMockClock = function() {
    spyOn(window, 'setInterval').andCallFake(fakeSetInterval);
    return spyOn(window, 'clearInterval').andCallFake(fakeClearInterval);
  };

  addCustomMatchers = function(spec) {
    return spec.addMatchers({
      toBeInstanceOf: function(expected) {
        var beOrNotBe;
        beOrNotBe = this.isNot ? "not be" : "be";
        this.message = (function(_this) {
          return function() {
            return "Expected " + (jasmine.pp(_this.actual)) + " to " + beOrNotBe + " instance of " + expected.name + " class";
          };
        })(this);
        return this.actual instanceof expected;
      },
      toHaveLength: function(expected) {
        var haveOrNotHave;
        if (this.actual == null) {
          this.message = (function(_this) {
            return function() {
              return "Expected object " + _this.actual + " has no length method";
            };
          })(this);
          return false;
        } else {
          haveOrNotHave = this.isNot ? "not have" : "have";
          this.message = (function(_this) {
            return function() {
              return "Expected object with length " + _this.actual.length + " to " + haveOrNotHave + " length " + expected;
            };
          })(this);
          return this.actual.length === expected;
        }
      },
      toExistOnDisk: function(expected) {
        var toOrNotTo;
        toOrNotTo = this.isNot && "not to" || "to";
        this.message = function() {
          return "Expected path '" + this.actual + "' " + toOrNotTo + " exist.";
        };
        return fs.existsSync(this.actual);
      },
      toHaveFocus: function() {
        var element, toOrNotTo;
        toOrNotTo = this.isNot && "not to" || "to";
        if (!document.hasFocus()) {
          console.error("Specs will fail because the Dev Tools have focus. To fix this close the Dev Tools or click the spec runner.");
        }
        this.message = function() {
          return "Expected element '" + this.actual + "' or its descendants " + toOrNotTo + " have focus.";
        };
        element = this.actual;
        if (element.jquery) {
          element = element.get(0);
        }
        return element === document.activeElement || element.contains(document.activeElement);
      },
      toShow: function() {
        var computedStyle, element, toOrNotTo;
        toOrNotTo = this.isNot && "not to" || "to";
        element = this.actual;
        if (element.jquery) {
          element = element.get(0);
        }
        this.message = function() {
          return "Expected element '" + element + "' or its descendants " + toOrNotTo + " show.";
        };
        computedStyle = getComputedStyle(element);
        return computedStyle.display !== 'none' && computedStyle.visibility === 'visible' && !element.hidden;
      },
      toEqualPath: function(expected) {
        var actualPath, expectedPath;
        actualPath = path.normalize(this.actual);
        expectedPath = path.normalize(expected);
        this.message = function() {
          return "Expected path '" + actualPath + "' to be equal to '" + expectedPath + "'.";
        };
        return actualPath === expectedPath;
      },
      toBeNear: function(expected, acceptedError, actual) {
        if (acceptedError == null) {
          acceptedError = 1;
        }
        return (typeof expected === 'number') && (typeof acceptedError === 'number') && (typeof this.actual === 'number') && (expected - acceptedError <= this.actual) && (this.actual <= expected + acceptedError);
      },
      toHaveNearPixels: function(expected, acceptedError, actual) {
        var actualNumber, expectedNumber;
        if (acceptedError == null) {
          acceptedError = 1;
        }
        expectedNumber = parseFloat(expected);
        actualNumber = parseFloat(this.actual);
        return (typeof expected === 'string') && (typeof acceptedError === 'number') && (typeof this.actual === 'string') && (expected.indexOf('px') >= 1) && (this.actual.indexOf('px') >= 1) && (expectedNumber - acceptedError <= actualNumber) && (actualNumber <= expectedNumber + acceptedError);
      }
    });
  };

  window.waitsForPromise = function() {
    var args, fn, label, shouldReject, timeout, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    label = null;
    if (args.length > 1) {
      _ref = args[0], shouldReject = _ref.shouldReject, timeout = _ref.timeout, label = _ref.label;
    } else {
      shouldReject = false;
    }
    if (label == null) {
      label = 'promise to be resolved or rejected';
    }
    fn = _.last(args);
    return window.waitsFor(label, timeout, function(moveOn) {
      var promise;
      promise = fn();
      if (shouldReject) {
        promise["catch"].call(promise, moveOn);
        return promise.then(function() {
          jasmine.getEnv().currentSpec.fail("Expected promise to be rejected, but it was resolved");
          return moveOn();
        });
      } else {
        promise.then(moveOn);
        return promise["catch"].call(promise, function(error) {
          jasmine.getEnv().currentSpec.fail("Expected promise to be resolved, but it was rejected with: " + (error != null ? error.message : void 0) + " " + (jasmine.pp(error)));
          return moveOn();
        });
      }
    });
  };

  window.resetTimeouts = function() {
    window.now = 0;
    window.timeoutCount = 0;
    window.intervalCount = 0;
    window.timeouts = [];
    return window.intervalTimeouts = {};
  };

  window.fakeSetTimeout = function(callback, ms) {
    var id;
    if (ms == null) {
      ms = 0;
    }
    id = ++window.timeoutCount;
    window.timeouts.push([id, window.now + ms, callback]);
    return id;
  };

  window.fakeClearTimeout = function(idToClear) {
    return window.timeouts = window.timeouts.filter(function(_arg) {
      var id;
      id = _arg[0];
      return id !== idToClear;
    });
  };

  window.fakeSetInterval = function(callback, ms) {
    var action, id;
    id = ++window.intervalCount;
    action = function() {
      callback();
      return window.intervalTimeouts[id] = window.fakeSetTimeout(action, ms);
    };
    window.intervalTimeouts[id] = window.fakeSetTimeout(action, ms);
    return id;
  };

  window.fakeClearInterval = function(idToClear) {
    return window.fakeClearTimeout(this.intervalTimeouts[idToClear]);
  };

  window.advanceClock = function(delta) {
    var callback, callbacks, _i, _len, _results;
    if (delta == null) {
      delta = 1;
    }
    window.now += delta;
    callbacks = [];
    window.timeouts = window.timeouts.filter(function(_arg) {
      var callback, id, strikeTime;
      id = _arg[0], strikeTime = _arg[1], callback = _arg[2];
      if (strikeTime <= window.now) {
        callbacks.push(callback);
        return false;
      } else {
        return true;
      }
    });
    _results = [];
    for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
      callback = callbacks[_i];
      _results.push(callback());
    }
    return _results;
  };

  exports.mockLocalStorage = function() {
    var items;
    items = {};
    spyOn(global.localStorage, 'setItem').andCallFake(function(key, item) {
      items[key] = item.toString();
      return void 0;
    });
    spyOn(global.localStorage, 'getItem').andCallFake(function(key) {
      var _ref;
      return (_ref = items[key]) != null ? _ref : null;
    });
    return spyOn(global.localStorage, 'removeItem').andCallFake(function(key) {
      delete items[key];
      return void 0;
    });
  };

}).call(this);
