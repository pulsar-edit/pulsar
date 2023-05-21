/** @babel */
/** @jsx etch.dom */

import SelectListView from 'atom-select-list'
import etch from 'etch'
import dedent from 'dedent'
import CodeBlock from './code-block'

export default class ExampleSelectListView {
  constructor () {
    this.jsExampleCode = dedent`
    import SelectListView from 'atom-select-list'

    const selectListView = new SelectListView({
      items: ['one', 'two', 'three'],
      elementForItem: (item) => {
        const li = document.createElement('li')
        li.textContent = item
        return li
      },
      didConfirmSelection: (item) => {
        console.log('confirmed', item)
      },
      didCancelSelection: () => {
        console.log('cancelled')
      }
    })
    `
    etch.initialize(this)
  }

  elementForItem (item) {
    const li = document.createElement('li')
    li.textContent = item
    return li
  }

  didConfirmSelection (item) {
    console.log('confirmed', item)
  }

  didCancelSelection () {
    console.log('cancelled')
  }

  render () {
    return (
      <div className='example'>
        <div className='example-rendered'>
          <atom-panel className='modal'>
            <SelectListView
              items={['one', 'two', 'three']}
              elementForItem={this.elementForItem.bind(this)}
              onDidConfirmSelection={this.didConfirmSelection.bind(this)}
              onDidCancelSelection={this.didCancelSelection.bind(this)} />
          </atom-panel>
        </div>
        <div className='example-code show-example-space-pen'>
          <CodeBlock cssClass='example-space-pen' grammarScopeName='source.js' code={this.jsExampleCode} />
        </div>
      </div>
    )
  }

  update () {

  }
}
