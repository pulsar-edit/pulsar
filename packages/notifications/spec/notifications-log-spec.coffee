{Notification} = require 'atom'
NotificationElement = require '../lib/notification-element'
NotificationIssue = require '../lib/notification-issue'
NotificationsLog = require '../lib/notifications-log'
{generateFakeFetchResponses, generateException} = require './helper'

describe "Notifications Log", ->
  workspaceElement = null

  beforeEach ->
    workspaceElement = atom.views.getView(atom.workspace)
    atom.notifications.clear()
    jasmine.attachToDOM(workspaceElement)

    waitsForPromise ->
      atom.packages.activatePackage('notifications')

    waitsForPromise ->
      atom.workspace.open(NotificationsLog::getURI())

  describe "when the package is activated", ->
    it "attaches an atom-notifications element to the dom", ->
      expect(workspaceElement.querySelector('.notifications-log-items')).toBeDefined()

  describe "when there are notifications before activation", ->
    beforeEach ->
      waitsForPromise ->
        atom.packages.deactivatePackage('notifications')

    it "displays all non displayed notifications", ->
      warning = new Notification('warning', 'Un-displayed warning')
      error = new Notification('error', 'Displayed error')
      error.setDisplayed(true)

      atom.notifications.addNotification(error)
      atom.notifications.addNotification(warning)

      waitsForPromise ->
        atom.packages.activatePackage('notifications')

      waitsForPromise ->
        atom.workspace.open(NotificationsLog::getURI())

      runs ->
        notificationsLogContainer = workspaceElement.querySelector('.notifications-log-items')
        notification = notificationsLogContainer.querySelector('.notifications-log-notification.warning')
        expect(notification).toExist()
        notification = notificationsLogContainer.querySelector('.notifications-log-notification.error')
        expect(notification).toExist()

  describe "when notifications are added to atom.notifications", ->
    notificationsLogContainer = null

    beforeEach ->
      enableInitNotification = atom.notifications.addSuccess('A message to trigger initialization', dismissable: true)
      enableInitNotification.dismiss()
      advanceClock(NotificationElement::visibilityDuration)
      advanceClock(NotificationElement::animationDuration)

      notificationsLogContainer = workspaceElement.querySelector('.notifications-log-items')
      jasmine.attachToDOM(workspaceElement)

      generateFakeFetchResponses()

    it "adds an .notifications-log-item element to the container with a class corresponding to the type", ->
      atom.notifications.addSuccess('A message')
      notification = notificationsLogContainer.querySelector('.notifications-log-item.success')
      expect(notificationsLogContainer.childNodes).toHaveLength 2
      expect(notification.querySelector('.message').textContent.trim()).toBe 'A message'
      expect(notification.querySelector('.btn-toolbar')).toBeEmpty()

      atom.notifications.addInfo('A message')
      expect(notificationsLogContainer.childNodes).toHaveLength 3
      expect(notificationsLogContainer.querySelector('.notifications-log-item.info')).toBeDefined()

      atom.notifications.addWarning('A message')
      expect(notificationsLogContainer.childNodes).toHaveLength 4
      expect(notificationsLogContainer.querySelector('.notifications-log-item.warning')).toBeDefined()

      atom.notifications.addError('A message')
      expect(notificationsLogContainer.childNodes).toHaveLength 5
      expect(notificationsLogContainer.querySelector('.notifications-log-item.error')).toBeDefined()

      atom.notifications.addFatalError('A message')
      notification = notificationsLogContainer.querySelector('.notifications-log-item.fatal')
      expect(notificationsLogContainer.childNodes).toHaveLength 6
      expect(notification).toBeDefined()
      expect(notification.querySelector('.btn-toolbar')).not.toBeEmpty()

    describe "when the `buttons` options is used", ->
      it "displays the buttons in the .btn-toolbar element", ->
        clicked = []
        atom.notifications.addSuccess 'A message',
          buttons: [{
            text: 'Button One'
            className: 'btn-one'
            onDidClick: -> clicked.push 'one'
          }, {
            text: 'Button Two'
            className: 'btn-two'
            onDidClick: -> clicked.push 'two'
          }]

        notification = notificationsLogContainer.querySelector('.notifications-log-item.success')
        expect(notification.querySelector('.btn-toolbar')).not.toBeEmpty()

        btnOne = notification.querySelector('.btn-one')
        btnTwo = notification.querySelector('.btn-two')

        expect(btnOne).toHaveClass 'btn-success'
        expect(btnOne.textContent).toBe 'Button One'
        expect(btnTwo).toHaveClass 'btn-success'
        expect(btnTwo.textContent).toBe 'Button Two'

        btnTwo.click()
        btnOne.click()

        expect(clicked).toEqual ['two', 'one']

    describe "when an exception is thrown", ->
      fatalError = null

      describe "when the there is an error searching for the issue", ->
        beforeEach ->
          spyOn(atom, 'inDevMode').andReturn false
          generateFakeFetchResponses(issuesErrorResponse: '403')
          generateException()
          fatalError = notificationsLogContainer.querySelector('.notifications-log-item.fatal')
          waitsForPromise ->
            fatalError.getRenderPromise()

        it "asks the user to create an issue", ->
          button = fatalError.querySelector('.btn')
          copyReport = fatalError.querySelector('.btn-copy-report')
          expect(button).toBeDefined()
          expect(button.textContent).toContain 'Create issue'
          expect(copyReport).toBeDefined()

      describe "when the package is out of date", ->
        beforeEach ->
          installedVersion = '0.9.0'
          UserUtilities = require '../lib/user-utilities'
          spyOn(UserUtilities, 'getPackageVersion').andCallFake -> installedVersion
          spyOn(atom, 'inDevMode').andReturn false
          generateFakeFetchResponses
            packageResponse:
              repository: url: 'https://github.com/someguy/somepackage'
              releases: latest: '0.10.0'
          spyOn(NotificationIssue.prototype, 'getPackageName').andCallFake -> "somepackage"
          spyOn(NotificationIssue.prototype, 'getRepoUrl').andCallFake -> "https://github.com/someguy/somepackage"
          generateException()
          fatalError = notificationsLogContainer.querySelector('.notifications-log-item.fatal')
          waitsForPromise ->
            fatalError.getRenderPromise()

        it "asks the user to update their packages", ->
          button = fatalError.querySelector('.btn')

          expect(button.textContent).toContain 'Check for package updates'
          expect(button.getAttribute('href')).toBe '#'

      describe "when the error has been reported", ->
        beforeEach ->
          spyOn(atom, 'inDevMode').andReturn false
          generateFakeFetchResponses
            issuesResponse:
              items: [
                {
                  title: 'ReferenceError: a is not defined in $ATOM_HOME/somewhere'
                  html_url: 'http://url.com/ok'
                  state: 'open'
                }
              ]
          spyOn(NotificationIssue.prototype, 'getPackageName').andCallFake -> "somepackage"
          spyOn(NotificationIssue.prototype, 'getRepoUrl').andCallFake -> "https://github.com/someguy/somepackage"
          generateException()
          fatalError = notificationsLogContainer.querySelector('.notifications-log-item.fatal')
          waitsForPromise ->
            fatalError.getRenderPromise()

        it "shows the user a view issue button", ->
          button = fatalError.querySelector('.btn')
          expect(button.textContent).toContain 'View Issue'
          expect(button.getAttribute('href')).toBe 'http://url.com/ok'

    describe "when a log item is clicked", ->
      [notification, notificationView, logItem] = []

      describe "when the notification is not dismissed", ->

        describe "when the notification is not dismissable", ->

          beforeEach ->
            notification = atom.notifications.addInfo('A message')
            notificationView = atom.views.getView(notification)
            logItem = notificationsLogContainer.querySelector('.notifications-log-item.info')

          it "makes the notification dismissable", ->
            logItem.click()
            expect(notificationView.element.classList.contains('has-close')).toBe true
            expect(notification.isDismissable()).toBe true

            advanceClock(NotificationElement::visibilityDuration)
            advanceClock(NotificationElement::animationDuration)
            expect(notificationView.element).toBeVisible()

      describe "when the notification is dismissed", ->

        beforeEach ->
          notification = atom.notifications.addInfo('A message', dismissable: true)
          notificationView = atom.views.getView(notification)
          logItem = notificationsLogContainer.querySelector('.notifications-log-item.info')
          notification.dismiss()
          advanceClock(NotificationElement::animationDuration)

        it "displays the notification", ->
          didDisplay = false
          notification.onDidDisplay -> didDisplay = true
          logItem.click()

          expect(didDisplay).toBe true
          expect(notification.dismissed).toBe false
          expect(notificationView.element).toBeVisible()

        describe "when the notification is dismissed again", ->

          it "emits did-dismiss", ->
            didDismiss = false
            notification.onDidDismiss -> didDismiss = true
            logItem.click()

            notification.dismiss()
            advanceClock(NotificationElement::animationDuration)

            expect(didDismiss).toBe true
            expect(notification.dismissed).toBe true
            expect(notificationView.element).not.toBeVisible()

  describe "when notifications are cleared", ->

    beforeEach ->
      clearButton = workspaceElement.querySelector('.notifications-log .notifications-clear-log')
      atom.notifications.addInfo('A message', dismissable: true)
      atom.notifications.addInfo('non-dismissable')
      clearButton.click()

    it "clears the notifications", ->
      expect(atom.notifications.getNotifications()).toHaveLength 0
      notifications = workspaceElement.querySelector('atom-notifications')
      advanceClock(NotificationElement::animationDuration)
      expect(notifications.children).toHaveLength 0
      logItems = workspaceElement.querySelector('.notifications-log-items')
      expect(logItems.children).toHaveLength 0

  describe "the dock pane", ->
    notificationsLogPane = null

    beforeEach ->
      notificationsLogPane = atom.workspace.paneForURI(NotificationsLog::getURI())

    describe "when notifications:toggle-log is dispatched", ->
      it "toggles the pane URI", ->
        spyOn(atom.workspace, "toggle")

        atom.commands.dispatch(workspaceElement, "notifications:toggle-log")
        expect(atom.workspace.toggle).toHaveBeenCalledWith(NotificationsLog::getURI())

      describe "when the pane is destroyed", ->

        beforeEach ->
          notificationsLogPane.destroyItems()

        it "opens the pane", ->
          [notificationsLog] = []

          waitsForPromise ->
            atom.workspace.toggle(NotificationsLog::getURI()).then (paneItem) ->
              notificationsLog = paneItem

          runs ->
            expect(notificationsLog).toBeDefined()

        describe "when notifications are displayed", ->

          beforeEach ->
            atom.notifications.addSuccess("success")

          it "lists all notifications", ->
            waitsForPromise ->
              atom.workspace.toggle(NotificationsLog::getURI())

            runs ->
              notificationsLogContainer = workspaceElement.querySelector('.notifications-log-items')
              expect(notificationsLogContainer.childNodes).toHaveLength 1

      describe "when the pane is hidden", ->

        beforeEach ->
          atom.workspace.hide(NotificationsLog::getURI())

        it "opens the pane", ->
          [notificationsLog] = []

          waitsForPromise ->
            atom.workspace.toggle(NotificationsLog::getURI()).then (paneItem) ->
              notificationsLog = paneItem

          runs ->
            expect(notificationsLog).toBeDefined()

      describe "when the pane is open", ->

        beforeEach ->
          waitsForPromise ->
            atom.workspace.open(NotificationsLog::getURI())

        it "closes the pane", ->
          notificationsLog = null

          waitsForPromise ->
            atom.workspace.toggle(NotificationsLog::getURI()).then (paneItem) ->
              notificationsLog = paneItem

          runs ->
            expect(notificationsLog).not.toBeDefined()
