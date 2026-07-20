// Users may have this environment variable set. Currently, it causes babel to
// log to stderr, which causes errors on Windows.
// See https://github.com/atom/electron/issues/2033
process.env.DEBUG = "*";

const fs = require("fs");
const path = require("path");
const temp = require("temp").track();
const Babel = require("../src/babel");
const CompileCache = require("../src/compile-cache");

describe("Babel transpiler support", function () {
  let originalCacheDir = null;

  beforeEach(function () {
    originalCacheDir = CompileCache.getCacheDirectory();
    CompileCache.setCacheDirectory(temp.mkdirSync("compile-cache"));
    // TODO: rework to avoid using IIFE https://developer.mozilla.org/en-US/docs/Glossary/IIFE
    return (() => {
      const result = [];
      for (let cacheKey of Object.keys(require.cache)) {
        if (cacheKey.startsWith(path.join(__dirname, "fixtures", "babel"))) {
          result.push(delete require.cache[cacheKey]);
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  });

  afterEach(function () {
    CompileCache.setCacheDirectory(originalCacheDir);
    try {
      return temp.cleanupSync();
    } catch {
      /* ignore cleanup failure */
    }
  });

  describe("when a .js file starts with /** @babel */;", () =>
    it("transpiles it using babel", function () {
      const transpiled = require("./fixtures/babel/babel-comment.js");
      expect(transpiled(3)).toBe(4);
    }));

  describe("when a .js file contains a legacy JSX pragma", () =>
    it("transpiles it using the classic JSX runtime", function () {
      const element = require("./fixtures/babel/jsx-pragma.js");
      expect(element[0]).toBe("div");
      expect(element[1]).toEqual({ className: "settings-view" });
    }));

  describe("when JSX text contains legacy unescaped characters", function () {
    it("escapes them before transpiling", function () {
      const source = `/** @babel */
/** @jsx createElement */
const createElement = (...args) => args;
module.exports = <p>Menu > Settings } Advanced</p>;`;
      const compiled = Babel.compile(source, "legacy-jsx-text.js");
      const compiledPath = path.join(temp.mkdirSync("legacy-jsx-text"), "compiled.js");

      fs.writeFileSync(compiledPath, compiled);
      const element = require(compiledPath);

      expect(element[2]).toBe("Menu > Settings } Advanced");
    });

    it("does not hide unrelated parse errors", function () {
      expect(() => Babel.compile("/** @babel */\nconst value = ;", "invalid.js")).toThrow();
    });
  });

  describe("when a .js file contains a legacy decorator", () =>
    it("transpiles the decorator before class properties", function () {
      const Display = require("./fixtures/babel/legacy-decorator.js");
      expect(Display.observed).toBe(true);
    }));

  describe("when a .js file starts with 'use babel';", () =>
    it("transpiles it using babel", function () {
      const transpiled = require("./fixtures/babel/babel-single-quotes.js");
      expect(transpiled(3)).toBe(4);
    }));

  describe('when a .js file starts with "use babel";', () =>
    it("transpiles it using babel", function () {
      const transpiled = require("./fixtures/babel/babel-double-quotes.js");
      expect(transpiled(3)).toBe(4);
    }));

  describe("when a .js file starts with /* @flow */", () =>
    it("transpiles it using babel", function () {
      const transpiled = require("./fixtures/babel/flow-comment.js");
      expect(transpiled(3)).toBe(4);
    }));

  describe("when a .js file starts with // @flow", () =>
    it("transpiles it using babel", function () {
      const transpiled = require("./fixtures/babel/flow-slash-comment.js");
      expect(transpiled(3)).toBe(4);
    }));

  describe("when a .js file does not start with 'use babel';", function () {
    it("does not transpile it using babel", function () {
      spyOn(console, "error");
      expect(() => require("./fixtures/babel/invalid.js")).toThrow();
    });

    it("does not try to log to stdout or stderr while parsing the file", function () {
      spyOn(process.stderr, "write");
      spyOn(process.stdout, "write");

      require("./fixtures/babel/babel-double-quotes.js");

      expect(process.stdout.write).not.toHaveBeenCalled();
      expect(process.stderr.write).not.toHaveBeenCalled();
    });
  });
});
