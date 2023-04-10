/** @babel */

import {CompositeDisposable} from 'atom'
import CommandPaletteView from './command-palette-view'

class CommandPalettePackage {
  activate () {
    this.commandPaletteView = new CommandPaletteView()
    this.disposables = new CompositeDisposable()
    this.disposables.add(atom.commands.add('atom-workspace', {
      'command-palette:toggle': () => {
        this.commandPaletteView.toggle()
      },
      'command-palette:show-hidden-commands': () => {
        this.commandPaletteView.show(true)
      }
    }))
    this.disposables.add(atom.config.observe('command-palette.useAlternateScoring', (newValue) => {
      this.commandPaletteView.update({useAlternateScoring: newValue})
    }))
    this.disposables.add(atom.config.observe('command-palette.preserveLastSearch', (newValue) => {
      this.commandPaletteView.update({preserveLastSearch: newValue})
    }))
    return this.commandPaletteView.show()
  }

  async deactivate () {
    this.disposables.dispose()
    await this.commandPaletteView.destroy()
  }
}

const pack = new CommandPalettePackage()
export default pack
