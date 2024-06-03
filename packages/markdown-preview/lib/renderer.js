const { TextEditor } = require('atom')
const path = require('path')
const createDOMPurify = require('dompurify')
const emoji = require('emoji-images')
const fs = require('fs-plus')
let marked = null // Defer until used
let renderer = null
let cheerio = null
let yamlFrontMatter = null

const { scopeForFenceName } = require('./extension-helper')
const { resourcePath } = atom.getLoadSettings()
const packagePath = path.dirname(__dirname)

const emojiFolder = path.join(
  path.dirname(require.resolve('emoji-images')),
  'pngs'
)

// Creating `TextEditor` instances is costly, so we'll try to re-use instances
// when a preview changes.
class EditorCache {
  static BY_ID = new Map()

  static findOrCreateById(id) {
    let cache = EditorCache.BY_ID.get(id)
    if (!cache) {
      cache = new EditorCache(id)
      EditorCache.BY_ID.set(id, cache)
    }
    return cache
  }

  constructor(id) {
    this.id = id
    this.editorsByPre = new Map()
    this.possiblyUnusedEditors = new Set()
  }

  destroy() {
    let editors = Array.from(this.editorsByPre.values())
    for (let editor of editors) {
      editor.destroy()
    }
    this.editorsByPre.clear()
    this.possiblyUnusedEditors.clear()
    EditorCache.BY_ID.delete(this.id)
  }

  // Called when we start a render. Every `TextEditor` is assumed to be stale,
  // but any editor that is successfully looked up from the cache during this
  // render is saved from culling.
  beginRender() {
    this.possiblyUnusedEditors.clear()
    for (let editor of this.editorsByPre.values()) {
      this.possiblyUnusedEditors.add(editor)
    }
  }

  // Cache an editor by the PRE element that it's standing in for.
  addEditor(pre, editor) {
    this.editorsByPre.set(pre, editor)
  }

  getEditor(pre) {
    let editor = this.editorsByPre.get(pre)
    if (editor) {
      // Cache hit! This editor will be reused, so we should prevent it from
      // getting culled.
      this.possiblyUnusedEditors.delete(editor)
    }
    return editor
  }

  endRender() {
    // Any editor that didn't get claimed during the render is orphaned and
    // should be disposed of.
    let toBeDeleted = new Set()
    for (let [pre, editor] of this.editorsByPre.entries()) {
      if (!this.possiblyUnusedEditors.has(editor)) continue
      toBeDeleted.add(pre)
    }

    this.possiblyUnusedEditors.clear()

    for (let pre of toBeDeleted) {
      let editor = this.editorsByPre.get(pre)
      let element = editor.getElement()
      if (element.parentNode) {
        element.remove()
      }
      this.editorsByPre.delete(pre)
      editor.destroy()
    }
  }
}

exports.EditorCache = EditorCache

function chooseRender(text, filePath) {
  if (atom.config.get("markdown-preview.useOriginalParser")) {
    // Legacy rendering with `marked`.
    return render(text, filePath)
  } else {
    // Built-in rendering with `markdown-it`.
    let html = atom.ui.markdown.render(text, {
      renderMode: "fragment",
      filePath: filePath,
      breaks: atom.config.get('markdown-preview.breakOnSingleNewline'),
      useDefaultEmoji: true,
      sanitizeAllowUnknownProtocols: atom.config.get('markdown-preview.allowUnsafeProtocols')
    })
    return atom.ui.markdown.convertToDOM(html)
  }
}

exports.toDOMFragment = async function (text, filePath, grammar, editorId) {
  text ??= ""
  let defaultLanguage = getDefaultLanguageForGrammar(grammar)

  // We cache editor instances in this code path because it's the one used by
  // the preview pane, so we expect it to be updated quite frequently.
  let cache = EditorCache.findOrCreateById(editorId)
  cache.beginRender()

  const domFragment = chooseRender(text, filePath)
  annotatePreElements(domFragment, defaultLanguage)

  return [
    domFragment,
    async (element) => {
      await highlightCodeBlocks(element, grammar, cache, makeAtomEditorNonInteractive)
      cache.endRender()
    }
  ]
}

exports.toHTML = async function (text, filePath, grammar) {
  text ??= "";

  // We don't cache editor instances in this code path because it's the one
  // used by the “Copy HTML” command, so this is likely to be a one-off for
  // which caches won't help.

  const domFragment = chooseRender(text, filePath)
  const div = document.createElement('div')
  annotatePreElements(domFragment, getDefaultLanguageForGrammar(grammar))
  div.appendChild(domFragment)
  document.body.appendChild(div)

  await highlightCodeBlocks(div, grammar, null, convertAtomEditorToStandardElement)

  const result = div.innerHTML;
  div.remove();

  return result;
}

// Render with the package's own `marked` library.
function render(text, filePath) {
  if (marked == null || yamlFrontMatter == null || cheerio == null) {
    marked = require('marked')
    yamlFrontMatter = require('yaml-front-matter')
    cheerio = require('cheerio')

    renderer = new marked.Renderer()
    renderer.listitem = function (text, isTask) {
      const listAttributes = isTask ? ' class="task-list-item"' : ''

      return `<li ${listAttributes}>${text}</li>\n`
    }
  }

  marked.setOptions({
    breaks: atom.config.get('markdown-preview.breakOnSingleNewline'),
    renderer
  })

  const { __content, ...vars } = yamlFrontMatter.loadFront(text)

  let html = marked.parse(renderYamlTable(vars) + __content)

  // emoji-images is too aggressive, so replace images in monospace tags with
  // the actual emoji text.
  const $ = cheerio.load(emoji(html, emojiFolder, 20))
  $('pre img').each((_index, element) =>
    $(element).replaceWith($(element).attr('title'))
  )
  $('code img').each((_index, element) =>
    $(element).replaceWith($(element).attr('title'))
  )

  html = $.html()

  html = createDOMPurify().sanitize(html, {
    ALLOW_UNKNOWN_PROTOCOLS: atom.config.get(
      'markdown-preview.allowUnsafeProtocols'
    )
  })

  const template = document.createElement('template')
  template.innerHTML = html.trim()
  const fragment = template.content.cloneNode(true)

  resolveImagePaths(fragment, filePath)

  return fragment
}

function renderYamlTable(variables) {
  const entries = Object.entries(variables)

  if (!entries.length) {
    return ''
  }

  const markdownRows = [
    entries.map(entry => entry[0]),
    entries.map(_ => '--'),
    entries.map((entry) => {
      if (typeof entry[1] === "object" && !Array.isArray(entry[1])) {
        // Remove all newlines, or they ruin formatting of parent table
        return marked.parse(renderYamlTable(entry[1])).replace(/\n/g,"");
      } else {
        return entry[1];
      }
    })
  ]

  return (
    markdownRows.map(row => '| ' + row.join(' | ') + ' |').join('\n') + '\n'
  )
}

function resolveImagePaths(element, filePath) {
  const [rootDirectory] = atom.project.relativizePath(filePath)

  const result = []
  for (const img of element.querySelectorAll('img')) {
    // We use the raw attribute instead of the .src property because the value
    // of the property seems to be transformed in some cases.
    let src

    if ((src = img.getAttribute('src'))) {
      if (src.match(/^(https?|atom):\/\//)) {
        continue
      }
      if (src.startsWith(process.resourcesPath)) {
        continue
      }
      if (src.startsWith(resourcePath)) {
        continue
      }
      if (src.startsWith(packagePath)) {
        continue
      }

      if (src[0] === '/') {
        if (!fs.isFileSync(src)) {
          if (rootDirectory) {
            result.push((img.src = path.join(rootDirectory, src.substring(1))))
          } else {
            result.push(undefined)
          }
        } else {
          result.push(undefined)
        }
      } else {
        result.push((img.src = path.resolve(path.dirname(filePath), src)))
      }
    } else {
      result.push(undefined)
    }
  }

  return result
}

function getDefaultLanguageForGrammar(grammar) {
  return grammar?.scopeName === 'source.litcoffee' ? 'coffee' : 'text'
}

function annotatePreElements(fragment, defaultLanguage) {
  for (let preElement of fragment.querySelectorAll('pre')) {
    const codeBlock = preElement.firstElementChild ?? preElement
    const className = codeBlock.getAttribute('class')
    const fenceName = className?.replace(/^language-/, '') ?? defaultLanguage
    preElement.classList.add('editor-colors', `lang-${fenceName}`)
  }
}

function reassignEditorToLanguage(editor, languageScope) {
  // When we successfully reassign the language on an editor, its
  // `data-grammar` attribute updates on its own.
  let result = atom.grammars.assignLanguageMode(editor, languageScope)
  if (result) return true

  // When we fail to assign the language on an editor — maybe its package is
  // deactivated — it won't reset itself to the default grammar, so we have to
  // do it ourselves.
  result = atom.grammars.assignLanguageMode(editor, `text.plain.null-grammar`)
  if (!result) return false
}

// After render, create an `atom-text-editor` for each `pre` element so that we
// enjoy syntax highlighting.
function highlightCodeBlocks(element, grammar, cache, editorCallback) {
  let defaultLanguage = getDefaultLanguageForGrammar(grammar)

  const promises = []

  for (const preElement of element.querySelectorAll('pre')) {
    const codeBlock = preElement.firstElementChild ?? preElement
    const className = codeBlock.getAttribute('class')
    const fenceName = className?.replace(/^language-/, '') ?? defaultLanguage
    let editorText = codeBlock.textContent.replace(/\r?\n$/, '')

    // If this PRE element was present in the last render, then we should
    // already have a cached text editor available for use.
    let editor = cache?.getEditor(preElement) ?? null
    let editorElement
    if (!editor) {
      editor = new TextEditor({ keyboardInputEnabled: false })
      editorElement = editor.getElement()
      editor.setReadOnly(true)
      cache?.addEditor(preElement, editor)
    } else {
      editorElement = editor.getElement()
    }

    // If the PRE changed its content, we need to change the content of its
    // `TextEditor`.
    if (editor.getText() !== editorText) {
      editor.setReadOnly(false)
      editor.setText(editorText)
      editor.setReadOnly(true)
    }

    // If the PRE changed its language, we need to change the language of its
    // `TextEditor`.
    let scopeDescriptor = editor.getRootScopeDescriptor()[0]
    let languageScope = scopeForFenceName(fenceName)
    if (languageScope !== scopeDescriptor && `.${languageScope}` !== scopeDescriptor) {
      reassignEditorToLanguage(editor, languageScope)
    }

    // If the editor is brand new, we'll have to insert it; otherwise it should
    // already be in the right place.
    if (!editorElement.parentNode) {
      preElement.parentNode.insertBefore(editorElement, preElement)
      editor.setVisible(true)
    }

    promises.push(editorCallback(editorElement, preElement))
  }
  return Promise.all(promises)
}

function makeAtomEditorNonInteractive(editorElement) {
  editorElement.setAttributeNode(document.createAttribute('gutter-hidden'))
  editorElement.removeAttribute('tabindex')

  // Remove line decorations from code blocks.
  for (const cursorLineDecoration of editorElement.getModel()
    .cursorLineDecorations) {
    cursorLineDecoration.destroy()
  }
}

function convertAtomEditorToStandardElement(editorElement, preElement) {
  return new Promise(function (resolve) {
    const editor = editorElement.getModel()
    // In this code path, we're transplanting the highlighted editor HTML into
    // the existing `pre` element, so we should empty its contents first.
    preElement.innerHTML = ''
    const done = () =>
      editor.component.getNextUpdatePromise().then(function () {
        for (const line of editorElement.querySelectorAll(
          '.line:not(.dummy)'
        )) {
          const line2 = document.createElement('div')
          line2.className = 'line'
          line2.innerHTML = line.firstChild.innerHTML
          preElement.appendChild(line2)
        }
        editorElement.remove()
        resolve()
      })
    const languageMode = editor.getBuffer().getLanguageMode()
    if (languageMode.fullyTokenized || languageMode.tree) {
      done()
    } else {
      editor.onDidTokenize(done)
    }
  })
}
