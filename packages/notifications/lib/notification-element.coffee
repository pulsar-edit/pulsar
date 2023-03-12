createDOMPurify = require 'dompurify'
fs = require 'fs-plus'
path = require 'path'
marked = require 'marked'
{shell} = require 'electron'

NotificationIssue = require './notification-issue'
TemplateHelper = require './template-helper'
UserUtilities = require './user-utilities'

DOMPurify = null

NotificationTemplate = """
  <div class="content">
    <div class="message item"></div>
    <div class="detail item">
      <div class="detail-content"></div>
      <a href="#" class="stack-toggle"></a>
      <div class="stack-container"></div>
    </div>
    <div class="meta item"></div>
  </div>
  <div class="close icon icon-x"></div>
  <div class="close-all btn btn-error">Close All</div>
"""

FatalMetaNotificationTemplate = """
  <div class="description fatal-notification"></div>
  <div class="btn-toolbar">
    <a href="#" class="btn-issue btn btn-error"></a>
    <a href="#" class="btn-copy-report icon icon-clippy" title="Copy error report to clipboard"></a>
  </div>
"""

MetaNotificationTemplate = """
  <div class="description"></div>
"""

ButtonListTemplate = """
  <div class="btn-toolbar"></div>
"""

ButtonTemplate = """
  <a href="#" class="btn"></a>
"""

module.exports =
class NotificationElement
  animationDuration: 360
  visibilityDuration: 5000
  autohideTimeout: null

  constructor: (@model, @visibilityDuration) ->
    @fatalTemplate = TemplateHelper.create(FatalMetaNotificationTemplate)
    @metaTemplate = TemplateHelper.create(MetaNotificationTemplate)
    @buttonListTemplate = TemplateHelper.create(ButtonListTemplate)
    @buttonTemplate = TemplateHelper.create(ButtonTemplate)

    @element = document.createElement('atom-notification')
    @issue = new NotificationIssue(@model) if @model.getType() is 'fatal'
    @renderPromise = @render().catch (e) ->
      console.error e.message
      console.error e.stack

    @model.onDidDismiss => @removeNotification()

    unless @model.isDismissable()
      @autohide()
      @element.addEventListener 'click', @makeDismissable.bind(this), {once: true}

    @element.issue = @issue
    @element.getRenderPromise = @getRenderPromise.bind(this)

  getModel: -> @model

  getRenderPromise: -> @renderPromise

  render: ->
    @element.classList.add "#{@model.getType()}"
    @element.classList.add "icon", "icon-#{@model.getIcon()}", "native-key-bindings"

    @element.classList.add('has-detail') if detail = @model.getDetail()
    @element.classList.add('has-close') if @model.isDismissable()
    @element.classList.add('has-stack') if detail and @model.getOptions().stack?

    @element.setAttribute('tabindex', '-1')

    @element.innerHTML = NotificationTemplate

    options = @model.getOptions()

    notificationContainer = @element.querySelector('.message')

    if DOMPurify is null
      DOMPurify = createDOMPurify()
    notificationContainer.innerHTML = DOMPurify.sanitize(marked(@model.getMessage()))

    if detail = @model.getDetail()
      addSplitLinesToContainer(@element.querySelector('.detail-content'), detail)

      if stack = options.stack
        stackToggle = @element.querySelector('.stack-toggle')
        stackContainer = @element.querySelector('.stack-container')

        addSplitLinesToContainer(stackContainer, stack)

        stackToggle.addEventListener 'click', (e) => @handleStackTraceToggleClick(e, stackContainer)
        @handleStackTraceToggleClick({currentTarget: stackToggle}, stackContainer)

    if metaContent = options.description
      @element.classList.add('has-description')
      metaContainer = @element.querySelector('.meta')
      metaContainer.appendChild(TemplateHelper.render(@metaTemplate))
      description = @element.querySelector('.description')
      description.innerHTML = marked(metaContent)

    if options.buttons and options.buttons.length > 0
      @element.classList.add('has-buttons')
      metaContainer = @element.querySelector('.meta')
      metaContainer.appendChild(TemplateHelper.render(@buttonListTemplate))
      toolbar = @element.querySelector('.btn-toolbar')
      buttonClass = @model.getType()
      buttonClass = 'error' if buttonClass is 'fatal'
      buttonClass = "btn-#{buttonClass}"
      options.buttons.forEach (button) =>
        toolbar.appendChild(TemplateHelper.render(@buttonTemplate))
        buttonEl = toolbar.childNodes[toolbar.childNodes.length - 1]
        buttonEl.textContent = button.text
        buttonEl.classList.add(buttonClass)
        if button.className?
          buttonEl.classList.add.apply(buttonEl.classList, button.className.split(' '))
        if button.onDidClick?
          buttonEl.addEventListener 'click', (e) =>
            button.onDidClick.call(this, e)

    closeButton = @element.querySelector('.close')
    closeButton.addEventListener 'click', => @handleRemoveNotificationClick()

    closeAllButton = @element.querySelector('.close-all')
    closeAllButton.classList.add @getButtonClass()
    closeAllButton.addEventListener 'click', => @handleRemoveAllNotificationsClick()

    if @model.getType() is 'fatal'
      @renderFatalError()
    else
      Promise.resolve()

  renderFatalError: ->
    repoUrl = @issue.getRepoUrl()
    packageName = @issue.getPackageName()

    fatalContainer = @element.querySelector('.meta')
    fatalContainer.appendChild(TemplateHelper.render(@fatalTemplate))
    fatalNotification = @element.querySelector('.fatal-notification')

    issueButton = fatalContainer.querySelector('.btn-issue')

    copyReportButton = fatalContainer.querySelector('.btn-copy-report')
    atom.tooltips.add(copyReportButton, title: copyReportButton.getAttribute('title'))
    copyReportButton.addEventListener 'click', (e) =>
      e.preventDefault()
      @issue.getIssueBody().then (issueBody) ->
        atom.clipboard.write(issueBody)

    if packageName? and repoUrl?
      fatalNotification.innerHTML = "The error was thrown from the <a href=\"#{repoUrl}\">#{packageName} package</a>. "
    else if packageName?
      issueButton.remove()
      fatalNotification.textContent = "The error was thrown from the #{packageName} package. "
    else
      fatalNotification.textContent = "This is likely a bug in Pulsar. "

    # We only show the create issue button if it's clearly in atom core or in a package with a repo url
    if issueButton.parentNode?
      if packageName? and repoUrl?
        issueButton.textContent = "Create issue on the #{packageName} package"
      else
        issueButton.textContent = "Create issue on pulsar-edit/pulsar"

      promises = []
      promises.push @issue.findSimilarIssues()
      promises.push UserUtilities.checkAtomUpToDate()
      promises.push UserUtilities.checkPackageUpToDate(packageName) if packageName?

      Promise.all(promises).then (allData) =>
        [issues, atomCheck, packageCheck] = allData

        if issues?.open or issues?.closed
          issue = issues.open or issues.closed
          issueButton.setAttribute('href', issue.html_url)
          issueButton.textContent = "View Issue"
          fatalNotification.innerHTML += " This issue has already been reported."
        else if packageCheck? and not packageCheck.upToDate and not packageCheck.isCore
          issueButton.setAttribute('href', '#')
          issueButton.textContent = "Check for package updates"
          issueButton.addEventListener 'click', (e) ->
            e.preventDefault()
            command = 'settings-view:check-for-package-updates'
            atom.commands.dispatch(atom.views.getView(atom.workspace), command)

          fatalNotification.innerHTML += """
            <code>#{packageName}</code> is out of date: #{packageCheck.installedVersion} installed;
            #{packageCheck.latestVersion} latest.
            Upgrading to the latest version may fix this issue.
          """
        else if packageCheck? and not packageCheck.upToDate and packageCheck.isCore
          issueButton.remove()

          fatalNotification.innerHTML += """
            <br><br>
            Locally installed core Pulsar package <code>#{packageName}</code> is out of date: #{packageCheck.installedVersion} installed locally;
            #{packageCheck.versionShippedWithAtom} included with the version of Pulsar you're running.
            Removing the locally installed version may fix this issue.
          """

          packagePath = atom.packages.getLoadedPackage(packageName)?.path
          if fs.isSymbolicLinkSync(packagePath)
            fatalNotification.innerHTML += """
            <br><br>
            Use: <code>apm unlink #{packagePath}</code>
          """
        else if atomCheck? and not atomCheck.upToDate
          issueButton.remove()

          fatalNotification.innerHTML += """
            Pulsar is out of date: #{atomCheck.installedVersion} installed;
            #{atomCheck.latestVersion} latest.
            Upgrading to the <a href='https://github.com/pulsar-edit/pulsar/releases/tag/v#{atomCheck.latestVersion}'>latest version</a> may fix this issue.
          """
        else
          fatalNotification.innerHTML += " You can help by creating an issue. Please explain what actions triggered this error."
          issueButton.addEventListener 'click', (e) =>
            e.preventDefault()
            issueButton.classList.add('opening')
            @issue.getIssueUrlForSystem().then (issueUrl) ->
              shell.openExternal(issueUrl)
              issueButton.classList.remove('opening')

        return
    else
      Promise.resolve()

  makeDismissable: ->
    unless @model.isDismissable()
      clearTimeout(@autohideTimeout)
      @model.options.dismissable = true
      @model.dismissed = false
      @element.classList.add('has-close')

  removeNotification: ->
    unless @element.classList.contains('remove')
      @element.classList.add('remove')
      @removeNotificationAfterTimeout()

  handleRemoveNotificationClick: ->
    @removeNotification()
    @model.dismiss()

  handleRemoveAllNotificationsClick: ->
    notifications = atom.notifications.getNotifications()
    for notification in notifications
      atom.views.getView(notification).removeNotification()
      if notification.isDismissable() and not notification.isDismissed()
        notification.dismiss()
    return

  handleStackTraceToggleClick: (e, container) ->
    e.preventDefault?()
    if container.style.display is 'none'
      e.currentTarget.innerHTML = '<span class="icon icon-dash"></span>Hide Stack Trace'
      container.style.display = 'block'
    else
      e.currentTarget.innerHTML = '<span class="icon icon-plus"></span>Show Stack Trace'
      container.style.display = 'none'

  autohide: ->
    @autohideTimeout = setTimeout =>
      @removeNotification()
    , @visibilityDuration

  removeNotificationAfterTimeout: ->
    atom.workspace.getActivePane().activate() if @element is document.activeElement

    setTimeout =>
      @element.remove()
    , @animationDuration # keep in sync with CSS animation

  getButtonClass: ->
    type = "btn-#{@model.getType()}"
    if type is 'btn-fatal' then 'btn-error' else type

addSplitLinesToContainer = (container, content) ->
  content = content.toString() if typeof content isnt 'string'
  for line in content.split('\n')
    div = document.createElement('div')
    div.classList.add 'line'
    div.textContent = line
    container.appendChild(div)
  return
