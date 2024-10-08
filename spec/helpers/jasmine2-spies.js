const FindParentDir = require("find-parent-dir");
const path = require("path");
const _ = require("underscore-plus");
const TextEditorElement = require("../../src/text-editor-element");
const pathwatcher = require("pathwatcher");
const TextEditor = require("../../src/text-editor");
const TextMateLanguageMode = require("../../src/text-mate-language-mode");
const TreeSitterLanguageMode = require("../../src/tree-sitter-language-mode");
const {CompositeDisposable} = require("event-kit");
const {clipboard} = require("electron");

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

exports.register = (jasmineEnv) => {
  jasmineEnv.beforeEach(function () {
    // Do not clobber recent project history
    spyOn(Object.getPrototypeOf(atom.history), 'saveState').and.returnValue(Promise.resolve());

    atom.project.setPaths([specProjectPath]);

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
    atom.config.set("core.disabledPackages", ["package-that-throws-an-exception",
      "package-with-broken-package-json", "package-with-broken-keymap"]);

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
    TreeSitterLanguageMode.prototype.syncTimeoutMicros = Infinity;
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
  });
}

jasmine.unspy = function(object, methodName) {
  object[methodName].and.callThrough();
};
