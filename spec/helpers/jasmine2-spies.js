const FindParentDir = require("find-parent-dir");
const path = require("path");
const _ = require("underscore-plus");
const TextEditorElement = require("../../src/text-editor-element");
const pathwatcher = require("@pulsar-edit/pathwatcher");
const TextEditor = require("../../src/text-editor");
const TextMateLanguageMode = require("../../src/text-mate-language-mode");
const {CompositeDisposable} = require("event-kit");
const {clipboard} = require("electron");

// TEMPORARY (troubleshooting): time `atom.project.setPaths`, which the global
// beforeEach below runs for every one of the ~2365 specs. Setting project paths
// builds Directory objects and starts native watchers, and the Windows slowdown
// is concentrated in filesystem-facing suites. Appends to the same file the
// teardown timing uses; duplicated rather than shared because this is
// throwaway.
const SPIES_TIMING_LOG = (() => {
  try {
    const os = require("os");
    const p = require("path");
    return p.join(process.env.GITHUB_WORKSPACE || os.tmpdir(), "teardown-timing.log");
  } catch (e) {
    return null;
  }
})();
let setPathsCount = 0;
function appendSetPathsTiming2(ms) {
  if (!SPIES_TIMING_LOG) return;
  try {
    require("fs").appendFileSync(
      SPIES_TIMING_LOG,
      "GH " + spiesHookCount + " spiesHook=" + ms.toFixed(1) + "\n"
    );
  } catch (e) {
    // Never let instrumentation break a run.
  }
}

function appendSetPathsTiming(ms) {
  if (!SPIES_TIMING_LOG) return;
  try {
    setPathsCount += 1;
    require("fs").appendFileSync(
      SPIES_TIMING_LOG,
      "SP " + setPathsCount + " setPaths=" + ms + "\n"
    );
  } catch (e) {
    // Never let instrumentation break a run.
  }
}

const {testPaths} = atom.getLoadSettings();
let specPackagePath = FindParentDir.sync(testPaths[0], 'package.json')

let specPackageName;
if (specPackagePath) {
  const packageMetadata = require(path.join(specPackagePath, 'package.json'));
  specPackageName = packageMetadata.name;
}

let specDirectory = FindParentDir.sync(testPaths[0], 'fixtures');
let specProjectPath;
if (specDirectory) {
  specProjectPath = path.join(specDirectory, 'fixtures');
} else {
  specProjectPath = require('os').tmpdir();
}

let spiesHookCount = 0;

exports.register = (jasmineEnv) => {
  jasmineEnv.beforeEach(function () {
    const spiesHookStartedAt = performance.now();
    spiesHookCount += 1;
    // Do not clobber recent project history
    spyOn(Object.getPrototypeOf(atom.history), 'saveState').and.returnValue(Promise.resolve());

    const setPathsStartedAt = performance.now();
    atom.project.setPaths([specProjectPath]);
    appendSetPathsTiming((performance.now() - setPathsStartedAt).toFixed(1));

    atom.packages._originalResolvePackagePath = atom.packages.resolvePackagePath;
    const spy = spyOn(atom.packages, 'resolvePackagePath')
    spy.and.callFake(function (packageName) {
      if (specPackageName && (packageName === specPackageName)) {
        return atom.packages._originalResolvePackagePath(specPackagePath);
      } else {
        return atom.packages._originalResolvePackagePath(packageName);
      }
    });

    // prevent specs from modifying Atom's menus
    spyOn(atom.menu, 'sendToBrowserProcess');

    // reset config before each spec
    atom.config.set("core.destroyEmptyPanes", false);
    atom.config.set("editor.fontFamily", "Courier");
    atom.config.set("editor.fontSize", 16);
    atom.config.set("editor.autoIndent", false);
    atom.config.set(
      "core.disabledPackages",
      [
        "package-that-throws-an-exception",
        "package-with-broken-package-json",
        "package-with-broken-keymap"
      ]
    );

    // advanceClock(1000);
    // window.setTimeout.calls.reset();

    // make editor display updates synchronous
    TextEditorElement.prototype.setUpdatedSynchronously(true);

    spyOn(pathwatcher.File.prototype, "detectResurrectionAfterDelay").and.callFake(function () {
      return this.detectResurrection();
    });
    spyOn(TextEditor.prototype, "shouldPromptToSave").and.returnValue(false);

    // make tokenization synchronous
    TextMateLanguageMode.prototype.chunkSize = Infinity;
    spyOn(TextMateLanguageMode.prototype, "tokenizeInBackground").and.callFake(function () {
      return this.tokenizeNextChunk();
    });

    // Without this spy, TextEditor.onDidTokenize callbacks would not be called
    // after the buffer's language mode changed, because by the time the editor
    // called its new language mode's onDidTokenize method, the language mode
    // would already be fully tokenized.
    spyOn(TextEditor.prototype, "onDidTokenize").and.callFake(function (callback) {
      return new CompositeDisposable(
        this.emitter.on("did-tokenize", callback),
        this.onDidChangeGrammar(() => {
          const languageMode = this.buffer.getLanguageMode();
          if (languageMode.tokenizeInBackground != null ? languageMode.tokenizeInBackground.originalValue : undefined) {
            return callback();
          }
        })
      );
    });

    let clipboardContent = 'initial clipboard content';
    spyOn(clipboard, 'writeText').and.callFake(text => clipboardContent = text);
    spyOn(clipboard, 'readText').and.callFake(() => clipboardContent);
    appendSetPathsTiming2(performance.now() - spiesHookStartedAt);
  });
}

jasmine.unspy = function (object, methodName) {
  object[methodName].and.callThrough();
};
