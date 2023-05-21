{TextEditor, CompositeDisposable, Disposable, Emitter, Range, Point} = require 'atom'
path = require 'path'
{getFullExtension} = require "./helpers"

module.exports =
class Dialog
  constructor: ({initialPath, select, iconClass, prompt} = {}) ->
    @emitter = new Emitter()
    @disposables = new CompositeDisposable()

    @element = document.createElement('div')
    @element.classList.add('tree-view-dialog')

    @promptText = document.createElement('label')
    @promptText.classList.add('icon')
    @promptText.classList.add(iconClass) if iconClass
    @promptText.textContent = prompt
    @element.appendChild(@promptText)

    @miniEditor = new TextEditor({mini: true})
    blurHandler = =>
      @close() if document.hasFocus()
    @miniEditor.element.addEventListener('blur', blurHandler)
    @disposables.add(new Disposable(=> @miniEditor.element.removeEventListener('blur', blurHandler)))
    @disposables.add(@miniEditor.onDidChange => @showError())
    @element.appendChild(@miniEditor.element)

    @errorMessage = document.createElement('div')
    @errorMessage.classList.add('error-message')
    @element.appendChild(@errorMessage)

    atom.commands.add @element,
      'core:confirm': => @onConfirm(@miniEditor.getText())
      'core:cancel': => @cancel()

    @miniEditor.setText(initialPath)

    if select
      extension = getFullExtension(initialPath)
      baseName = path.basename(initialPath)
      selectionStart = initialPath.length - baseName.length
      if baseName is extension
        selectionEnd = initialPath.length
      else
        selectionEnd = initialPath.length - extension.length
      @miniEditor.setSelectedBufferRange(Range(Point(0, selectionStart), Point(0, selectionEnd)))

  attach: ->
    @panel = atom.workspace.addModalPanel(item: this)
    @miniEditor.element.focus()
    @miniEditor.scrollToCursorPosition()

  close: ->
    panel = @panel
    @panel = null
    panel?.destroy()
    @emitter.dispose()
    @disposables.dispose()
    @miniEditor.destroy()
    activePane = atom.workspace.getCenter().getActivePane()
    activePane.activate() unless activePane.isDestroyed()

  cancel: ->
    @close()
    document.querySelector('.tree-view')?.focus()

  showError: (message='') ->
    @errorMessage.textContent = message
    if message
      @element.classList.add('error')
      window.setTimeout((=> @element.classList.remove('error')), 300)
