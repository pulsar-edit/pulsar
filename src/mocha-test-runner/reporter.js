const diffElements = require('diff');

class Reporter {
  static setMocha(Mocha) {
    this.constants = Mocha.Runner.constants;
  }

  constructor(runner) {
    // this._indents = 0;
    const stats = runner.stats;

    const {
      EVENT_RUN_BEGIN,
      EVENT_RUN_END,
      EVENT_TEST_FAIL,
      EVENT_TEST_PASS,
      EVENT_SUITE_BEGIN,
      EVENT_SUITE_END
    } = Reporter.constants;
    let divs = []
    const testDiv = document.querySelector('div.tests')

    runner
      .once(EVENT_RUN_BEGIN, () => {
        console.log('start');
      })
      .on(EVENT_SUITE_BEGIN, evt => {
        const header = document.createElement(`h${divs.length + 1}`)
        header.innerText = evt.title
        testDiv.appendChild(header)
        const div = document.createElement('div')
        divs.push(div)
        testDiv.appendChild(div)
      })
      .on(EVENT_SUITE_END, (a) => {
        divs.pop()
        // this.decreaseIndent();
        // console.log("End", a)
      })
      .on(EVENT_TEST_PASS, test => {
        // Test#fullTitle() returns the suite name(s)
        // prepended to the test title
        const div = document.createElement('div')
        div.classList.add('badge', 'badge-success');
        div.innerText = test.fullTitle()
        divs[divs.length - 1].appendChild(div)
      })

      .on(EVENT_TEST_FAIL, (test, err) => {
        const div = document.createElement('div')
        div.classList.add('badge', 'badge-error');
        div.innerText = test.fullTitle()
        // console.log("ERROR", arguments, test, err)

        const diff = document.createElement('div')
        diff.classList.add('inset-panel', 'padded', 'block')
        diffElements.diffJson(err.expected, err.actual).forEach(patch => {
          // const span = document.createElement('span')
          const test = document.createElement('div')
          test.style['white-space'] = 'pre'
          if(patch.added) {
            // span.classList.add('inline-block', 'status-added', 'icon', 'icon-diff-added')
            test.classList.add('status-added')
          } else if(patch.removed) {
            // span.classList.add('inline-block', 'status-removed', 'icon', 'icon-diff-removed')
            test.classList.add('status-removed')
          } else {
            // span.classList.add('inline-block', 'status-ignored', 'icon', 'icon-diff-ignored')
            test.classList.add('status-ignored')
          }
          // test.appendChild(span)
          test.append(patch.value)
          diff.appendChild(test)
        })
        divs[divs.length - 1].appendChild(div)
        divs[divs.length - 1].appendChild(diff)
      })
      .once(EVENT_RUN_END, () => {
        console.log(`end: ${stats.passes}/${stats.passes + stats.failures} ok`);
      });
  }

  indent() {
    return Array(this._indents).join('  ');
  }

  increaseIndent() {
    this._indents++;
  }

  decreaseIndent() {
    this._indents--;
  }
}

module.exports = Reporter;
