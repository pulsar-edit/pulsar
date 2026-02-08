const SelectListView = require('pulsar-select-list')
const {humanizeKeystroke} = require('underscore-plus')

const { highlightMatches, getMatchIndices } = SelectListView

module.exports =
class CommandPaletteView {
  constructor() {
    this.keyBindingsForActiveElement = []
    this.selectList = new SelectListView({
      className: 'command-palette',
      items: [],
      filter: this.filter,
      emptyMessage: atom.i18n.t("command-palette.commandPaletteView.emptyMessage"),
      elementForItem: (item, {selected}) => {
        const li = document.createElement('li')
        li.classList.add('event', 'two-lines')
        li.dataset.eventName = item.name

        const rightBlock = document.createElement('div')
        rightBlock.classList.add('pull-right')

        this.keyBindingsForActiveElement
        .filter(({command}) => command === item.name)
        .forEach(keyBinding => {
          const kbd = document.createElement('kbd')
          kbd.classList.add('key-binding')
          kbd.textContent = humanizeKeystroke(keyBinding.keystrokes)
          rightBlock.appendChild(kbd)
        })
        li.appendChild(rightBlock)

        const leftBlock = document.createElement('div')
        const titleEl = document.createElement('div')
        titleEl.classList.add('primary-line')
        titleEl.title = item.name
        leftBlock.appendChild(titleEl)

        const query = this.selectList.getQuery()
        this.highlightMatchesInElement(item.displayName, query, titleEl)

        if (selected) {
          let secondaryEl = document.createElement('div')
          secondaryEl.classList.add('secondary-line')
          secondaryEl.style.display = 'flex'

          if (typeof item.description === 'string') {
            secondaryEl.appendChild(this.createDescription(item.description, query))
          }

          if (Array.isArray(item.tags)) {
            const matchingTags = item.tags
              .map(t => [t, atom.ui.fuzzyMatcher.score(t, query)])
              .filter(([, s]) => s > 0)
              .sort((a, b) => a.s - b.s)
              .map(([t]) => t)

            if (matchingTags.length > 0) {
              secondaryEl.appendChild(this.createTags(matchingTags, query))
            }
          }

          leftBlock.appendChild(secondaryEl)
        }

        li.appendChild(leftBlock)
        return li
      },
      didConfirmSelection: (keyBinding) => {
        this.hide()
        const event = new CustomEvent(keyBinding.name, {bubbles: true, cancelable: true})
        this.activeElement.dispatchEvent(event)
      },
      didCancelSelection: () => {
        this.hide()
      }
    })
  }

  async destroy() {
    await this.selectList.destroy()
  }

  toggle() {
    if (this.selectList.isVisible()) {
      this.hide()
      return Promise.resolve()
    } else {
      return this.show()
    }
  }

  async show(showHiddenCommands = false) {
    if (!this.preserveLastSearch) {
      this.selectList.reset()
    }

    this.activeElement = (document.activeElement === document.body) ? atom.views.getView(atom.workspace) : document.activeElement
    this.keyBindingsForActiveElement = atom.keymaps.findKeyBindings({target: this.activeElement})
    const commandsForActiveElement = atom.commands
        .findCommands({target: this.activeElement})
        .filter(command => showHiddenCommands === !!command.hiddenInCommandPalette)
    commandsForActiveElement.sort((a, b) => a.displayName.localeCompare(b.displayName))
    await this.selectList.update({items: commandsForActiveElement})

    this.selectList.show()
  }

  hide() {
    this.selectList.hide()
  }

  async update(props) {
    if (Object.prototype.hasOwnProperty.call(props, 'preserveLastSearch')) {
      this.preserveLastSearch = props.preserveLastSearch
    }
  }

  highlightMatchesInElement(text, query, el) {
    const indices = getMatchIndices(text, query)
    el.appendChild(highlightMatches(text, indices))
  }

  filter = (items, query) => {
    if (query.length === 0) {
      return items
    }

    const scoredItems = []
    for (const item of items) {
      let score = atom.ui.fuzzyMatcher.score(item.displayName, query)
      if (item.tags) {
        score += item.tags.reduce(
          (currentScore, tag) => currentScore + atom.ui.fuzzyMatcher.score(tag, query),
          0
        )
      }
      if (item.description) {
        score += atom.ui.fuzzyMatcher.score(item.description, query)
      }

      if (score > 0) {
        scoredItems.push({item, score})
      }
    }
    scoredItems.sort((a, b) => b.score - a.score)
    return scoredItems.map((i) => i.item)
  }

  createDescription(description, query) {
    const descriptionEl = document.createElement('div')

    // in case of overflow, give full contents on long hover
    descriptionEl.title = description

    Object.assign(descriptionEl.style, {
      flexGrow: 1,
      flexShrink: 1,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    })
    this.highlightMatchesInElement(description, query, descriptionEl)
    return descriptionEl
  }

  createTag(tagText, query) {
    const tagEl = document.createElement('li')
    Object.assign(tagEl.style, {
      borderBottom: 0,
      display: 'inline',
      padding: 0
    })
    this.highlightMatchesInElement(tagText, query, tagEl)
    return tagEl
  }

  createTags(matchingTags, query) {
    const tagsEl = document.createElement('ol')
    Object.assign(tagsEl.style, {
      display: 'inline',
      marginLeft: '4px',
      flexShrink: 0,
      padding: 0
    })

    const introEl = document.createElement('strong')
    introEl.textContent = atom.i18n.t("command-palette.commandPaletteView.matchingTags");

    tagsEl.appendChild(introEl)
    matchingTags.map(t => this.createTag(t, query)).forEach((tagEl, i) => {
      tagsEl.appendChild(tagEl)
      if (i < matchingTags.length - 1) {
        const commaSpace = document.createElement('span')
        commaSpace.textContent = ', '
        tagsEl.appendChild(commaSpace)
      }
    })
    return tagsEl
  }
}
