DefaultFileIcons = require '../lib/default-file-icons'
getIconServices = require '../lib/get-icon-services'
{Disposable} = require 'atom'

describe 'IconServices', ->
  afterEach ->
    getIconServices().resetFileIcons()
    getIconServices().resetElementIcons()

  describe 'FileIcons', ->
    it 'provides a default', ->
      expect(getIconServices().fileIcons).toBeDefined()
      expect(getIconServices().fileIcons).toBe(DefaultFileIcons)

    it 'allows the default to be overridden', ->
      service = new Object
      getIconServices().setFileIcons service
      expect(getIconServices().fileIcons).toBe(service)

    it 'allows the service to be reset to the default easily', ->
      service = new Object
      getIconServices().setFileIcons service
      getIconServices().resetFileIcons()
      expect(getIconServices().fileIcons).toBe(DefaultFileIcons)

  describe 'ElementIcons', ->
    it 'does not provide a default', ->
      expect(getIconServices().elementIcons).toBe(null)

    it 'consumes the ElementIcons service', ->
      service = ->
      getIconServices().setElementIcons service
      expect(getIconServices().elementIcons).toBe(service)

    it 'does not call the FileIcons service when the ElementIcons service is provided', ->
      elementIcons = ->
        new Disposable ->
      fileIcons =
        iconClassForPath: ->
      spyOn(fileIcons, 'iconClassForPath').andCallThrough()
      getIconServices().setElementIcons elementIcons
      getIconServices().setFileIcons fileIcons
      getIconServices().updateFileIcon(file: {}, fileName: classList: add: ->)
      expect(fileIcons.iconClassForPath).not.toHaveBeenCalled()
