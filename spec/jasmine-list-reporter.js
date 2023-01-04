const { TerminalReporter } = require('jasmine-tagged');

class JasmineListReporter extends TerminalReporter {
  fullDescription(spec) {
    let fullDescription = 'it ' + spec.description;
    let currentSuite = spec.suite;
    while (currentSuite) {
      fullDescription = currentSuite.description + ' > ' + fullDescription;
      currentSuite = currentSuite.parentSuite;
    }
    return fullDescription;
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

      for(let result of spec.results_.items_) {
        if(!result.passed_) {
          this.flatFailures.push(result)
        }
      }

      this.addFailureToFailures_(spec);
    }
    this.printLine_(msg);
  }

  reportFailures_(spec) {
    this.printLine_("\n\nALL FILES THAT FAILED:")
    for(let failure of this.flatFailures) {
      const onlyFile = failure.filteredStackTrace.replace(/.*\((.*)\).*/, '$1')
      this.printLine_(onlyFile)
    }
  }
}

module.exports = { JasmineListReporter };
