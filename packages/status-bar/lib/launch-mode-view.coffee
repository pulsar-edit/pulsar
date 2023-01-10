module.exports =
class LaunchModeView
  constructor: ({safeMode, devMode}={}) ->
    @element = document.createElement('status-bar-launch-mode')
    @element.classList.add('inline-block', 'icon', 'icon-color-mode')
    if devMode
      @element.classList.add('text-error')
      @tooltipDisposable = atom.tooltips.add(@element, title: 'This window is in dev mode')
    else if safeMode
      @element.classList.add('text-success')
      @tooltipDisposable = atom.tooltips.add(@element, title: 'This window is in safe mode')

  detachedCallback: ->
    @tooltipDisposable?.dispose()
