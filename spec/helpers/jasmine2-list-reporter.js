
function pluralize(count, str) {
  let noun = count === 1 ? str : `${str}s`;
  return `${count} ${noun}`;
}

function repeat(thing, times) {
  var arr = [];
  for (var i = 0; i < times; i++) {
    arr.push(thing);
  }
  return arr;
}

function indent(str, spaces) {
  var lines = (str || '').split('\n');
  var newArr = [];
  for (var i = 0; i < lines.length; i++) {
    newArr.push(repeat(' ', spaces).join('') + lines[i]);
  }
  return newArr.join('\n');
}

const NOOP_TIMER = {
  start: () => {},
  elapsed: () => 0
};

const ansi = {
  green: '\x1B[32m',
  red: '\x1B[31m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  none: '\x1B[0m'
};

class ConsoleReporter {

  constructor({
    print,
    showColors = true,
    onComplete = () => {},
    timer = NOOP_TIMER
  }) {
    this.print = print;
    this.showColors = showColors;
    this.onComplete = onComplete;
    this.timer = timer;

    this.failedSpecs = [];
    this.failedSuites = [];
  }

  jasmineStarted() {
    this.specCount = 0;
    this.failureCount = 0;
    this.pendingCount = 0;

    this.print('Starting tests…\n');
    this.timer.start();
  }

  jasmineDone() {
    this.print('\n');
    for (let i = 0; i < this.failedSpecs.length; i++) {
      this.specFailureDetails(this.failedSpecs[i]);
    }

    if (this.specCount > 0) {
      this.print('\n');
      let specCounts = ` ${pluralize(this.specCount, 'spec')}, ${pluralize(this.failureCount, 'failure')}`;
      if (this.pendingCount) {
        specCounts = `${specCounts}, ${pluralize(this.pendingCount, 'pending spec')}`
      }
      this.print(specCounts);
    } else {
      this.print('No specs found');
    }

    this.print('\n');
    let seconds = this.timer.elapsed() / 1000;
    this.print(`Finished in ${pluralize(seconds, 'second')}`);
    this.print('\n');

    for (let i = 0; i < this.failedSuites.length; i++) {
      this.suiteFailureDetails(this.failedSuites[i]);
    }

    this.onComplete(this.failureCount === 0);
  }

  colored(color, str) {
    return this.showColors ? (ansi[color] + str + ansi.none) : str;
  }

  specFailureDetails(result) {
    this.print(`\n`);
    this.print(result.fullName);

    for (var i = 0; i < result.failedExpectations.length; i++) {
      var failedExpectation = result.failedExpectations[i];
      this.print('\n');
      this.print(indent(failedExpectation.message, 2));
      this.print(indent(failedExpectation.stack, 2));
    }

    this.print('\n');
  }

  suiteFailureDetails(result) {
    for (let i = 0; i < result.failedExpectations.length; i++) {
      this.print('\n');
      this.print(this.colored('red', 'An error was thrown in an afterall'));
      this.print('\n');
      this.print(this.colored('red', `AfterAll ${result.failedExpectations[i].message}`));
    }
    this.print('\n');
  }

  specDone(result) {
    this.specCount++;
    if (result.status === 'disabled') {
      // Skipped test.
      return;
    }
    this.print(`${result.fullName} `);
    switch (result.status) {
      case 'pending':
        this.pendingCount++;
        this.print(this.colored('yellow', '[pending]'));
        break;
      case 'passed':
        this.print(this.colored('blue', '[pass]'));
        break;
      case 'failed':
        this.failureCount++;
        this.failedSpecs.push(result);
        this.print(this.colored('red', '[FAIL]'));
        break;
      default:
        this.print(`STATUS IS: ${result.status}`)
    }
    this.print('\n');
  }

  suiteDone(result) {
    if ((result.failedExpectations?.length ?? 0) > 0) {
      this.failureCount++;
      this.failedSuites.push(result);
    }
  }
}

module.exports = ConsoleReporter;
