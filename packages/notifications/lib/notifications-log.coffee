{Emitter, CompositeDisposable, Disposable} = require 'atom'
NotificationsLogItem = require './notifications-log-item'

typeIcons =
  fatal: 'bug'
  error: 'flame'
  warning: 'alert'
  info: 'info'
  success: 'check'

module.exports = class NotificationsLog
  subscriptions: null
  logItems: []
  typesHidden:
    fatal: false
    error: false
    warning: false
    info: false
    success: false

  constructor: (@duplicateTimeDelay, typesHidden = null) ->
    @typesHidden = typesHidden if typesHidden?
    @emitter = new Emitter
    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.notifications.onDidClearNotifications => @clearLogItems()
    @render()
    @subscriptions.add new Disposable => @clearLogItems()

  render: ->
    @element = document.createElement('div')
    @element.classList.add('notifications-log')

    header = document.createElement('header')
    @element.appendChild(header)

    @list = document.createElement('ul')
    @list.classList.add('notifications-log-items')
    @element.appendChild(@list)

    for type, icon of typeIcons
      button = document.createElement('button')
      button.classList.add('notification-type', 'btn', 'icon', "icon-#{icon}", type)
      button.classList.toggle('show-type', not @typesHidden[type])
      @list.classList.toggle("hide-#{type}", @typesHidden[type])
      button.dataset.type = type
      button.addEventListener 'click', (e) => @toggleType(e.target.dataset.type)
      @subscriptions.add atom.tooltips.add(button, {title: "Toggle #{type} notifications"})
      header.appendChild(button)

    button = document.createElement('button')
    button.classList.add('notifications-clear-log', 'btn', 'icon', 'icon-trashcan')
    button.addEventListener 'click', (e) -> atom.commands.dispatch(atom.views.getView(atom.workspace), "notifications:clear-log")
    @subscriptions.add atom.tooltips.add(button, {title: "Clear notifications"})
    header.appendChild(button)

    lastNotification = null
    for notification in atom.notifications.getNotifications()
      if lastNotification?
        # do not show duplicates unless some amount of time has passed
        timeSpan = notification.getTimestamp() - lastNotification.getTimestamp()
        unless timeSpan < @duplicateTimeDelay and notification.isEqual(lastNotification)
          @addNotification(notification)
      else
        @addNotification(notification)

      lastNotification = notification

    @subscriptions.add new Disposable => @element.remove()

  destroy: ->
    @subscriptions.dispose()
    @emitter.emit 'did-destroy'

  getElement: -> @element

  getURI: -> 'atom://notifications/log'

  getTitle: -> 'Log'

  getLongTitle: -> 'Notifications Log'

  getIconName: -> 'alert'

  getDefaultLocation: -> 'bottom'

  getAllowedLocations: -> ['left', 'right', 'bottom']

  serialize: ->
    return {
      @typesHidden
      deserializer: 'notifications/NotificationsLog'
    }

  toggleType: (type, force) ->
    button = @element.querySelector(".notification-type.#{type}")
    hide = not button.classList.toggle('show-type', force)
    @list.classList.toggle("hide-#{type}", hide)
    @typesHidden[type] = hide

  addNotification: (notification) ->
    logItem = new NotificationsLogItem(notification)
    logItem.onClick => @emitter.emit('item-clicked', notification)
    @logItems.push logItem
    @list.insertBefore(logItem.getElement(), @list.firstChild)

  onItemClick: (callback) ->
    @emitter.on 'item-clicked', callback

  onDidDestroy: (callback) ->
    @emitter.on 'did-destroy', callback

  clearLogItems: ->
    logItem.destroy() for logItem in @logItems
    @logItems = []
