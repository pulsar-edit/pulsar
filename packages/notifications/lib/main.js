/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const {Notification, CompositeDisposable} = require('atom');
const fs = require('fs-plus');
let StackTraceParser = null;
const NotificationElement = require('./notification-element');
const NotificationsLog = require('./notifications-log');

const Notifications = {
  isInitialized: false,
  subscriptions: null,
  duplicateTimeDelay: 500,
  lastNotification: null,

  activate(state) {
    let notification;
    const CommandLogger = require('./command-logger');
    CommandLogger.start();
    this.subscriptions = new CompositeDisposable;

    for (notification of Array.from(atom.notifications.getNotifications())) { this.addNotificationView(notification); }
    this.subscriptions.add(atom.notifications.onDidAddNotification(notification => this.addNotificationView(notification)));

    this.subscriptions.add(atom.onWillThrowError(function({message, url, line, originalError, preventDefault}) {
      let match;
      if (originalError.name === 'BufferedProcessError') {
        message = message.replace('Uncaught BufferedProcessError: ', '');
        return atom.notifications.addError(message, {dismissable: true});

      } else if ((originalError.code === 'ENOENT') && !/\/atom/i.test(message) && (match = /spawn (.+) ENOENT/.exec(message))) {
        message = `\
'${match[1]}' could not be spawned.
Is it installed and on your path?
If so please open an issue on the package spawning the process.\
`;
        return atom.notifications.addError(message, {dismissable: true});

      } else if (!atom.inDevMode() || atom.config.get('notifications.showErrorsInDevMode')) {
        preventDefault();

        // Ignore errors with no paths in them since they are impossible to trace
        if (originalError.stack && !isCoreOrPackageStackTrace(originalError.stack)) {
          return;
        }

        const options = {
          detail: `${url}:${line}`,
          stack: originalError.stack,
          dismissable: true
        };
        return atom.notifications.addFatalError(message, options);
      }
    })
    );

    this.subscriptions.add(atom.commands.add('atom-workspace', 'core:cancel', () => (() => {
      const result = [];
      for (notification of Array.from(atom.notifications.getNotifications())) {           result.push(notification.dismiss());
      }
      return result;
    })())
    );

    this.subscriptions.add(atom.config.observe('notifications.defaultTimeout', value => { return this.visibilityDuration = value; }));

    if (atom.inDevMode()) {
      this.subscriptions.add(atom.commands.add('atom-workspace', 'notifications:trigger-error', function() {
        try {
          return abc + 2; // nope
        } catch (error) {
          const options = {
            detail: error.stack.split('\n')[1],
            stack: error.stack,
            dismissable: true
          };
          return atom.notifications.addFatalError(`Uncaught ${error.stack.split('\n')[0]}`, options);
        }
      })
      );
    }

    if (this.notificationsLog != null) { this.addNotificationsLogSubscriptions(); }
    this.subscriptions.add(atom.workspace.addOpener(uri => { if (uri === NotificationsLog.prototype.getURI()) { return this.createLog(); } }));
    this.subscriptions.add(atom.commands.add('atom-workspace', 'notifications:toggle-log', () => atom.workspace.toggle(NotificationsLog.prototype.getURI())));
    return this.subscriptions.add(atom.commands.add('atom-workspace', 'notifications:clear-log', function() {
      for (notification of Array.from(atom.notifications.getNotifications())) {
        notification.options.dismissable = true;
        notification.dismissed = false;
        notification.dismiss();
      }
      return atom.notifications.clear();
    })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
    if (this.notificationsElement != null) {
      this.notificationsElement.remove();
    }
    if (this.notificationsPanel != null) {
      this.notificationsPanel.destroy();
    }
    if (this.notificationsLog != null) {
      this.notificationsLog.destroy();
    }

    this.subscriptions = null;
    this.notificationsElement = null;
    this.notificationsPanel = null;

    return this.isInitialized = false;
  },

  initializeIfNotInitialized() {
    if (this.isInitialized) { return; }

    this.subscriptions.add(atom.views.addViewProvider(Notification, model => {
      return new NotificationElement(model, this.visibilityDuration);
    })
    );

    this.notificationsElement = document.createElement('atom-notifications');
    atom.views.getView(atom.workspace).appendChild(this.notificationsElement);

    return this.isInitialized = true;
  },

  createLog(state) {
    this.notificationsLog = new NotificationsLog(this.duplicateTimeDelay, state != null ? state.typesHidden : undefined);
    if (this.subscriptions != null) { this.addNotificationsLogSubscriptions(); }
    return this.notificationsLog;
  },

  addNotificationsLogSubscriptions() {
    this.subscriptions.add(this.notificationsLog.onDidDestroy(() => { return this.notificationsLog = null; }));
    return this.subscriptions.add(this.notificationsLog.onItemClick(notification => {
      const view = atom.views.getView(notification);
      view.makeDismissable();

      if (!view.element.classList.contains('remove')) { return; }
      view.element.classList.remove('remove');
      this.notificationsElement.appendChild(view.element);
      notification.dismissed = false;
      return notification.setDisplayed(true);
    })
    );
  },

  addNotificationView(notification) {
    if (notification == null) { return; }
    this.initializeIfNotInitialized();
    if (notification.wasDisplayed()) { return; }

    if (this.lastNotification != null) {
      // do not show duplicates unless some amount of time has passed
      const timeSpan = notification.getTimestamp() - this.lastNotification.getTimestamp();
      if (!(timeSpan < this.duplicateTimeDelay) || !notification.isEqual(this.lastNotification)) {
        this.notificationsElement.appendChild(atom.views.getView(notification).element);
        if (this.notificationsLog != null) {
          this.notificationsLog.addNotification(notification);
        }
      }
    } else {
      this.notificationsElement.appendChild(atom.views.getView(notification).element);
      if (this.notificationsLog != null) {
        this.notificationsLog.addNotification(notification);
      }
    }

    notification.setDisplayed(true);
    return this.lastNotification = notification;
  }
};

var isCoreOrPackageStackTrace = function(stack) {
  if (StackTraceParser == null) { StackTraceParser = require('stacktrace-parser'); }
  for (var {file} of Array.from(StackTraceParser.parse(stack))) {
    if ((file === '<embedded>') || fs.isAbsolute(file)) {
      return true;
    }
  }
  return false;
};

module.exports = Notifications;
