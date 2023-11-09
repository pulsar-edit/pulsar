/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let NotificationElement;
const fs = require('fs-plus');
const path = require('path');
const {shell} = require('electron');

const NotificationIssue = require('./notification-issue');
const TemplateHelper = require('./template-helper');
const UserUtilities = require('./user-utilities');

const NotificationTemplate = `\
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
<div class="close-all btn btn-error">Close All</div>\
`;

const FatalMetaNotificationTemplate = `\
<div class="description fatal-notification"></div>
<div class="btn-toolbar">
  <a href="#" class="btn-issue btn btn-error"></a>
  <a href="#" class="btn-copy-report icon icon-clippy" title="Copy error report to clipboard"></a>
</div>\
`;

const MetaNotificationTemplate = `\
<div class="description"></div>\
`;

const ButtonListTemplate = `\
<div class="btn-toolbar"></div>\
`;

const ButtonTemplate = `\
<a href="#" class="btn"></a>\
`;

module.exports =
(NotificationElement = (function() {
  NotificationElement = class NotificationElement {
    static initClass() {
      this.prototype.animationDuration = 360;
      this.prototype.visibilityDuration = 5000;
      this.prototype.autohideTimeout = null;
    }

    constructor(model, visibilityDuration) {
      this.model = model;
      this.visibilityDuration = visibilityDuration;
      this.fatalTemplate = TemplateHelper.create(FatalMetaNotificationTemplate);
      this.metaTemplate = TemplateHelper.create(MetaNotificationTemplate);
      this.buttonListTemplate = TemplateHelper.create(ButtonListTemplate);
      this.buttonTemplate = TemplateHelper.create(ButtonTemplate);

      this.element = document.createElement('atom-notification');
      if (this.model.getType() === 'fatal') { this.issue = new NotificationIssue(this.model); }
      this.renderPromise = this.render().catch(function(e) {
        console.error(e.message);
        return console.error(e.stack);
      });

      this.model.onDidDismiss(() => this.removeNotification());

      if (!this.model.isDismissable()) {
        this.autohide();
        this.element.addEventListener('click', this.makeDismissable.bind(this), {once: true});
      }

      this.element.issue = this.issue;
      this.element.getRenderPromise = this.getRenderPromise.bind(this);
    }

    getModel() { return this.model; }

    getRenderPromise() { return this.renderPromise; }

    render() {
      let detail, metaContainer, metaContent;
      this.element.classList.add(`${this.model.getType()}`);
      this.element.classList.add("icon", `icon-${this.model.getIcon()}`, "native-key-bindings");

      if (detail = this.model.getDetail()) { this.element.classList.add('has-detail'); }
      if (this.model.isDismissable()) { this.element.classList.add('has-close'); }
      if (detail && (this.model.getOptions().stack != null)) { this.element.classList.add('has-stack'); }

      this.element.setAttribute('tabindex', '-1');

      this.element.innerHTML = NotificationTemplate;

      const options = this.model.getOptions();

      const notificationContainer = this.element.querySelector('.message');

      notificationContainer.innerHTML = atom.ui.markdown.render(this.model.getMessage());

      if (detail = this.model.getDetail()) {
        let stack;
        addSplitLinesToContainer(this.element.querySelector('.detail-content'), detail);

        if (stack = options.stack) {
          const stackToggle = this.element.querySelector('.stack-toggle');
          const stackContainer = this.element.querySelector('.stack-container');

          addSplitLinesToContainer(stackContainer, stack);

          stackToggle.addEventListener('click', e => this.handleStackTraceToggleClick(e, stackContainer));
          this.handleStackTraceToggleClick({currentTarget: stackToggle}, stackContainer);
        }
      }

      if (metaContent = options.description) {
        this.element.classList.add('has-description');
        metaContainer = this.element.querySelector('.meta');
        metaContainer.appendChild(TemplateHelper.render(this.metaTemplate));
        const description = this.element.querySelector('.description');
        description.innerHTML = atom.ui.markdown.render(metaContent);
      }

      if (options.buttons && (options.buttons.length > 0)) {
        this.element.classList.add('has-buttons');
        metaContainer = this.element.querySelector('.meta');
        metaContainer.appendChild(TemplateHelper.render(this.buttonListTemplate));
        const toolbar = this.element.querySelector('.btn-toolbar');
        let buttonClass = this.model.getType();
        if (buttonClass === 'fatal') { buttonClass = 'error'; }
        buttonClass = `btn-${buttonClass}`;
        options.buttons.forEach(button => {
          toolbar.appendChild(TemplateHelper.render(this.buttonTemplate));
          const buttonEl = toolbar.childNodes[toolbar.childNodes.length - 1];
          buttonEl.textContent = button.text;
          buttonEl.classList.add(buttonClass);
          if (button.className != null) {
            buttonEl.classList.add.apply(buttonEl.classList, button.className.split(' '));
          }
          if (button.onDidClick != null) {
            return buttonEl.addEventListener('click', e => {
              return button.onDidClick.call(this, e);
            });
          }
        });
      }

      const closeButton = this.element.querySelector('.close');
      closeButton.addEventListener('click', () => this.handleRemoveNotificationClick());

      const closeAllButton = this.element.querySelector('.close-all');
      closeAllButton.classList.add(this.getButtonClass());
      closeAllButton.addEventListener('click', () => this.handleRemoveAllNotificationsClick());

      if (this.model.getType() === 'fatal') {
        return this.renderFatalError();
      } else {
        return Promise.resolve();
      }
    }

    renderFatalError() {
      const repoUrl = this.issue.getRepoUrl();
      const packageName = this.issue.getPackageName();

      const fatalContainer = this.element.querySelector('.meta');
      fatalContainer.appendChild(TemplateHelper.render(this.fatalTemplate));
      const fatalNotification = this.element.querySelector('.fatal-notification');

      const issueButton = fatalContainer.querySelector('.btn-issue');

      const copyReportButton = fatalContainer.querySelector('.btn-copy-report');
      atom.tooltips.add(copyReportButton, {title: copyReportButton.getAttribute('title')});
      copyReportButton.addEventListener('click', e => {
        e.preventDefault();
        return this.issue.getIssueBody().then(issueBody => atom.clipboard.write(issueBody));
      });

      if ((packageName != null) && (repoUrl != null)) {
        fatalNotification.innerHTML = `The error was thrown from the <a href=\"${repoUrl}\">${packageName} package</a>. `;
      } else if (packageName != null) {
        issueButton.remove();
        fatalNotification.textContent = `The error was thrown from the ${packageName} package. `;
      } else {
        fatalNotification.textContent = "This is likely a bug in Pulsar. ";
      }

      // We only show the create issue button if it's clearly in atom core or in a package with a repo url
      if (issueButton.parentNode != null) {
        if ((packageName != null) && (repoUrl != null)) {
          issueButton.textContent = `Create issue on the ${packageName} package`;
        } else {
          issueButton.textContent = "Create issue on pulsar-edit/pulsar";
        }

        const promises = [];
        promises.push(this.issue.findSimilarIssues());
        promises.push(UserUtilities.checkPulsarUpToDate());
        if (packageName != null) {
          promises.push(UserUtilities.checkPackageUpToDate(packageName));
        }

        return Promise.all(promises).then(allData => {
          let issue;
          const [issues, atomCheck, packageCheck] = Array.from(allData);

          if ((issues != null ? issues.open : undefined) || (issues != null ? issues.closed : undefined)) {
            issue = issues.open || issues.closed;
            issueButton.setAttribute('href', issue.html_url);
            issueButton.textContent = "View Issue";
            fatalNotification.innerHTML += " This issue has already been reported.";
          } else if ((packageCheck != null) && !packageCheck.upToDate && !packageCheck.isCore) {
            issueButton.setAttribute('href', '#');
            issueButton.textContent = "Check for package updates";
            issueButton.addEventListener('click', function(e) {
              e.preventDefault();
              const command = 'settings-view:check-for-package-updates';
              return atom.commands.dispatch(atom.views.getView(atom.workspace), command);
            });

            fatalNotification.innerHTML += `\
<code>${packageName}</code> is out of date: ${packageCheck.installedVersion} installed;
${packageCheck.latestVersion} latest.
Upgrading to the latest version may fix this issue.\
`;
          } else if ((packageCheck != null) && !packageCheck.upToDate && packageCheck.isCore) {
            issueButton.remove();

            fatalNotification.innerHTML += `\
<br><br>
Locally installed core Pulsar package <code>${packageName}</code> is out of date: ${packageCheck.installedVersion} installed locally;
${packageCheck.versionShippedWithPulsar} included with the version of Pulsar you're running.
Removing the locally installed version may fix this issue.\
`;

            const packagePath = __guard__(atom.packages.getLoadedPackage(packageName), x => x.path);
            if (fs.isSymbolicLinkSync(packagePath)) {
              fatalNotification.innerHTML += `\
<br><br>
Use: <code>apm unlink ${packagePath}</code>\
`;
            }
          } else if ((atomCheck != null) && !atomCheck.upToDate) {
            issueButton.remove();

            fatalNotification.innerHTML += `\
Pulsar is out of date: ${atomCheck.installedVersion} installed;
${atomCheck.latestVersion} latest.
Upgrading to the <a href='https://github.com/pulsar-edit/pulsar/releases/tag/v${atomCheck.latestVersion}'>latest version</a> may fix this issue.\
`;
          } else {
            fatalNotification.innerHTML += " You can help by creating an issue. Please explain what actions triggered this error.";
            issueButton.addEventListener('click', e => {
              e.preventDefault();
              issueButton.classList.add('opening');
              return this.issue.getIssueUrlForSystem().then(function(issueUrl) {
                shell.openExternal(issueUrl);
                return issueButton.classList.remove('opening');
              });
            });
          }

        });
      } else {
        return Promise.resolve();
      }
    }

    makeDismissable() {
      if (!this.model.isDismissable()) {
        clearTimeout(this.autohideTimeout);
        this.model.options.dismissable = true;
        this.model.dismissed = false;
        return this.element.classList.add('has-close');
      }
    }

    removeNotification() {
      if (!this.element.classList.contains('remove')) {
        this.element.classList.add('remove');
        return this.removeNotificationAfterTimeout();
      }
    }

    handleRemoveNotificationClick() {
      this.removeNotification();
      return this.model.dismiss();
    }

    handleRemoveAllNotificationsClick() {
      const notifications = atom.notifications.getNotifications();
      for (var notification of Array.from(notifications)) {
        atom.views.getView(notification).removeNotification();
        if (notification.isDismissable() && !notification.isDismissed()) {
          notification.dismiss();
        }
      }
    }

    handleStackTraceToggleClick(e, container) {
      if (typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      if (container.style.display === 'none') {
        e.currentTarget.innerHTML = '<span class="icon icon-dash"></span>Hide Stack Trace';
        return container.style.display = 'block';
      } else {
        e.currentTarget.innerHTML = '<span class="icon icon-plus"></span>Show Stack Trace';
        return container.style.display = 'none';
      }
    }

    autohide() {
      return this.autohideTimeout = setTimeout(() => {
        return this.removeNotification();
      }
      , this.visibilityDuration);
    }

    removeNotificationAfterTimeout() {
      if (this.element === document.activeElement) { atom.workspace.getActivePane().activate(); }

      return setTimeout(() => {
        return this.element.remove();
      }
      , this.animationDuration); // keep in sync with CSS animation
    }

    getButtonClass() {
      const type = `btn-${this.model.getType()}`;
      if (type === 'btn-fatal') { return 'btn-error'; } else { return type; }
    }
  };
  NotificationElement.initClass();
  return NotificationElement;
})());

var addSplitLinesToContainer = function(container, content) {
  if (typeof content !== 'string') { content = content.toString(); }
  for (var line of Array.from(content.split('\n'))) {
    var div = document.createElement('div');
    div.classList.add('line');
    div.textContent = line;
    container.appendChild(div);
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
