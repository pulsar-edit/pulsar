const {Point, CompositeDisposable} = require('atom')
const fs = require('fs')

const path = require('path')
const SelectListView = require('atom-select-list')

const {repositoryForPath} = require('./helpers')
const getIconServices = require('./get-icon-services')

const MAX_RESULTS = 10

module.exports = class FuzzyFinderView {
  constructor (metricsReporter) {
    this.previousQueryWasLineJump = false
    this.items = []
    this.metricsReporter = metricsReporter
    this.filterFn = this.filterFn.bind(this)

    this.selectListView = new SelectListView({
      items: this.items,
      maxResults: MAX_RESULTS,
      emptyMessage: this.getEmptyMessage(),
      filterKeyForItem: (item) => item.label,
      filterQuery: (query) => {
        const colon = query.indexOf(':')
        if (colon !== -1) {
          query = query.slice(0, colon)
        }
        // Normalize to backslashes on Windows
        if (process.platform === 'win32') {
          query = query.replace(/\//g, '\\')
        }

        return query
      },
      didCancelSelection: () => { this.cancel() },
      didConfirmSelection: (item) => {
        this.confirm(item, {searchAllPanes: atom.config.get('fuzzy-finder.searchAllPanes')})
      },
      didConfirmEmptySelection: () => {
        this.confirm()
      },
      didChangeQuery: () => {
        if (this.iconDisposables) {
          this.iconDisposables.dispose()
          this.iconDisposables = null
        }
        const isLineJump = this.isQueryALineJump()
        if (isLineJump) {
          this.previousQueryWasLineJump = true
          const query = this.selectListView.getQuery()
          let emptyMessage = null
          let errorMessage = null
          if (/^:\d+:\d*\D/.test(query)) {
            errorMessage = 'Invalid column number'
          } else if (/^:\d+:/.test(query)) {
            emptyMessage = 'Jump to line and column in active editor'
          } else if (/^:\d*\D/.test(query)) {
            errorMessage = 'Invalid line number'
          } else {
            emptyMessage = 'Jump to line in active editor'
          }

          this.selectListView.update({
            items: [],
            emptyMessage: emptyMessage,
            errorMessage: errorMessage
          })
        } else if (this.previousQueryWasLineJump) {
          this.previousQueryWasLineJump = false
          this.selectListView.update({
            items: this.items,
            emptyMessage: this.getEmptyMessage(),
            errorMessage: null
          })
        }
      },
      elementForItem: ({filePath, label, ownerGitHubUsername}) => {
        const filterQuery = this.selectListView.getFilterQuery()

        atom.ui.fuzzyMatcher.setCandidates(
          this.nativeFuzzyForResults, [label]
        );
        const items = this.nativeFuzzyForResults.match(
          filterQuery,
          {maxResults: 1, recordMatchIndexes: true, algorithm: 'command-t'}
        )
        const matches = items.length ? items[0].matchIndexes : []
        const repository = repositoryForPath(filePath)

        return new FuzzyFinderItem({
          filePath,
          label,
          ownerGitHubUsername,
          filterQuery,
          matches,
          repository
        }).element
      }
    })
    this.selectListView.element.classList.add('fuzzy-finder')

    const splitLeft = () => { this.splitOpenPath((pane) => pane.splitLeft.bind(pane)) }
    const splitRight = () => { this.splitOpenPath((pane) => pane.splitRight.bind(pane)) }
    const splitUp = () => { this.splitOpenPath((pane) => pane.splitUp.bind(pane)) }
    const splitDown = () => { this.splitOpenPath((pane) => pane.splitDown.bind(pane)) }
    atom.commands.add(this.selectListView.element, {
      'pane:split-left': splitLeft,
      'pane:split-left-and-copy-active-item': splitLeft,
      'pane:split-left-and-move-active-item': splitLeft,
      'pane:split-right': splitRight,
      'pane:split-right-and-copy-active-item': splitRight,
      'pane:split-right-and-move-active-item': splitRight,
      'pane:split-up': splitUp,
      'pane:split-up-and-copy-active-item': splitUp,
      'pane:split-up-and-move-active-item': splitUp,
      'pane:split-down': splitDown,
      'pane:split-down-and-copy-active-item': splitDown,
      'pane:split-down-and-move-active-item': splitDown,
      'fuzzy-finder:invert-confirm': () => {
        this.confirm(
          this.selectListView.getSelectedItem(),
          {searchAllPanes: !atom.config.get('fuzzy-finder.searchAllPanes')}
        )
      }
    })

    if (!this.nativeFuzzy) {
      this.nativeFuzzy = atom.ui.fuzzyMatcher.setCandidates(
        this.items.map(el => el.label)
      );
      // We need a separate instance of the fuzzy finder to calculate the
      // matched paths only for the returned results. This speeds up considerably
      // the filtering of items.
      this.nativeFuzzyForResults = atom.ui.fuzzyMatcher.setCandidates([]);
    }
    this.selectListView.update({ filter: this.filterFn })
  }

  get element () {
    return this.selectListView.element
  }

  destroy () {
    if (this.panel) {
      this.panel.destroy()
    }

    return this.selectListView.destroy()
  }

  cancel () {
    if (atom.config.get('fuzzy-finder.preserveLastSearch')) {
      this.selectListView.refs.queryEditor.selectAll()
    } else {
      this.selectListView.reset()
    }

    this.hide()
  }

  confirm ({uri} = {}, openOptions) {
    if (atom.workspace.getActiveTextEditor() && this.isQueryALineJump()) {
      const caretPosition = this.getCaretPosition()
      this.cancel()
      this.moveToCaretPosition(caretPosition)
    } else if (!uri) {
      this.cancel()
    } else if (fs.lstatSync(uri).isDirectory()) {
      this.selectListView.update({errorMessage: 'Selected path is a directory'})
      setTimeout(() => { this.selectListView.update({errorMessage: null}) }, 2000)
    } else {
      const caretPosition = this.getCaretPosition()
      this.cancel()
      this.openURI(uri, caretPosition, openOptions)
    }
  }

  getEditorSelection () {
    const editor = atom.workspace.getActiveTextEditor()
    if (!editor) {
      return
    }
    const selectedText = editor.getSelectedText()
    if (/\n/m.test(selectedText)) {
      return
    }
    return selectedText
  }

  prefillQueryFromSelection () {
    const selectedText = this.getEditorSelection()
    if (selectedText) {
      this.selectListView.refs.queryEditor.setText(selectedText)
      const textLength = selectedText.length
      this.selectListView.refs.queryEditor.setSelectedBufferRange([[0, 0], [0, textLength]])
    }
  }

  show () {
    this.previouslyFocusedElement = document.activeElement
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({item: this})
    }
    this.panel.show()
    if (atom.config.get('fuzzy-finder.prefillFromSelection') === true) {
      this.prefillQueryFromSelection()
    }
    this.selectListView.focus()
  }

  hide () {
    if (this.panel) {
      this.panel.hide()
    }

    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
      this.previouslyFocusedElement = null
    }
  }

  async openURI (uri, caretPosition, openOptions) {
    if (uri) {
      await atom.workspace.open(uri, openOptions)
      this.moveToCaretPosition(caretPosition)
    }
  }

  moveToCaretPosition (caretPosition) {
    const editor = atom.workspace.getActiveTextEditor()
    if (editor && caretPosition.row >= 0) {
      editor.unfoldBufferRow(caretPosition.row)
      editor.setCursorBufferPosition(caretPosition)
      if (caretPosition.column === -1) {
        editor.moveToFirstCharacterOfLine()
      }

      editor.scrollToBufferPosition(caretPosition, {center: true})
    }
  }

  splitOpenPath (splitFn) {
    const {uri} = this.selectListView.getSelectedItem() || {}
    const caretPosition = this.getCaretPosition()
    const editor = atom.workspace.getActiveTextEditor()
    const activePane = atom.workspace.getActivePane()

    if (this.isQueryALineJump() && editor) {
      this.previouslyFocusedElement = null
      splitFn(activePane)({copyActiveItem: true})
      this.moveToCaretPosition(caretPosition)
    } else if (!uri) {
      return // eslint-disable-line no-useless-return
    } else if (activePane) {
      this.previouslyFocusedElement = null
      splitFn(activePane)()
      this.openURI(uri, caretPosition)
    } else {
      this.previouslyFocusedElement = null
      this.openURI(uri, caretPosition)
    }
  }

  isQueryALineJump () {
    return (
      this.selectListView.getFilterQuery().trim() === '' &&
      this.selectListView.getQuery().includes(':')
    )
  }

  getCaretPosition () {
    const query = this.selectListView.getQuery()
    const firstColon = query.indexOf(':')
    const secondColon = query.indexOf(':', firstColon + 1)
    let position = new Point(-1, -1)

    if (firstColon !== -1) {
      if (secondColon !== -1) {
        position.row = parseInt(query.slice(firstColon + 1, secondColon)) - 1
        const column = parseInt(query.slice(secondColon + 1))
        position.column = isNaN(column) ? -1 : column
      } else {
        position.row = parseInt(query.slice(firstColon + 1)) - 1
      }
    }

    return position
  }

  setItems (items) {
    this.items = items
    atom.ui.fuzzyMatcher.setCandidates(
      this.nativeFuzzy,
      this.items.map(item => item.label)
    );

    if (this.isQueryALineJump()) {
      this.selectListView.update({
        items: [],
        infoMessage: null,
        loadingMessage: null,
        loadingBadge: null
      })
    } else {
      this.selectListView.update({
        items: this.items,
        infoMessage: null,
        loadingMessage: null,
        loadingBadge: null
      })
    }
  }

  projectRelativePathsForFilePaths (filePaths) {
    // Don't regenerate project relative paths unless the file paths have changed
    if (filePaths !== this.filePaths) {
      this.filePaths = filePaths
      this.projectRelativePaths = this.filePaths.map(
        (filePath) => this.convertPathToSelectViewObject(filePath)
      )
    }

    return this.projectRelativePaths
  }

  convertPathToSelectViewObject (filePath) {
    const projectHasMultipleDirectories = atom.project.getDirectories().length > 1

    const [rootPath, projectRelativePath] = atom.project.relativizePath(filePath)
    const label =
      rootPath && projectHasMultipleDirectories
        ? path.join(path.basename(rootPath), projectRelativePath)
        : projectRelativePath

    return {uri: filePath, filePath, label}
  }

  filterFn(items, query) {
    if (!query) return items
    return this.nativeFuzzy.match(query, {maxResults: MAX_RESULTS, algorithm: 'command-t'})
      .map(({id}) => this.items[id])
  }
}

function highlight (path, matches, offsetIndex) {
  let lastIndex = 0
  let matchedChars = []
  const fragment = document.createDocumentFragment()
  for (let matchIndex of matches) {
    matchIndex -= offsetIndex
    // If marking up the basename, omit path matches
    if (matchIndex < 0) {
      continue
    }
    const unmatched = path.substring(lastIndex, matchIndex)
    if (unmatched) {
      if (matchedChars.length > 0) {
        const span = document.createElement('span')
        span.classList.add('character-match')
        span.textContent = matchedChars.join('')
        fragment.appendChild(span)
        matchedChars = []
      }

      fragment.appendChild(document.createTextNode(unmatched))
    }

    matchedChars.push(path[matchIndex])
    lastIndex = matchIndex + 1
  }

  if (matchedChars.length > 0) {
    const span = document.createElement('span')
    span.classList.add('character-match')
    span.textContent = matchedChars.join('')
    fragment.appendChild(span)
  }

  // Remaining characters are plain text
  fragment.appendChild(document.createTextNode(path.substring(lastIndex)))
  return fragment
}

class FuzzyFinderItem {
  constructor ({filePath, label, ownerGitHubUsername, filterQuery, matches, repository}) {
    this.filePath = filePath
    this.label = label
    this.element = document.createElement('li')
    this.element.className = 'FuzzyFinderResult'

    if (repository) {
      const status = repository.getCachedPathStatus(filePath)
      if (repository.isStatusNew(status)) {
        const div = document.createElement('div')
        div.classList.add('status', 'status-added', 'icon', 'icon-diff-added')
        this.element.appendChild(div)
      } else if (repository.isStatusModified(status)) {
        const div = document.createElement('div')
        div.classList.add('status', 'status-modified', 'icon', 'icon-diff-modified')
        this.element.appendChild(div)
      }
    }

    const fileBasename = path.basename(filePath)
    const baseOffset = label.length - fileBasename.length
    this.primaryLine = document.createElement('div')
    this.primaryLine.dataset.name = fileBasename
    this.primaryLine.dataset.path = label
    this.primaryLine.classList.add('primary-line', 'file', 'icon')
    this.primaryLine.appendChild(highlight(fileBasename, matches, baseOffset))
    this.element.appendChild(this.primaryLine)

    this.secondaryLine = document.createElement('div')
    this.secondaryLine.classList.add('secondary-line', 'path', 'no-icon')
    this.secondaryLine.appendChild(highlight(label, matches, 0))
    this.element.appendChild(this.secondaryLine)

    if (ownerGitHubUsername) {
      this.element.classList.add('has-avatar')
      const avatarElement = document.createElement('img')
      avatarElement.className = 'FuzzyFinderResult-avatar'
      avatarElement.src = `https://avatars.githubusercontent.com/${ownerGitHubUsername}?size=56`
      this.element.appendChild(avatarElement)
    }

    getIconServices().updateIcon(this)
  }
}
