# Originally from lee-dohm/bug-report

CommandLogger = require '../lib/command-logger'

describe 'CommandLogger', ->
  [element, logger] = []

  dispatch = (command) ->
    atom.commands.dispatch(element, command)

  beforeEach ->
    element = document.createElement("section")
    element.id = "some-id"
    element.className = "some-class another-class"
    logger = new CommandLogger
    logger.start()

  describe 'logging of commands', ->
    it 'catches the name of the command', ->
      dispatch('foo:bar')
      expect(logger.latestEvent().name).toBe 'foo:bar'

    it 'catches the target of the command', ->
      dispatch('foo:bar')
      expect(logger.latestEvent().targetNodeName).toBe "SECTION"
      expect(logger.latestEvent().targetClassName).toBe "some-class another-class"
      expect(logger.latestEvent().targetId).toBe "some-id"

    it 'logs repeat commands as one command', ->
      dispatch('foo:bar')
      dispatch('foo:bar')

      expect(logger.latestEvent().name).toBe 'foo:bar'
      expect(logger.latestEvent().count).toBe 2

    it 'ignores show.bs.tooltip commands', ->
      dispatch('show.bs.tooltip')

      expect(logger.latestEvent().name).not.toBe 'show.bs.tooltip'

    it 'ignores editor:display-updated commands', ->
      dispatch('editor:display-updated')

      expect(logger.latestEvent().name).not.toBe 'editor:display-updated'

    it 'ignores mousewheel commands', ->
      dispatch('mousewheel')

      expect(logger.latestEvent().name).not.toBe 'mousewheel'

    it 'only logs up to `logSize` commands', ->
      dispatch(char) for char in ['a'..'z']

      expect(logger.eventLog.length).toBe(logger.logSize)

  describe 'formatting of text log', ->
    it 'does not output empty log items', ->
      expect(logger.getText()).toBe """
        ```
        ```
      """

    it 'formats commands with the time, name and target', ->
      dispatch('foo:bar')

      expect(logger.getText()).toBe """
        ```
             -0:00.0 foo:bar (section#some-id.some-class.another-class)
        ```
      """

    it 'omits the target ID if it has none', ->
      element.id = ""

      dispatch('foo:bar')

      expect(logger.getText()).toBe """
        ```
             -0:00.0 foo:bar (section.some-class.another-class)
        ```
      """

    it 'formats commands in chronological order', ->
      dispatch('foo:first')
      dispatch('foo:second')
      dispatch('foo:third')

      expect(logger.getText()).toBe """
        ```
             -0:00.0 foo:first (section#some-id.some-class.another-class)
             -0:00.0 foo:second (section#some-id.some-class.another-class)
             -0:00.0 foo:third (section#some-id.some-class.another-class)
        ```
      """

    it 'displays a multiplier for repeated commands', ->
      dispatch('foo:bar')
      dispatch('foo:bar')

      expect(logger.getText()).toBe """
        ```
          2x -0:00.0 foo:bar (section#some-id.some-class.another-class)
        ```
      """

    it 'logs the external data event as the last event', ->
      dispatch('foo:bar')
      event =
        time: Date.now()
        title: 'bummer'

      expect(logger.getText(event)).toBe """
        ```
             -0:00.0 foo:bar (section#some-id.some-class.another-class)
             -0:00.0 bummer
        ```
      """

    it 'does not report anything older than ten minutes', ->
      logger.logCommand
        type: 'foo:bar'
        time: Date.now() - 11 * 60 * 1000
        target: nodeName: 'DIV'

      logger.logCommand
        type: 'wow:bummer'
        target: nodeName: 'DIV'

      expect(logger.getText()).toBe """
        ```
             -0:00.0 wow:bummer (div)
        ```
      """

    it 'does not report commands that have no name', ->
      dispatch('')

      expect(logger.getText()).toBe """
        ```
        ```
      """
