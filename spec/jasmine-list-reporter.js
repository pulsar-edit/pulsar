const { TerminalReporter } = require('jasmine-tagged');

class JasmineListReporter extends TerminalReporter {
  fullDescription(spec) {
    return getFullDescription(spec, true);
  }

  reportSpecStarting(spec) {
    this.print_(this.fullDescription(spec) + ' ');
  }

  reportSpecResults(spec) {
    const result = spec.results();
    if (result.skipped) {
      return;
    }

    let msg = '';
    if (result.passed()) {
      msg = "\u001b[34m[pass]\u001b[0m";
    } else {
      msg = "\u001b[1m\u001b[31m[FAIL]\u001b[0m";

      this.flatFailures ||= [];
      this.flatFailures.push(getFullDescription(spec, false))

      this.addFailureToFailures_(spec);
    }
    this.printLine_(msg);
  }

  reportFailures_(spec) {
    super.reportFailures_(spec);

    if(this.flatFailures && this.flatFailures.length > 0) {
      this.printLine_("\n\nALL TESTS THAT FAILED:")
      for(let failure of this.flatFailures) {
        this.printLine_(failure)
      }
    }
  }
}

function getFullDescription(spec, tokens) {
  let fullDescription = spec.description;
  if(tokens) fullDescription = `it ${fullDescription}`;

  let currentSuite = spec.suite;
  while (currentSuite) {
    if(tokens) {
      fullDescription = `${currentSuite.description} > ${fullDescription}`;
    } else {
      fullDescription = `${currentSuite.description} ${fullDescription}`;
    }
    currentSuite = currentSuite.parentSuite;
  }
  return fullDescription;
}

module.exports = { JasmineListReporter, getFullDescription };
