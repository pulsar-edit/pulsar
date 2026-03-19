/** @babel */
/** @jsx etch.dom */

import {CompositeDisposable, Disposable} from 'atom'
import etch from 'etch'
import {shell} from 'electron'

export default class BadgeView {
  constructor(badge) {
    this.badge = badge;
    this.disposables = new CompositeDisposable()

    etch.initialize(this)

    // Intercept the click request and manually open this URL in a web browser.
    let clickHandler = (event) => {
      let anchor = event.target.closest('a')
      if (!anchor) return
      event.stopPropagation()
      event.preventDefault()
      shell.openExternal(anchor.href)
    }

    if (this.hasLink()) {
      this.refs.badgeLink.addEventListener('click', clickHandler)
      this.disposables.add(new Disposable(() => {
        this.refs.badgeLink.removeEventListener('click', clickHandler)
      }))
    }
  }

  destroy () {
    this.disposables.dispose()
    return etch.destroy(this)
  }

  render () {
    const icons = this.getIcons();
    const classes = this.getClasses();
    const badge = this.badge;

    if (this.hasLink()) {
      if (this.hasText()) {
        // Link and Text

        return (
          <a href={badge.link} ref="badgeLink">
            <span class={classes}>
              <i class={icons}></i>
              {badge.title}: <span class="badge-expandable">...</span><span class="badge-text"> {badge.text}</span>
            </span>
          </a>
        );
      } else {
        // Link no text

        return (
          <a href={badge.link}>
            <span class={classes}>
              <i class={icons}></i>
              {badge.title}
            </span>
          </a>
        );
      }
    } else {
      if (this.hasText()) {
        // No Link, has Text

        return (
          <span class={classes}>
            <i class={icons}></i>
            {badge.title}: <span class="badge-expandable">...</span><span class="badge-text"> {badge.text}</span>
          </span>
        );
      } else {
        // No Link, no text

        return (
          <span class={classes}>
            <i class={icons}></i>
            {badge.title}
          </span>
        );
      }
    }

  }

  hasLink () {
    if (typeof this.badge.link === "string") {
      return true;
    }
    return false;
  }

  hasText () {
    if (typeof this.badge.text === "string") {
      return true;
    }
    return false;
  }

  getIcons () {
    switch(this.badge.type) {
      case "warn":
        return "icon icon-alert";
        break;
      case "success":
        return "icon icon-check";
        break;
      case "info":
        return "icon icon-info";
        break;
      default:
        return "";
        break;
    }
  }

  getClasses () {
    switch(this.badge.type) {
      case "warn":
        return "badge badge-error";
        break;
      case "success":
        return "badge badge-success";
        break;
      case "info":
        return "badge badge-info";
        break;
      default:
        return "badge";
        break;
    }
  }

  update () {}

}
