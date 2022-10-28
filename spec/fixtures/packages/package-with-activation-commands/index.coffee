module.exports =
  activateCallCount: 0
  activationCommandCallCount: 0

  activate: ->
    @activateCallCount++

    core.commands.add 'atom-workspace', 'activation-command', =>
      @activationCommandCallCount++
