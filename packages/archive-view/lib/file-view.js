/** @babel */

import {CompositeDisposable, Disposable} from 'atom'
import path from 'path'
import fs from 'fs'
import temp from 'temp'
import archive from 'ls-archive'

import getIconServices from './get-icon-services'

export default class FileView {
  constructor (parentView, indexInParentView, archivePath, entry) {
    this.disposables = new CompositeDisposable()
    this.parentView = parentView
    this.indexInParentView = indexInParentView
    this.archivePath = archivePath
    this.entry = entry

    this.element = document.createElement('li')
    this.element.classList.add('list-item', 'entry')
    this.element.tabIndex = -1

    this.name = document.createElement('span')
    getIconServices().updateFileIcon(this)
    this.name.textContent = this.entry.getName()
    this.element.appendChild(this.name)

    const clickHandler = () => {
      this.select()
      this.openFile()
    }
    this.element.addEventListener('click', clickHandler)
    this.disposables.add(new Disposable(() => { this.element.removeEventListener('click', clickHandler) }))

    this.disposables.add(atom.commands.add(this.element, {
      'core:confirm': () => {
        if (this.isSelected()) {
          this.openFile()
        }
      },

      'core:move-down': () => {
        if (this.isSelected()) {
          this.parentView.selectFileAfterIndex(this.indexInParentView)
        }
      },

      'core:move-up': () => {
        if (this.isSelected()) {
          this.parentView.selectFileBeforeIndex(this.indexInParentView)
        }
      }
    }))
  }

  destroy () {
    this.disposables.dispose()
    this.element.remove()
  }

  isSelected () {
    return this.element.classList.contains('selected')
  }

  logError (message, error) {
    console.error(message, error.stack != null ? error.stack : error)
  }

  openFile () {
    archive.readFile(this.archivePath, this.entry.getPath(), (error, contents) => {
      if (error != null) {
        this.logError(`Error reading: ${this.entry.getPath()} from ${this.archivePath}`, error)
      } else {
        temp.mkdir('atom-', (error, tempDirPath) => {
          if (error != null) {
            this.logError(`Error creating temp directory: ${tempDirPath}`, error)
          } else {
            const tempArchiveDirPath = path.join(tempDirPath, path.basename(this.archivePath))
            fs.mkdir(tempArchiveDirPath, {recursive:true}, error => {
              if (error != null) {
                this.logError(`Error creating archive directory ${tempArchiveDirPath}`, error)
              } else {
                const tempFilePath = path.join(tempArchiveDirPath, this.entry.getName())
                fs.writeFile(tempFilePath, contents, error => {
                  if (error != null) {
                    this.logError(`Error writing to ${tempFilePath}`, error)
                  } else {
                    atom.workspace.open(tempFilePath)
                  }
                })
              }
            })
          }
        })
      }
    })
  }

  select () {
    this.element.focus()

    const archiveEditorElement = this.element.closest('.archive-editor')
    // On initial tree creation, it is not possible for any entries to be selected
    // (The entries also haven't been added to the DOM yet)
    if (archiveEditorElement) {
      for (const selected of archiveEditorElement.querySelectorAll('.selected')) {
        selected.classList.remove('selected')
      }
    }
    this.element.classList.add('selected')
  }
}
