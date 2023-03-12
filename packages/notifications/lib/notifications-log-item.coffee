{Emitter, CompositeDisposable, Disposable} = require 'atom'
moment = require 'moment'

module.exports = class NotificationsLogItem
  subscriptions: null
  timestampInterval: null

  constructor: (@notification) ->
    @emitter = new Emitter
    @subscriptions = new CompositeDisposable
    @render()

  render: ->
    notificationView = atom.views.getView(@notification)
    notificationElement = @renderNotification(notificationView)

    @timestamp = document.createElement('div')
    @timestamp.classList.add('timestamp')
    @notification.moment = moment(@notification.getTimestamp())
    @subscriptions.add atom.tooltips.add(@timestamp, title: @notification.moment.format("ll LTS"))
    @updateTimestamp()
    @timestampInterval = setInterval(@updateTimestamp.bind(this), 60 * 1000)
    @subscriptions.add new Disposable => clearInterval @timestampInterval

    @element = document.createElement('li')
    @element.classList.add('notifications-log-item', @notification.getType())
    @element.appendChild(notificationElement)
    @element.appendChild(@timestamp)
    @element.addEventListener 'click', (e) =>
      unless e.target.closest('.btn-toolbar a, .btn-toolbar button')?
        @emitter.emit 'click'

    @element.getRenderPromise = -> notificationView.getRenderPromise()
    if @notification.getType() is 'fatal'
      notificationView.getRenderPromise().then =>
        @element.replaceChild(@renderNotification(notificationView), notificationElement)

    @subscriptions.add new Disposable => @element.remove()

  renderNotification: (view) ->
    message = document.createElement('div')
    message.classList.add('message')
    message.innerHTML = view.element.querySelector(".content > .message").innerHTML

    buttons = document.createElement('div')
    buttons.classList.add('btn-toolbar')
    nButtons = view.element.querySelector(".content > .meta > .btn-toolbar")
    if nButtons?
      for button in nButtons.children
        logButton = button.cloneNode(true)
        logButton.originalButton = button
        logButton.addEventListener 'click', (e) ->
          newEvent = new MouseEvent('click', e)
          e.target.originalButton.dispatchEvent(newEvent)
        for tooltip in atom.tooltips.findTooltips button
          @subscriptions.add atom.tooltips.add(logButton, tooltip.options)
        buttons.appendChild(logButton)

    nElement = document.createElement('div')
    nElement.classList.add('notifications-log-notification', 'icon', "icon-#{@notification.getIcon()}", @notification.getType())
    nElement.appendChild(message)
    nElement.appendChild(buttons)
    nElement

  getElement: -> @element

  destroy: ->
    @subscriptions.dispose()
    @emitter.emit 'did-destroy'

  onClick: (callback) ->
    @emitter.on 'click', callback

  onDidDestroy: (callback) ->
    @emitter.on 'did-destroy', callback

  updateTimestamp: ->
    @timestamp.textContent = @notification.moment.fromNow()
