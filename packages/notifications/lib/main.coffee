{Notification, CompositeDisposable} = require 'atom'
fs = require 'fs-plus'
StackTraceParser = null
NotificationElement = require './notification-element'
NotificationsLog = require './notifications-log'

Notifications =
  isInitialized: false
  subscriptions: null
  duplicateTimeDelay: 500
  lastNotification: null

  activate: (state) ->
    CommandLogger = require './command-logger'
    CommandLogger.start()
    @subscriptions = new CompositeDisposable

    @addNotificationView(notification) for notification in atom.notifications.getNotifications()
    @subscriptions.add atom.notifications.onDidAddNotification (notification) => @addNotificationView(notification)

    @subscriptions.add atom.onWillThrowError ({message, url, line, originalError, preventDefault}) ->
      if originalError.name is 'BufferedProcessError'
        message = message.replace('Uncaught BufferedProcessError: ', '')
        atom.notifications.addError(message, dismissable: true)

      else if originalError.code is 'ENOENT' and not /\/pulsar/i.test(message) and match = /spawn (.+) ENOENT/.exec(message)
        message = """
          '#{match[1]}' could not be spawned.
          Is it installed and on your path?
          If so please open an issue on the package spawning the process.
        """
        atom.notifications.addError(message, dismissable: true)

      else if not atom.inDevMode() or atom.config.get('notifications.showErrorsInDevMode')
        preventDefault()

        # Ignore errors with no paths in them since they are impossible to trace
        if originalError.stack and not isCoreOrPackageStackTrace(originalError.stack)
          return

        options =
          detail: "#{url}:#{line}"
          stack: originalError.stack
          dismissable: true
        atom.notifications.addFatalError(message, options)

    @subscriptions.add atom.commands.add 'atom-workspace', 'core:cancel', ->
      notification.dismiss() for notification in atom.notifications.getNotifications()

    @subscriptions.add atom.config.observe 'notifications.defaultTimeout', (value) => @visibilityDuration = value

    if atom.inDevMode()
      @subscriptions.add atom.commands.add 'atom-workspace', 'notifications:trigger-error', ->
        try
          abc + 2 # nope
        catch error
          options =
            detail: error.stack.split('\n')[1]
            stack: error.stack
            dismissable: true
          atom.notifications.addFatalError("Uncaught #{error.stack.split('\n')[0]}", options)

    @addNotificationsLogSubscriptions() if @notificationsLog?
    @subscriptions.add atom.workspace.addOpener (uri) => @createLog() if uri is NotificationsLog::getURI()
    @subscriptions.add atom.commands.add 'atom-workspace', 'notifications:toggle-log', -> atom.workspace.toggle(NotificationsLog::getURI())
    @subscriptions.add atom.commands.add 'atom-workspace', 'notifications:clear-log', ->
      for notification in atom.notifications.getNotifications()
        notification.options.dismissable = true
        notification.dismissed = false
        notification.dismiss()
      atom.notifications.clear()

  deactivate: ->
    @subscriptions.dispose()
    @notificationsElement?.remove()
    @notificationsPanel?.destroy()
    @notificationsLog?.destroy()

    @subscriptions = null
    @notificationsElement = null
    @notificationsPanel = null

    @isInitialized = false

  initializeIfNotInitialized: ->
    return if @isInitialized

    @subscriptions.add atom.views.addViewProvider Notification, (model) =>
      new NotificationElement(model, @visibilityDuration)

    @notificationsElement = document.createElement('atom-notifications')
    atom.views.getView(atom.workspace).appendChild(@notificationsElement)

    @isInitialized = true

  createLog: (state) ->
    @notificationsLog = new NotificationsLog @duplicateTimeDelay, state?.typesHidden
    @addNotificationsLogSubscriptions() if @subscriptions?
    @notificationsLog

  addNotificationsLogSubscriptions: ->
    @subscriptions.add @notificationsLog.onDidDestroy => @notificationsLog = null
    @subscriptions.add @notificationsLog.onItemClick (notification) =>
      view = atom.views.getView(notification)
      view.makeDismissable()

      return unless view.element.classList.contains('remove')
      view.element.classList.remove('remove')
      @notificationsElement.appendChild(view.element)
      notification.dismissed = false
      notification.setDisplayed(true)

  addNotificationView: (notification) ->
    return unless notification?
    @initializeIfNotInitialized()
    return if notification.wasDisplayed()

    if @lastNotification?
      # do not show duplicates unless some amount of time has passed
      timeSpan = notification.getTimestamp() - @lastNotification.getTimestamp()
      unless timeSpan < @duplicateTimeDelay and notification.isEqual(@lastNotification)
        @notificationsElement.appendChild(atom.views.getView(notification).element)
        @notificationsLog?.addNotification(notification)
    else
      @notificationsElement.appendChild(atom.views.getView(notification).element)
      @notificationsLog?.addNotification(notification)

    notification.setDisplayed(true)
    @lastNotification = notification

isCoreOrPackageStackTrace = (stack) ->
  StackTraceParser ?= require 'stacktrace-parser'
  for {file} in StackTraceParser.parse(stack)
    if file is '<embedded>' or fs.isAbsolute(file)
      return true
  false

module.exports = Notifications
