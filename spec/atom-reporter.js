/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let AtomReporter;
const path = require('path');
const process = require('process');
const _ = require('underscore-plus');
const grim = require('grim');
const listen = require('../src/delegated-listener');
const ipcHelpers = require('../src/ipc-helpers');

const formatStackTrace = function(spec, message, stackTrace) {
  if (message == null) { message = ''; }
  if (!stackTrace) { return stackTrace; }

  // at ... (.../jasmine.js:1:2)
  const jasminePattern = /^\s*at\s+.*\(?.*[/\\]jasmine(-[^/\\]*)?\.js:\d+:\d+\)?\s*$/;
  // at jasmine.Something... (.../jasmine.js:1:2)
  const firstJasmineLinePattern = /^\s*at\s+jasmine\.[A-Z][^\s]*\s+\(?.*[/\\]jasmine(-[^/\\]*)?\.js:\d+:\d+\)?\s*$/;
  let lines = [];
  for (let line of Array.from(stackTrace.split('\n'))) {
    if (firstJasmineLinePattern.test(line)) { break; }
    if (!jasminePattern.test(line)) { lines.push(line); }
  }

  // Remove first line of stack when it is the same as the error message
  const errorMatch = lines[0] != null ? lines[0].match(/^Error: (.*)/) : undefined;
  if (message.trim() === __guard__(errorMatch != null ? errorMatch[1] : undefined, x => x.trim())) { lines.shift(); }

  lines = lines.map(function(line) {
    // Only format actual stacktrace lines
    if (/^\s*at\s/.test(line)) {
      // Needs to occur before path relativization
      if ((process.platform === 'win32') && /file:\/\/\//.test(line)) {
        // file:///C:/some/file -> C:\some\file
        line = line.replace('file:///', '').replace(new RegExp(`${path.posix.sep}`, 'g'), path.win32.sep);
      }

      line = line.trim()
        // at jasmine.Spec.<anonymous> (path:1:2) -> at path:1:2
        .replace(/^at jasmine\.Spec\.<anonymous> \(([^)]+)\)/, 'at $1')
        // at jasmine.Spec.it (path:1:2) -> at path:1:2
        .replace(/^at jasmine\.Spec\.f*it \(([^)]+)\)/, 'at $1')
        // at it (path:1:2) -> at path:1:2
        .replace(/^at f*it \(([^)]+)\)/, 'at $1')
        // at spec/file-test.js -> at file-test.js
        .replace(spec.specDirectory + path.sep, '');
    }

    return line;
  });

  return lines.join('\n').trim();
};

module.exports =
(AtomReporter = (function() {
  AtomReporter = class AtomReporter {
    static initClass() {
  
      this.prototype.startedAt = null;
      this.prototype.runningSpecCount = 0;
      this.prototype.completeSpecCount = 0;
      this.prototype.passedCount = 0;
      this.prototype.failedCount = 0;
      this.prototype.skippedCount = 0;
      this.prototype.totalSpecCount = 0;
      this.prototype.deprecationCount = 0;
      this.timeoutId = 0;
    }
    constructor() {
      this.element = document.createElement('div');
      this.element.classList.add('spec-reporter-container');
      this.element.innerHTML = `\
<div class="spec-reporter">
  <div class="padded pull-right">
    <button outlet="reloadButton" class="btn btn-small reload-button">Reload Specs</button>
  </div>
  <div outlet="coreArea" class="symbol-area">
    <div outlet="coreHeader" class="symbol-header"></div>
    <ul outlet="coreSummary"class="symbol-summary list-unstyled"></ul>
  </div>
  <div outlet="bundledArea" class="symbol-area">
    <div outlet="bundledHeader" class="symbol-header"></div>
    <ul outlet="bundledSummary"class="symbol-summary list-unstyled"></ul>
  </div>
  <div outlet="userArea" class="symbol-area">
    <div outlet="userHeader" class="symbol-header"></div>
    <ul outlet="userSummary"class="symbol-summary list-unstyled"></ul>
  </div>
  <div outlet="status" class="status alert alert-info">
    <div outlet="time" class="time"></div>
    <div outlet="specCount" class="spec-count"></div>
    <div outlet="message" class="message"></div>
  </div>
  <div outlet="results" class="results"></div>
  <div outlet="deprecations" class="status alert alert-warning" style="display: none">
    <span outlet="deprecationStatus">0 deprecations</span>
    <div class="deprecation-toggle"></div>
  </div>
  <div outlet="deprecationList" class="deprecation-list"></div>
</div>\
`;

      for (let element of Array.from(this.element.querySelectorAll('[outlet]'))) {
        this[element.getAttribute('outlet')] = element;
      }
    }

    reportRunnerStarting(runner) {
      this.handleEvents();
      this.startedAt = Date.now();
      const specs = runner.specs();
      this.totalSpecCount = specs.length;
      this.addSpecs(specs);
      return document.body.appendChild(this.element);
    }

    reportRunnerResults(runner) {
      this.updateSpecCounts();
      if (this.failedCount === 0) {
        this.status.classList.add('alert-success');
        this.status.classList.remove('alert-info');
      }

      if (this.failedCount === 1) {
        return this.message.textContent = `${this.failedCount} failure`;
      } else {
        return this.message.textContent = `${this.failedCount} failures`;
      }
    }

    reportSuiteResults(suite) {}

    reportSpecResults(spec) {
      this.completeSpecCount++;
      spec.endedAt = Date.now();
      this.specComplete(spec);
      return this.updateStatusView(spec);
    }

    reportSpecStarting(spec) {
      return this.specStarted(spec);
    }

    handleEvents() {
      listen(document, 'click', '.spec-toggle', function(event) {
        const specFailures = event.currentTarget.parentElement.querySelector('.spec-failures');

        if (specFailures.style.display === 'none') {
          specFailures.style.display = '';
          event.currentTarget.classList.remove('folded');
        } else {
          specFailures.style.display = 'none';
          event.currentTarget.classList.add('folded');
        }

        return event.preventDefault();
      });

      listen(document, 'click', '.deprecation-list', function(event) {
        const deprecationList = event.currentTarget.parentElement.querySelector('.deprecation-list');

        if (deprecationList.style.display === 'none') {
          deprecationList.style.display = '';
          event.currentTarget.classList.remove('folded');
        } else {
          deprecationList.style.display = 'none';
          event.currentTarget.classList.add('folded');
        }

        return event.preventDefault();
      });

      listen(document, 'click', '.stack-trace', event => event.currentTarget.classList.toggle('expanded'));

      return this.reloadButton.addEventListener('click', () => ipcHelpers.call('window-method', 'reload'));
    }

    updateSpecCounts() {
      let specCount;
      if (this.skippedCount) {
        specCount = `${this.completeSpecCount - this.skippedCount}/${this.totalSpecCount - this.skippedCount} (${this.skippedCount} skipped)`;
      } else {
        specCount = `${this.completeSpecCount}/${this.totalSpecCount}`;
      }
      return this.specCount.textContent = specCount;
    }

    updateStatusView(spec) {
      if (this.failedCount > 0) {
        this.status.classList.add('alert-danger');
        this.status.classList.remove('alert-info');
      }

      this.updateSpecCounts();

      let rootSuite = spec.suite;
      while (rootSuite.parentSuite) { rootSuite = rootSuite.parentSuite; }
      this.message.textContent = rootSuite.description;

      let time = `${Math.round((spec.endedAt - this.startedAt) / 10)}`;
      if (time.length < 3) { time = `0${time}`; }
      return this.time.textContent = `${time.slice(0, -2)}.${time.slice(-2)}s`;
    }

    specTitle(spec) {
      const parentDescs = [];
      let s = spec.suite;
      while (s) {
        parentDescs.unshift(s.description);
        s = s.parentSuite;
      }

      let suiteString = "";
      let indent = "";
      for (let desc of Array.from(parentDescs)) {
        suiteString += indent + desc + "\n";
        indent += "  ";
      }

      return `${suiteString} ${indent} it ${spec.description}`;
    }

    addSpecs(specs) {
      let coreSpecs = 0;
      let bundledPackageSpecs = 0;
      let userPackageSpecs = 0;
      for (let spec of Array.from(specs)) {
        const symbol = document.createElement('li');
        symbol.setAttribute('id', `spec-summary-${spec.id}`);
        symbol.setAttribute('title', this.specTitle(spec));
        symbol.className = "spec-summary pending";
        switch (spec.specType) {
          case 'core':
            coreSpecs++;
            this.coreSummary.appendChild(symbol);
            break;
          case 'bundled':
            bundledPackageSpecs++;
            this.bundledSummary.appendChild(symbol);
            break;
          case 'user':
            userPackageSpecs++;
            this.userSummary.appendChild(symbol);
            break;
        }
      }

      if (coreSpecs > 0) {
        this.coreHeader.textContent = `Core Specs (${coreSpecs})`;
      } else {
        this.coreArea.style.display = 'none';
      }
      if (bundledPackageSpecs > 0) {
        this.bundledHeader.textContent = `Bundled Package Specs (${bundledPackageSpecs})`;
      } else {
        this.bundledArea.style.display = 'none';
      }
      if (userPackageSpecs > 0) {
        if ((coreSpecs === 0) && (bundledPackageSpecs === 0)) {
          // Package specs being run, show a more descriptive label
          const {specDirectory} = specs[0];
          const packageFolderName = path.basename(path.dirname(specDirectory));
          const packageName = _.undasherize(_.uncamelcase(packageFolderName));
          return this.userHeader.textContent = `${packageName} Specs`;
        } else {
          return this.userHeader.textContent = `User Package Specs (${userPackageSpecs})`;
        }
      } else {
        return this.userArea.style.display = 'none';
      }
    }

    specStarted(spec) {
      return this.runningSpecCount++;
    }

    specComplete(spec) {
      const specSummaryElement = document.getElementById(`spec-summary-${spec.id}`);
      specSummaryElement.classList.remove('pending');

      const results = spec.results();
      if (results.skipped) {
        specSummaryElement.classList.add("skipped");
        return this.skippedCount++;
      } else if (results.passed()) {
        specSummaryElement.classList.add("passed");
        return this.passedCount++;
      } else {
        specSummaryElement.classList.add("failed");

        const specView = new SpecResultView(spec);
        specView.attach();
        return this.failedCount++;
      }
    }
  };
  AtomReporter.initClass();
  return AtomReporter;
})());

class SuiteResultView {
  constructor(suite) {
    this.suite = suite;
    this.element = document.createElement('div');
    this.element.className = 'suite';
    this.element.setAttribute('id', `suite-view-${this.suite.id}`);
    this.description = document.createElement('div');
    this.description.className = 'description';
    this.description.textContent = this.suite.description;
    this.element.appendChild(this.description);
  }

  attach() {
    return (this.parentSuiteView() || document.querySelector('.results')).appendChild(this.element);
  }

  parentSuiteView() {
    let suiteViewElement;
    if (!this.suite.parentSuite) { return; }

    if (!(suiteViewElement = document.querySelector(`#suite-view-${this.suite.parentSuite.id}`))) {
      const suiteView = new SuiteResultView(this.suite.parentSuite);
      suiteView.attach();
      suiteViewElement = suiteView.element;
    }

    return suiteViewElement;
  }
}

class SpecResultView {
  constructor(spec) {
    this.spec = spec;
    this.element = document.createElement('div');
    this.element.className = 'spec';
    this.element.innerHTML = `\
<div class='spec-toggle'></div>
<div outlet='description' class='description'></div>
<div outlet='specFailures' class='spec-failures'></div>\
`;
    this.description = this.element.querySelector('[outlet="description"]');
    this.specFailures = this.element.querySelector('[outlet="specFailures"]');

    this.element.classList.add(`spec-view-${this.spec.id}`);

    let {
      description
    } = this.spec;
    if (description.indexOf('it ') !== 0) { description = `it ${description}`; }
    this.description.textContent = description;

    for (let result of Array.from(this.spec.results().getItems())) {
      if (!result.passed()) {
        const stackTrace = formatStackTrace(this.spec, result.message, result.trace.stack);

        const resultElement = document.createElement('div');
        resultElement.className = 'result-message fail';
        resultElement.textContent = result.message;
        this.specFailures.appendChild(resultElement);

        if (stackTrace) {
          const traceElement = document.createElement('pre');
          traceElement.className = 'stack-trace padded';
          traceElement.textContent = stackTrace;
          this.specFailures.appendChild(traceElement);
        }
      }
    }
  }

  attach() {
    return this.parentSuiteView().appendChild(this.element);
  }

  parentSuiteView() {
    let suiteViewElement;
    if (!(suiteViewElement = document.querySelector(`#suite-view-${this.spec.suite.id}`))) {
      const suiteView = new SuiteResultView(this.spec.suite);
      suiteView.attach();
      suiteViewElement = suiteView.element;
    }

    return suiteViewElement;
  }
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
