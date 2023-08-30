/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let NotificationsLog;
const {Emitter, CompositeDisposable, Disposable} = require('atom');
const NotificationsLogItem = require('./notifications-log-item');

const typeIcons = {
  fatal: 'bug',
  error: 'flame',
  warning: 'alert',
  info: 'info',
  success: 'check'
};

module.exports = (NotificationsLog = (function() {
  NotificationsLog = class NotificationsLog {
    static initClass() {
      this.prototype.subscriptions = null;
      this.prototype.logItems = [];
      this.prototype.typesHidden = {
        fatal: false,
        error: false,
        warning: false,
        info: false,
        success: false
      };
    }

    constructor(duplicateTimeDelay, typesHidden = null) {
      this.duplicateTimeDelay = duplicateTimeDelay;
      if (typesHidden != null) { this.typesHidden = typesHidden; }
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.notifications.onDidClearNotifications(() => this.clearLogItems()));
      this.render();
      this.subscriptions.add(new Disposable(() => this.clearLogItems()));
    }

    render() {
      let button;
      this.element = document.createElement('div');
      this.element.classList.add('notifications-log');

      const header = document.createElement('header');
      this.element.appendChild(header);

      this.list = document.createElement('ul');
      this.list.classList.add('notifications-log-items');
      this.element.appendChild(this.list);

      for (var type in typeIcons) {
        var icon = typeIcons[type];
        button = document.createElement('button');
        button.classList.add('notification-type', 'btn', 'icon', `icon-${icon}`, type);
        button.classList.toggle('show-type', !this.typesHidden[type]);
        this.list.classList.toggle(`hide-${type}`, this.typesHidden[type]);
        button.dataset.type = type;
        button.addEventListener('click', e => this.toggleType(e.target.dataset.type));
        this.subscriptions.add(atom.tooltips.add(button, {title: `Toggle ${type} notifications`}));
        header.appendChild(button);
      }

      button = document.createElement('button');
      button.classList.add('notifications-clear-log', 'btn', 'icon', 'icon-trashcan');
      button.addEventListener('click', e => atom.commands.dispatch(atom.views.getView(atom.workspace), "notifications:clear-log"));
      this.subscriptions.add(atom.tooltips.add(button, {title: "Clear notifications"}));
      header.appendChild(button);

      let lastNotification = null;
      for (var notification of Array.from(atom.notifications.getNotifications())) {
        if (lastNotification != null) {
          // do not show duplicates unless some amount of time has passed
          var timeSpan = notification.getTimestamp() - lastNotification.getTimestamp();
          if (!(timeSpan < this.duplicateTimeDelay) || !notification.isEqual(lastNotification)) {
            this.addNotification(notification);
          }
        } else {
          this.addNotification(notification);
        }

        lastNotification = notification;
      }

      return this.subscriptions.add(new Disposable(() => this.element.remove()));
    }

    destroy() {
      this.subscriptions.dispose();
      return this.emitter.emit('did-destroy');
    }

    getElement() { return this.element; }

    getURI() { return 'atom://notifications/log'; }

    getTitle() { return 'Log'; }

    getLongTitle() { return 'Notifications Log'; }

    getIconName() { return 'alert'; }

    getDefaultLocation() { return 'bottom'; }

    getAllowedLocations() { return ['left', 'right', 'bottom']; }

    serialize() {
      return {
        typesHidden: this.typesHidden,
        deserializer: 'notifications/NotificationsLog'
      };
    }

    toggleType(type, force) {
      const button = this.element.querySelector(`.notification-type.${type}`);
      const hide = !button.classList.toggle('show-type', force);
      this.list.classList.toggle(`hide-${type}`, hide);
      return this.typesHidden[type] = hide;
    }

    addNotification(notification) {
      const logItem = new NotificationsLogItem(notification);
      logItem.onClick(() => this.emitter.emit('item-clicked', notification));
      this.logItems.push(logItem);
      return this.list.insertBefore(logItem.getElement(), this.list.firstChild);
    }

    onItemClick(callback) {
      return this.emitter.on('item-clicked', callback);
    }

    onDidDestroy(callback) {
      return this.emitter.on('did-destroy', callback);
    }

    clearLogItems() {
      for (var logItem of Array.from(this.logItems)) { logItem.destroy(); }
      return this.logItems = [];
    }
  };
  NotificationsLog.initClass();
  return NotificationsLog;
})());
