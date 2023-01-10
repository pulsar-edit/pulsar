const _ = require('underscore-plus')
const {CompositeDisposable, Disposable} = require('atom')
const Tips = require('./tips')

const TEMPLATE = `\
<ul class="centered background-message">
  <li class="message"></li>
</ul>\
`

module.exports =
class BackgroundTipsElement {
  constructor () {
    this.element = document.createElement('background-tips')
    this.index = -1
    this.workspaceCenter = atom.workspace.getCenter()

    this.startDelay = 1000
    this.displayDuration = 10000
    this.fadeDuration = 300

    this.disposables = new CompositeDisposable()

    const visibilityCallback = () => this.updateVisibility()

    this.disposables.add(this.workspaceCenter.onDidAddPane(visibilityCallback))
    this.disposables.add(this.workspaceCenter.onDidDestroyPane(visibilityCallback))
    this.disposables.add(this.workspaceCenter.onDidChangeActivePaneItem(visibilityCallback))

    atom.getCurrentWindow().on('blur', visibilityCallback)
    atom.getCurrentWindow().on('focus', visibilityCallback)

    this.disposables.add(new Disposable(() => atom.getCurrentWindow().removeListener('blur', visibilityCallback)))
    this.disposables.add(new Disposable(() => atom.getCurrentWindow().removeListener('focus', visibilityCallback)))

    this.startTimeout = setTimeout(() => this.start(), this.startDelay)
  }

  destroy () {
    this.stop()
    this.disposables.dispose()
  }

  attach () {
    this.element.innerHTML = TEMPLATE
    this.message = this.element.querySelector('.message')

    const paneView = atom.views.getView(this.workspaceCenter.getActivePane())
    const itemViews = paneView.querySelector('.item-views')
    let top = 0
    if (itemViews && itemViews.offsetTop) {
      top = itemViews.offsetTop
    }

    this.element.style.top = top + 'px'
    paneView.appendChild(this.element)
  }

  detach () {
    this.element.remove()
  }

  updateVisibility () {
    if (this.shouldBeAttached()) {
      this.start()
    } else {
      this.stop()
    }
  }

  shouldBeAttached () {
    return this.workspaceCenter.getPanes().length === 1 &&
    this.workspaceCenter.getActivePaneItem() == null &&
    atom.getCurrentWindow().isFocused()
  }

  start () {
    if (!this.shouldBeAttached() || this.interval != null) return
    this.renderTips()
    this.randomizeIndex()
    this.attach()
    this.showNextTip()
    this.interval = setInterval(() => this.showNextTip(), this.displayDuration)
  }

  stop () {
    this.element.remove()
    if (this.interval != null) {
      clearInterval(this.interval)
    }

    clearTimeout(this.startTimeout)
    clearTimeout(this.nextTipTimeout)
    this.interval = null
  }

  randomizeIndex () {
    const len = Tips.length
    this.index = Math.round(Math.random() * len) % len
  }

  showNextTip () {
    this.index = ++this.index % Tips.length
    this.message.classList.remove('fade-in')
    this.nextTipTimeout = setTimeout(() => {
      this.message.innerHTML = Tips[this.index]
      this.message.classList.add('fade-in')
    }, this.fadeDuration)
  }

  renderTips () {
    if (this.tipsRendered) return
    for (let i = 0; i < Tips.length; i++) {
      const tip = Tips[i]
      Tips[i] = this.renderTip(tip)
    }
    this.tipsRendered = true
  }

  renderTip (str) {
    str = str.replace(/\{(.+)\}/g, (match, command) => {
      let binding, scope
      const scopeAndCommand = command.split('>')
      if (scopeAndCommand.length > 1) {
        [scope, command] = scopeAndCommand
      }
      const bindings = atom.keymaps.findKeyBindings({command: command.trim()})

      if (scope) {
        for (binding of bindings) {
          if (binding.selector === scope) break
        }
      } else {
        binding = this.getKeyBindingForCurrentPlatform(bindings)
      }

      if (binding && binding.keystrokes) {
        const keystrokeLabel = _.humanizeKeystroke(binding.keystrokes).replace(/\s+/g, '&nbsp')
        return `<span class="keystroke">${keystrokeLabel}</span>`
      } else {
        return command
      }
    })
    return str
  }

  getKeyBindingForCurrentPlatform (bindings) {
    if (!bindings || !bindings.length) return
    for (let binding of bindings) {
      if (binding.selector.indexOf(process.platform) !== -1) {
        return binding
      }
    }
    return bindings[0]
  }
}
