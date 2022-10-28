class TestItem
  getUri: -> "test"

exports.activate = ->
  core.workspace.addOpener -> new TestItem
