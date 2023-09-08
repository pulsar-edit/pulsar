
module.exports =
class LaunchModeView {
  constructor(param) {
    if (param == null) { param = {}; }
    const { safeMode, devMode } = param;
    this.element = document.createElement('status-bar-launch-mode');
    this.element.classList.add('inline-block', 'icon', 'icon-color-mode');
    if (devMode) {
      this.element.classList.add('text-error');
      this.tooltipDisposable = atom.tooltips.add(this.element, {title: 'This window is in dev mode'});
    } else if (safeMode) {
      this.element.classList.add('text-success');
      this.tooltipDisposable = atom.tooltips.add(this.element, {title: 'This window is in safe mode'});
    }
  }

  detachedCallback() {
    this.tooltipDisposable?.dispose();
  }
}
