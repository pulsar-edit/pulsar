/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let NotificationsLogItem;
const {Emitter, CompositeDisposable, Disposable} = require('atom');
const moment = require('moment');

module.exports = (NotificationsLogItem = (function() {
  NotificationsLogItem = class NotificationsLogItem {
    static initClass() {
      this.prototype.subscriptions = null;
      this.prototype.timestampInterval = null;
    }

    constructor(notification) {
      this.notification = notification;
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.render();
    }

    render() {
      const notificationView = atom.views.getView(this.notification);
      const notificationElement = this.renderNotification(notificationView);

      this.timestamp = document.createElement('div');
      this.timestamp.classList.add('timestamp');
      this.notification.moment = moment(this.notification.getTimestamp());
      this.subscriptions.add(atom.tooltips.add(this.timestamp, {title: this.notification.moment.format("ll LTS")}));
      this.updateTimestamp();
      this.timestampInterval = setInterval(this.updateTimestamp.bind(this), 60 * 1000);
      this.subscriptions.add(new Disposable(() => clearInterval(this.timestampInterval)));

      this.element = document.createElement('li');
      this.element.classList.add('notifications-log-item', this.notification.getType());
      this.element.appendChild(notificationElement);
      this.element.appendChild(this.timestamp);
      this.element.addEventListener('click', e => {
        if (e.target.closest('.btn-toolbar a, .btn-toolbar button') == null) {
          return this.emitter.emit('click');
        }
      });

      this.element.getRenderPromise = () => notificationView.getRenderPromise();
      if (this.notification.getType() === 'fatal') {
        notificationView.getRenderPromise().then(() => {
          return this.element.replaceChild(this.renderNotification(notificationView), notificationElement);
        });
      }

      return this.subscriptions.add(new Disposable(() => this.element.remove()));
    }

    renderNotification(view) {
      const message = document.createElement('div');
      message.classList.add('message');
      message.innerHTML = view.element.querySelector(".content > .message").innerHTML;

      const buttons = document.createElement('div');
      buttons.classList.add('btn-toolbar');
      const nButtons = view.element.querySelector(".content > .meta > .btn-toolbar");
      if (nButtons != null) {
        for (var button of Array.from(nButtons.children)) {
          var logButton = button.cloneNode(true);
          logButton.originalButton = button;
          logButton.addEventListener('click', function(e) {
            const newEvent = new MouseEvent('click', e);
            return e.target.originalButton.dispatchEvent(newEvent);
          });
          for (var tooltip of Array.from(atom.tooltips.findTooltips(button))) {
            this.subscriptions.add(atom.tooltips.add(logButton, tooltip.options));
          }
          buttons.appendChild(logButton);
        }
      }

      const nElement = document.createElement('div');
      nElement.classList.add('notifications-log-notification', 'icon', `icon-${this.notification.getIcon()}`, this.notification.getType());
      nElement.appendChild(message);
      nElement.appendChild(buttons);
      return nElement;
    }

    getElement() { return this.element; }

    destroy() {
      this.subscriptions.dispose();
      return this.emitter.emit('did-destroy');
    }

    onClick(callback) {
      return this.emitter.on('click', callback);
    }

    onDidDestroy(callback) {
      return this.emitter.on('did-destroy', callback);
    }

    updateTimestamp() {
      return this.timestamp.textContent = this.notification.moment.fromNow();
    }
  };
  NotificationsLogItem.initClass();
  return NotificationsLogItem;
})());
