EditorPanel = require '../lib/editor-panel'

describe "EditorPanel", ->
  panel = null

  getValueForId = (id) ->
    element = panel.element.querySelector("##{id.replace(/\./g, '\\.')}")
    if element?.tagName is "INPUT"
      element.checked
    else if element?.tagName is "SELECT"
      element.value
    else if element?
      element.getModel().getText()
    else
      return

  setValueForId = (id, value) ->
    element = panel.element.querySelector("##{id.replace(/\./g, '\\.')}")
    if element.tagName is "INPUT"
      element.checked = value
      element.dispatchEvent(new Event('change', {bubbles: true}))
    else if element.tagName is "SELECT"
      element.value = value
      element.dispatchEvent(new Event('change', {bubbles: true}))
    else
      element.getModel().setText(value?.toString())
      window.advanceClock(10000) # wait for contents-modified to be triggered

  beforeEach ->
    atom.config.set('editor.boolean', true)
    atom.config.set('editor.string', 'hey')
    atom.config.set('editor.object', {boolean: true, int: 3, string: 'test'})
    atom.config.set('editor.simpleArray', ['a', 'b', 'c'])
    atom.config.set('editor.complexArray', ['a', 'b', {c: true}])

    atom.config.setSchema('', type: 'object')

    panel = new EditorPanel()

  it "automatically binds named fields to their corresponding config keys", ->
    expect(getValueForId('editor.boolean')).toBeTruthy()
    expect(getValueForId('editor.string')).toBe 'hey'
    expect(getValueForId('editor.object.boolean')).toBeTruthy()
    expect(getValueForId('editor.object.int')).toBe '3'
    expect(getValueForId('editor.object.string')).toBe 'test'

    atom.config.set('editor.boolean', false)
    atom.config.set('editor.string', 'hey again')
    atom.config.set('editor.object.boolean', false)
    atom.config.set('editor.object.int', 6)
    atom.config.set('editor.object.string', 'hi')

    expect(getValueForId('editor.boolean')).toBeFalsy()
    expect(getValueForId('editor.string')).toBe 'hey again'
    expect(getValueForId('editor.object.boolean')).toBeFalsy()
    expect(getValueForId('editor.object.int')).toBe '6'
    expect(getValueForId('editor.object.string')).toBe 'hi'

    setValueForId('editor.string', "oh hi")
    setValueForId('editor.boolean', true)
    setValueForId('editor.object.boolean', true)
    setValueForId('editor.object.int', 9)
    setValueForId('editor.object.string', 'yo')

    expect(atom.config.get('editor.boolean')).toBe true
    expect(atom.config.get('editor.string')).toBe 'oh hi'
    expect(atom.config.get('editor.object.boolean')).toBe true
    expect(atom.config.get('editor.object.int')).toBe 9
    expect(atom.config.get('editor.object.string')).toBe 'yo'

    setValueForId('editor.string', '')
    setValueForId('editor.object.int', '')
    setValueForId('editor.object.string', '')

    expect(atom.config.get('editor.string')).toBeUndefined()
    expect(atom.config.get('editor.object.int')).toBeUndefined()
    expect(atom.config.get('editor.object.string')).toBeUndefined()

  it "does not save the config value until it has been changed to a new value", ->
    observeHandler = jasmine.createSpy("observeHandler")
    atom.config.observe "editor.simpleArray", observeHandler
    observeHandler.reset()

    window.advanceClock(10000) # wait for contents-modified to be triggered
    expect(observeHandler).not.toHaveBeenCalled()

    setValueForId('editor.simpleArray', 2)
    expect(observeHandler).toHaveBeenCalled()
    observeHandler.reset()

    setValueForId('editor.simpleArray', 2)
    expect(observeHandler).not.toHaveBeenCalled()

  it "does not update the editor text unless the value it parses to changes", ->
    setValueForId('editor.simpleArray', "a, b,")
    expect(atom.config.get('editor.simpleArray')).toEqual ['a', 'b']
    expect(getValueForId('editor.simpleArray')).toBe 'a, b,'

  it "only adds editors for arrays when all the values in the array are strings", ->
    expect(getValueForId('editor.simpleArray')).toBe 'a, b, c'
    expect(getValueForId('editor.complexArray')).toBeUndefined()

    setValueForId('editor.simpleArray', 'a, d')

    expect(atom.config.get('editor.simpleArray')).toEqual ['a', 'd']
    expect(atom.config.get('editor.complexArray')).toEqual ['a', 'b', {c: true}]

  it "shows the package settings notes for core and editor settings", ->
    expect(panel.element.querySelector('#editor-settings-note')).toExist()
    expect(panel.element.querySelector('#editor-settings-note').textContent).toContain('Check language settings')
