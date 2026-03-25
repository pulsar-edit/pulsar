const path = require('path')
const crypto = require('crypto')
const Replacer = require('./replacer')
const FLAGS = require('./simple-transformations')
const remote = require('@electron/remote')

function resolveClipboard () {
  return atom.clipboard.read()
}

function makeDateResolver (dateParams) {
  // TODO: I do not know if this method ever returns anything other than
  // 'en-us'; I suspect it does not. But this is likely the forward-compatible
  // way of doing things.
  //
  // On the other hand, if the output of CURRENT_* variables _did_ vary based
  // on locale, we'd probably need to implement a setting to force an arbitrary
  // locale. I imagine lots of people use their native language for their OS's
  // locale but write code in English.
  //
  let locale = remote.app.getLocale()
  return () => new Date().toLocaleString(locale, dateParams)
}

const RESOLVERS = {
  // All the TM_-prefixed variables are part of the LSP specification for
  // snippets.
  'TM_SELECTED_TEXT' ({editor, selectionRange, method}) {
    // When a snippet is inserted via tab trigger, the trigger is
    // programmatically selected prior to snippet expansion so that it is
    // consumed when the snippet body is inserted. The trigger _should not_ be
    // treated as selected text. There is no way for $TM_SELECTED_TEXT to
    // contain anything when a snippet is invoked via tab trigger.
    if (method === 'prefix') return ''

    if (!selectionRange || selectionRange.isEmpty()) return ''
    return editor.getTextInBufferRange(selectionRange)
  },
  'TM_CURRENT_LINE' ({editor, cursor}) {
    return editor.lineTextForBufferRow(cursor.getBufferRow())
  },
  'TM_CURRENT_WORD' ({editor, cursor}) {
    return editor.getTextInBufferRange(cursor.getCurrentWordBufferRange())
  },
  'TM_LINE_INDEX' ({cursor}) {
    return `${cursor.getBufferRow()}`
  },
  'TM_LINE_NUMBER' ({cursor}) {
    return `${cursor.getBufferRow() + 1}`
  },
  'TM_FILENAME' ({editor}) {
    return editor.getTitle()
  },
  'TM_FILENAME_BASE' ({editor}) {
    let fileName = editor.getTitle()
    if (!fileName) { return undefined }

    const index = fileName.lastIndexOf('.')
    if (index >= 0) {
      return fileName.slice(0, index)
    }
    return fileName
  },
  'TM_FILEPATH' ({editor}) {
    return editor.getPath()
  },
  'TM_DIRECTORY' ({editor}) {
    const filePath = editor.getPath()
    if (filePath === undefined) return undefined
    return path.dirname(filePath)
  },

  // VSCode supports these.
  'CLIPBOARD': resolveClipboard,

  'CURRENT_YEAR':             makeDateResolver({year: 'numeric'}),
  'CURRENT_YEAR_SHORT':       makeDateResolver({year: '2-digit'}),
  'CURRENT_MONTH':            makeDateResolver({month: '2-digit'}),
  'CURRENT_MONTH_NAME':       makeDateResolver({month: 'long'}),
  'CURRENT_MONTH_NAME_SHORT': makeDateResolver({month: 'short'}),
  'CURRENT_DATE':             makeDateResolver({day: '2-digit'}),
  'CURRENT_DAY_NAME':         makeDateResolver({weekday: 'long'}),
  'CURRENT_DAY_NAME_SHORT':   makeDateResolver({weekday: 'short'}),
  'CURRENT_HOUR':             makeDateResolver({hour12: false, hour: '2-digit'}),
  'CURRENT_MINUTE':           makeDateResolver({minute: '2-digit'}),
  'CURRENT_SECOND':           makeDateResolver({second: '2-digit'}),
  'CURRENT_SECONDS_UNIX': () => {
    return Math.floor( Date.now() / 1000 )
  },

  // NOTE: "Ancestor project path" is determined as follows:
  //
  // * Get all project paths via `atom.project.getPaths()`.
  // * Return the first path (in the order we received) that is an ancestor of
  //   the current file in the editor.

  // The current file's path relative to the ancestor project path.
  'RELATIVE_FILEPATH' ({editor}) {
    let filePath = editor.getPath()
    let projectPaths = atom.project.getPaths()
    if (projectPaths.length === 0) { return filePath }
    // A project can have multiple path roots. Return whichever is the first
    // that is an ancestor of the file path.
    let ancestor = projectPaths.find(pp => {
      return filePath.startsWith(`${pp}${path.sep}`)
    })
    if (!ancestor) return {filePath}

    return filePath.substring(ancestor.length)
  },

  // Last path component of the ancestor project path.
  'WORKSPACE_NAME' ({editor}) {
    let projectPaths = atom.project.getPaths()
    if (projectPaths.length === 0) { return '' }
    let filePath = editor.getPath()
    let ancestor = projectPaths.find(pp => {
      return filePath.startsWith(`${pp}${path.sep}`)
    })

    return path.basename(ancestor)
  },

  // The full path to the ancestor project path.
  'WORKSPACE_FOLDER' ({editor}) {
    let projectPaths = atom.project.getPaths()
    if (projectPaths.length === 0) { return '' }
    let filePath = editor.getPath()
    let ancestor = projectPaths.find(pp => {
      return filePath.startsWith(`${pp}${path.sep}`)
    })

    return ancestor
  },

  'CURSOR_INDEX' ({editor, cursor}) {
    let cursors = editor.getCursors()
    let index = cursors.indexOf(cursor)
    return index >= 0 ? String(index) : ''
  },

  'CURSOR_NUMBER' ({editor, cursor}) {
    let cursors = editor.getCursors()
    let index = cursors.indexOf(cursor)
    return index >= 0 ? String(index + 1) : ''
  },

  'RANDOM' () {
    return Math.random().toString().slice(-6)
  },

  'RANDOM_HEX' () {
    return Math.random().toString(16).slice(-6)
  },

  'BLOCK_COMMENT_START' ({editor, cursor}) {
    let delimiters = editor.getCommentDelimitersForBufferPosition(
      cursor.getBufferPosition()
    )
    return (delimiters?.block?.[0] ?? '').trim()
  },

  'BLOCK_COMMENT_END' ({editor, cursor}) {
    let delimiters = editor.getCommentDelimitersForBufferPosition(
      cursor.getBufferPosition()
    )
    return (delimiters?.block?.[1] ?? '').trim()
  },

  'LINE_COMMENT' ({editor, cursor}) {
    let delimiters = editor.getCommentDelimitersForBufferPosition(
      cursor.getBufferPosition()
    )
    return (delimiters?.line ?? '').trim()
  }

  // TODO: VSCode also supports:
  //
  // UUID
  //
  // (can be done without dependencies once we use Node >= 14.17.0 or >=
  // 15.6.0; see below)
  //
}

// $UUID will be easy to implement once Pulsar runs a newer version of Node, so
// there's no reason not to be proactive and sniff for the function we need.
if (('randomUUID' in crypto) && (typeof crypto.randomUUID === 'function')) {
  RESOLVERS['UUID'] = () => {
    return crypto.randomUUID({disableEntropyCache: true})
  }
}


function replaceByFlag (text, flag) {
  let replacer = FLAGS[flag]
  if (!replacer) { return text }
  return replacer(text)
}

class Variable {
  constructor ({point, snippet, variable: name, substitution}) {
    Object.assign(this, {point, snippet, name, substitution})
  }

  resolve (params) {
    let base = ''
    if (this.name in RESOLVERS) {
      base = RESOLVERS[this.name](params)
    }

    if (!this.substitution) {
      return base
    }

    let {flag, find, replace} = this.substitution

    // Two kinds of substitution.
    if (flag) {
      // This is the kind with the trailing `:/upcase`, `:/downcase`, etc.
      return replaceByFlag(base, flag)
    } else if (find && replace) {
      // This is the more complex sed-style substitution.
      let {find, replace} = this.substitution
      this.replacer ??= new Replacer(replace)
      return base.replace(find, (...args) => {
        return this.replacer.replace(...args)
      })
    } else {
      return base
    }
  }
}

module.exports = Variable
