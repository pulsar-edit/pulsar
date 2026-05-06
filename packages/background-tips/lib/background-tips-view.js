const _ = require('underscore-plus');
const { CompositeDisposable } = require('atom');

const TEMPLATE = `\
<ul class="centered background-message">
  <li class="message"></li>
</ul>`;

module.exports = class BackgroundTipsElement {
  constructor() {
    this.element = document.createElement('background-tips');
    this.index = -1;
    this.workspaceCenter = atom.workspace.getCenter();
    this.startDelay = 1000;
    this.fadeDuration = 300;
    this.tips = [];
    this.tipSources = [];
    this.disposables = new CompositeDisposable();
    const visibilityCallback = () => this.updateVisibility();
    this.disposables.add(
      this.workspaceCenter.onDidAddPane(visibilityCallback),
      this.workspaceCenter.onDidDestroyPane(visibilityCallback),
      this.workspaceCenter.onDidChangeActivePaneItem(visibilityCallback),
      atom.config.observe('background-tips.displayDuration', (value) => {
        this.displayDuration = value * 1000;
      }),
    );
    this.startTimeout = setTimeout(() => this.start(), this.startDelay);
  }

  destroy() {
    this.stop();
    this.disposables.dispose();
  }

  attach() {
    this.element.innerHTML = TEMPLATE;
    this.message = this.element.querySelector('.message');
    const paneView = atom.views.getView(this.workspaceCenter.getActivePane());
    const itemViews = paneView.querySelector('.item-views');
    let top = 0;
    if (itemViews && itemViews.offsetTop) {
      top = itemViews.offsetTop;
    }
    this.element.style.top = top + 'px';
    paneView.appendChild(this.element);
  }

  updateVisibility() {
    if (this.shouldBeAttached()) {
      this.start();
    } else {
      this.stop();
    }
  }

  shouldBeAttached() {
    return (
      this.workspaceCenter.getPanes().length === 1 &&
      this.workspaceCenter.getActivePaneItem() == null
    );
  }

  start() {
    if (!this.shouldBeAttached() || this.interval != null) return;
    if (this.tips.length === 0) return;
    this.randomizeIndex();
    this.attach();
    this.showNextTip();
    this.interval = setInterval(() => this.showNextTip(), this.displayDuration);
  }

  stop() {
    this.element.remove();
    if (this.interval != null) {
      clearInterval(this.interval);
    }
    clearTimeout(this.startTimeout);
    clearTimeout(this.nextTipTimeout);
    this.interval = null;
  }

  randomizeIndex() {
    const len = this.tips.length;
    this.index = len > 0 ? Math.round(Math.random() * len) % len : 0;
  }

  showNextTip() {
    if (this.tips.length === 0) return;
    let html = null;
    for (let i = 0; i < this.tips.length; i++) {
      this.index = (this.index + 1) % this.tips.length;
      if (atom.packages.isPackageDisabled(this.tipSources[this.index])) continue;
      html = this.renderTip(this.tips[this.index]);
      if (html !== null) break;
      this.log(`Skipping tip (missing keybinding): "${this.tips[this.index]}"`);
    }
    if (html === null) {
      this.stop();
      return;
    }
    this.message.classList.remove('fade-in');
    this.nextTipTimeout = setTimeout(() => {
      this.log(`Displaying tip [${this.index + 1}/${this.tips.length}]: "${this.tips[this.index]}"`);
      this.message.innerHTML = html;
      this.message.classList.add('fade-in');
    }, this.fadeDuration);
  }

  addPackageTips(pkg) {
    if (atom.packages.isPackageDisabled(pkg.name)) return;
    const raw = pkg.metadata.backgroundTips;
    if (!Array.isArray(raw) || raw.length === 0) return;
    for (const tip of raw) {
      this.tips.push(tip);
      this.tipSources.push(pkg.name);
    }
    this.log(`Package "${pkg.name}" added ${raw.length} tip(s), total: ${this.tips.length}`);
    if (this.interval == null) this.start();
  }

  removePackageTips(pkg) {
    const keep = [];
    const keepSources = [];
    for (let i = 0; i < this.tips.length; i++) {
      if (this.tipSources[i] !== pkg.name) {
        keep.push(this.tips[i]);
        keepSources.push(this.tipSources[i]);
      }
    }
    const removed = this.tips.length - keep.length;
    if (removed === 0) return;
    this.log(`Package "${pkg.name}" removed ${removed} tip(s), total: ${keep.length}`);
    this.tips = keep;
    this.tipSources = keepSources;
    if (this.interval != null) {
      if (this.tips.length === 0) {
        this.stop();
      } else {
        this.index = Math.min(this.index, this.tips.length - 1);
      }
    }
  }

  renderTip(str) {
    let missing = false;
    const html = str.replace(/\{(.+)\}/g, (match, command) => {
      let binding, scope;
      const scopeAndCommand = command.split('>');
      if (scopeAndCommand.length > 1) {
        [scope, command] = scopeAndCommand;
      }
      const bindings = atom.keymaps.findKeyBindings({ command: command.trim() });
      if (scope) {
        for (binding of bindings) {
          if (binding.selector === scope) break;
        }
      } else {
        binding = this.getKeyBindingForCurrentPlatform(bindings);
      }
      if (binding && binding.keystrokes) {
        const keystrokeLabel = _.humanizeKeystroke(binding.keystrokes).replace(/\s+/g, '&nbsp');
        return `<span class="keystroke">${keystrokeLabel}</span>`;
      } else {
        missing = true;
        return '';
      }
    });
    return missing ? null : html;
  }

  getKeyBindingForCurrentPlatform(bindings) {
    if (!bindings || !bindings.length) return;
    for (const binding of bindings) {
      if (binding.selector.indexOf(process.platform) !== -1) {
        return binding;
      }
    }
    return bindings[0];
  }

  log(...args) {
    if (atom.config.get('background-tips.debug')) {
      console.log('[background-tips]', ...args);
    }
  }
};
