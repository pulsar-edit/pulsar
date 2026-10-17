const path = require('path');
const process = require('process');
const listen = require('../../src/delegated-listener');
const ipcHelpers = require('../../src/ipc-helpers');

function formatStackTrace(spec, message = '', stackTrace) {
  if (!stackTrace) { return stackTrace; }

  // at ... (.../jasmine.js:1:2)
  const jasminePattern = /^\s*at\s+.*\(?.*[/\\]jasmine(-[^/\\]*)?\.js:\d+:\d+\)?\s*$/;
  // at jasmine.Something... (.../jasmine.js:1:2)
  const firstJasmineLinePattern = /^\s*at\s+jasmine\.[A-Z][^\s]*\s+\(?.*[/\\]jasmine(-[^/\\]*)?\.js:\d+:\d+\)?\s*$/;
  let lines = [];
  for (let line of stackTrace.split('\n')) {
    if (firstJasmineLinePattern.test(line)) { break; }
    if (!jasminePattern.test(line)) { lines.push(line); }
  }

  // Remove first line of stack when it is the same as the error message
  const errorMatch = lines[0]?.match(/^Error: (.*)/);
  if (message.trim() === errorMatch?.[1]?.trim()) { lines.shift(); }

  lines = lines.map(function (line) {
    // Only format actual stacktrace lines
    if (/^\s*at\s/.test(line)) {
      // Needs to occur before path relativization
      if ((process.platform === 'win32') && /file:\/\/\//.test(line)) {
        // file:///C:/some/file -> C:\some\file
        line = line
          .replace('file:///', '')
          .replace(new RegExp(`${path.posix.sep}`, 'g'), path.win32.sep);
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
}

// Spec objects in the reporter lifecycle don't have all the metadata we need.
// We'll store the full objects in this map, then look them up as needed by ID.
const REGISTRY = new Map();

class AtomReporter {
  constructor() {
    this.startedAt = null;
    this.runningSpecCount = 0;
    this.completeSpecCount = 0;
    this.passedCount = 0;
    this.failedCount = 0;
    this.skippedCount = 0;
    this.totalSpecCount = 0;
    this.deprecationCount = 0;
    this.timeoutId = 0;
    this.element = document.createElement('div');
    this.element.classList.add('spec-reporter-container');
    this.element.innerHTML = `\
<div class="spec-reporter">
<div class="padded pull-right">
  <button outlet="reloadButton" class="btn btn-small reload-button">Reload Specs</button>
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

  jasmineStarted(_suiteInfo) {
    let topSuite = jasmine.getEnv().topSuite();
    topSuite._isTopSuite = true;
    this.specs = this.getSpecs(topSuite);

    this.handleEvents();
    this.startedAt = Date.now();
    this.totalSpecCount = Object.keys(this.specs).length;

    // Create summary dots for each test.
    for (let spec of Object.values(this.specs)) {
      const symbol = document.createElement('li');
      symbol.setAttribute('id', `spec-summary-${spec.id}`);
      symbol.setAttribute('title', this.specTitle(spec));
      symbol.className = "spec-summary pending";
      this.userSummary.appendChild(symbol);
    }

    document.body.appendChild(this.element);
  }

  getSpecs(suite, specs = {}) {
    for (const child of suite.children) {
      if (child.children) {
        specs = this.getSpecs(child, specs);
      } else {
        REGISTRY.set(child.id, child);
        child.suite = suite;
        child.suites = this.specSuites(child, suite);
        child.title = this.specTitle(child);
        specs[child.id] = child;
      }
    }
    return specs;
  }

  specSuites(spec, parentSuite) {
    const suites = [];
    spec.suite ??= parentSuite;

    let { suite } = spec;
    while (suite.parentSuite) {
      suites.unshift({
        id: suite.id,
        description: suite.result.description
      });
      suite = suite.parentSuite;
    }
    return suites;
  }

  suiteStarted(_result) {}

  specStarted(_spec) {
    this.runningSpecCount++;
  }

  jasmineDone() {
    this.updateSpecCounts();
    if (this.failedCount === 0) {
      this.status.classList.add('alert-success');
      this.status.classList.remove('alert-info');
    }

    if (this.failedCount === 1) {
      this.message.textContent = `${this.failedCount} failure`;
    } else {
      this.message.textContent = `${this.failedCount} failures`;
    }
  }

  handleEvents() {
    listen(document, 'click', '.spec-toggle', function (event) {
      const specFailures = event.currentTarget.parentElement.querySelector('.spec-failures');

      if (specFailures.style.display === 'none') {
        specFailures.style.display = '';
        event.currentTarget.classList.remove('folded');
      } else {
        specFailures.style.display = 'none';
        event.currentTarget.classList.add('folded');
      }

      event.preventDefault();
    });

    listen(document, 'click', '.deprecation-list', function (event) {
      const deprecationList = event.currentTarget.parentElement.querySelector('.deprecation-list');

      if (deprecationList.style.display === 'none') {
        deprecationList.style.display = '';
        event.currentTarget.classList.remove('folded');
      } else {
        deprecationList.style.display = 'none';
        event.currentTarget.classList.add('folded');
      }

      event.preventDefault();
    });

    listen(document, 'click', '.stack-trace', event => event.currentTarget.classList.toggle('expanded'));

    this.reloadButton.addEventListener('click', () => ipcHelpers.call('window-method', 'reload'));
  }

  updateSpecCounts() {
    let specCount;
    if (this.skippedCount) {
      specCount = `${this.completeSpecCount - this.skippedCount}/${this.totalSpecCount - this.skippedCount} (${this.skippedCount} skipped)`;
    } else {
      specCount = `${this.completeSpecCount}/${this.totalSpecCount}`;
    }
    this.specCount.textContent = specCount;
  }

  updateStatusView(spec) {
    if (this.failedCount > 0) {
      this.status.classList.add('alert-danger');
      this.status.classList.remove('alert-info');
    }
    let fullSpec = REGISTRY.get(spec.id);

    this.updateSpecCounts();

    let rootSuite = fullSpec.suite;
    while (rootSuite.parentSuite) {
      if (rootSuite.parentSuite._isTopSuite) break;
      rootSuite = rootSuite.parentSuite;
    }
    this.message.textContent = rootSuite.description;

    let time = `${Math.round((spec.endedAt - this.startedAt) / 10)}`;
    if (time.length < 3) { time = `0${time}`; }
    this.time.textContent = `${time.slice(0, -2)}.${time.slice(-2)}s`;
  }

  specTitle(spec) {
    const parentDescs = [];
    let s = spec.suite;
    while (s && !s._isTopSuite) {
      parentDescs.unshift(s.description);
      s = s.parentSuite;
    }

    let suiteString = "";
    let indent = "";
    for (let desc of parentDescs) {
      suiteString += indent + desc + "\n";
      indent += "  ";
    }

    return `${suiteString} ${indent} it ${spec.description}`;
  }

  suiteDone(_suite) {}

  specDone(spec) {
    const specSummaryElement = document.getElementById(`spec-summary-${spec.id}`);
    if (!specSummaryElement) {
      console.warn(`Does not exist:`, spec.id);
      return;
    }
    specSummaryElement.classList.remove('pending');
    switch (spec.status) {
      case 'disabled':
        specSummaryElement.classList.add('skipped');
        this.skippedCount++;
        break;
      case 'failed': {
        specSummaryElement.classList.add('failed');
        const specView = new SpecResultView(spec);
        specView.attach();
        this.failedCount++;
        break;
      }
      case 'passed':
        specSummaryElement.classList.add('passed');
        this.passedCount++;
        break;
      default:
      // no-op
    }

    this.completeSpecCount++;
    spec.endedAt = Date.now();
    if (spec.status !== 'disabled') {
      this.updateStatusView(spec);
    }
  }
}

module.exports = AtomReporter;

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
    (this.parentSuiteView() || document.querySelector('.results')).appendChild(this.element);
  }

  parentSuiteView() {
    let suiteViewElement;
    if (!this.suite.parentSuite || this.suite.parentSuite._isTopSuite) { return; }

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

    for (let result of this.spec.failedExpectations) {
      let stackTrace = formatStackTrace(this.spec, result.message, result.stack);
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

  attach() {
    this.parentSuiteView().appendChild(this.element);
  }

  parentSuiteView() {
    let suiteViewElement;
    let fullSpec = REGISTRY.get(this.spec.id)
    if (!(suiteViewElement = document.querySelector(`#suite-view-${fullSpec.suite.id}`))) {
      const suiteView = new SuiteResultView(fullSpec.suite);
      suiteView.attach();
      suiteViewElement = suiteView.element;
    }

    return suiteViewElement;
  }
}
