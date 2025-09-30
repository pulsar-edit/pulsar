/** @babel */
/** @jsx etch.dom */

import {CompositeDisposable} from 'atom'
import etch from 'etch'

export default class WindowPanelView {
  constructor () {
    etch.initialize(this)

    this.disposables = new CompositeDisposable()
    this.disposables.add(atom.tooltips.add(this.refs.shellTiming, {title: 'The time taken to launch the app'}))
    this.disposables.add(atom.tooltips.add(this.refs.windowTiming, {title: 'The time taken to load this window'}))
    this.disposables.add(atom.tooltips.add(this.refs.projectTiming, {title: 'The time taken to rebuild the previously opened buffers'}))
    this.disposables.add(atom.tooltips.add(this.refs.workspaceTiming, {title: 'The time taken to rebuild the previously opened editors'}))
    this.disposables.add(atom.tooltips.add(this.refs.localeTiming, {title: 'The time taken to load core locales'}))
  }

  update () {}

  destroy () {
    this.disposables.dispose()
    return etch.destroy(this)
  }

  render () {
    return (
      <div className='tool-panel padded package-panel'>
        <div className='inset-panel'>
          <div className='panel-heading'>{atom.i18n.t("timecop.window-panel-view.startup-time")}</div>
          <div className='panel-body padded'>
            <div className='timing' ref='shellTiming'>
              <span className='inline-block'>{atom.i18n.t("timecop.window-panel-view.load-time", { type: "Shell"})}</span>
              <span className='inline-block' ref='shellLoadTime'>{atom.i18n.t("timecop.common.loading")}</span>
            </div>

            <div className='timing' ref='windowTiming'>
              <span className='inline-block'>{atom.i18n.t("timecop.window-panel-view.load-time", { type: "Window"})}</span>
              <span className='inline-block' ref='windowLoadTime'>{atom.i18n.t("timecop.common.loading")}</span>
            </div>

            <div ref='deserializeTimings'>
              <div className='timing' ref='projectTiming'>
                <span className='inline-block'>{atom.i18n.t("timecop.window-panel-view.load-time", { type: "Project"})}</span>
                <span className='inline-block' ref='projectLoadTime'>{atom.i18n.t("timecop.common.loading")}</span>
              </div>

              <div className='timing' ref='workspaceTiming'>
                <span className='inline-block'>{atom.i18n.t("timecop.window-panel-view.load-time", { type: "Workspace"})}</span>
                <span className='inline-block' ref='workspaceLoadTime'>{atom.i18n.t("timecop.common.loading")}</span>
              </div>
            </div>

            <div className='timing' ref='localeTiming'>
              <span className='inline-block'>Locale load time</span>
              <span className='inline-block' ref='localeLoadTime'>Loading…</span>
            </div>

          </div>
        </div>
      </div>
    )
  }

  populate () {
    const time = atom.getWindowLoadTime()
    this.refs.windowLoadTime.classList.add(this.getHighlightClass(time))
    this.refs.windowLoadTime.textContent = `${time}ms`

    const {shellLoadTime} = atom.getLoadSettings()
    if (shellLoadTime != null) {
      this.refs.shellLoadTime.classList.add(this.getHighlightClass(shellLoadTime))
      this.refs.shellLoadTime.textContent = `${shellLoadTime}ms`
    } else {
      this.refs.shellTiming.style.display = 'none'
    }

    if (atom.deserializeTimings.project != null) {
      // Project and workspace timings only exist if the current project was previously opened
      this.refs.projectLoadTime.classList.add(this.getHighlightClass(atom.deserializeTimings.project))
      this.refs.projectLoadTime.textContent = `${atom.deserializeTimings.project}ms`
      this.refs.workspaceLoadTime.classList.add(this.getHighlightClass(atom.deserializeTimings.workspace))
      this.refs.workspaceLoadTime.textContent = `${atom.deserializeTimings.workspace}ms`
    } else {
      this.refs.deserializeTimings.style.display = 'none'
    }

    const localeLoadTime = atom.localeLoadTime;
    this.refs.localeLoadTime.classList.add(this.getHighlightClass(localeLoadTime))
    this.refs.localeLoadTime.textContent = `${localeLoadTime}ms`
  }

  getHighlightClass (time) {
    if (time > 1000) {
      return 'highlight-error'
    } else if (time > 800) {
      return 'highlight-warning'
    } else {
      return 'highlight-info'
    }
  }
}
