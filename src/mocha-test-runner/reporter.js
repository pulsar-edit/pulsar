const diffElements = require('diff');
const { ipcRenderer } = require('electron');

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
        const panel = document.createElement('atom-panel')
        panel.style.border = '1px solid'
        panel.classList.add('inset-panel', 'padded')
        const div = document.createElement('div')
        div.classList.add('badge', 'badge-success', 'padded');
        div.innerText = test.fullTitle()
        panel.appendChild(div)
        divs[divs.length - 1].appendChild(panel)
      })

      .on(EVENT_TEST_FAIL, (test, err) => {
        const panel = createElem('atom-panel', "", {classes: ['inset-panel', 'padded']})
        panel.style.border = '1px solid'
        const button = createElem('button', test.fullTitle(), {
          classes: ['btn', 'btn-error', 'inline-block-tight'],
          parent: panel
        })

        const details = createElem('atom-panel', "", {
          classes: ['inset-panel', 'padded'], parent: panel
        })
        button.onclick = (evt) => {
          evt.preventDefault()
          details.style.display = details.style.display === 'none' ? 'block' : 'none'
        }
        createElem('div', err.message, { classes: ['text-error'], parent: details})

        if(err.expected && err.actual) {
          createElem('div', "DIFF:", {parent: details})
          const diff = createElem('div', '', {
            classes: ['inset-panel', 'padded', 'block'],
            parent: details
          })

          diffElements.diffJson(err.expected, err.actual).forEach(patch => {
            const test = createElem('div', patch.value, {parent: diff})
            test.style['white-space'] = 'pre'
            if(patch.added) {
              test.classList.add('status-added')
            } else if(patch.removed) {
              test.classList.add('status-removed')
            } else {
              test.classList.add('status-ignored')
            }
          })
        }
        const stackTrace = createElem('div', '', {
          classes: ['block', 'padded'],
          parent: details
        })
        stackTrace.style.display = 'flex';
        stackTrace.style['flex-direction'] = 'column';
        err.rawStack.forEach(stack => {
          const row = `${stack.getFileName()}:${stack.getLineNumber()}:${stack.getColumnNumber()}`
          const a = createElem('a', row, {
            classes: ['inline-block', 'text-warning'],
            parent: stackTrace
          })
          a.onclick = (e) => {
            e.preventDefault()
            e.stopPropagation()
            ipcRenderer.send('open', {pathsToOpen: [{
                pathToOpen: stack.getFileName(),
                initialLine: stack.getLineNumber() - 1,
                initialColumn: stack.getColumnNumber() - 1
              }]
            })
          };
        })
        divs[divs.length - 1].appendChild(panel)
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

function createElem(element, text, opts) {
  const {classes, parent} = opts || {}
  const elem = document.createElement(element)
  elem.innerText = text
  if(classes) elem.classList.add(...classes)
  if(parent) parent.appendChild(elem)
  return elem
}
