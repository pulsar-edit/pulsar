/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import { Disposable, CompositeDisposable } from 'atom'

export default class BadgeView {
  constructor(badge) {
    this.badge = badge;
    this.disposables = new CompositeDisposable()

    etch.initialize(this)
  }

  render () {
    const icons = this.getIcons();
    const classes = this.getClasses();
    const badge = this.badge;

    if (this.hasLink() && this.hasText()) {
      // Link and Text

      return (
        <a href={badge.link}>
          <span class={classes}>
            <i class={icons}></i>
            {badge.title}: <span class="badge-expandable">...</span><span class="badge-text"> {badge.text}</span>
          </span>
        </a>
      );

    } else if (this.hasLink() && !this.hasText()) {
      // Link no text

      return (
        <a href={badge.link}>
          <span class={classes}>
            <i class={icons}></i>
            {badge.title}
          </span>
        </a>
      );

    } else if (!this.hasLink() && this.hasText()) {
      // No Link, has text
      return (
        <span class={classes}>
          <i class={icons}></i>
          {badge.title}: <span class="badge-expandable">...</span><span class="badge-text"> {badge.text}</span>
        </span>
      );

    } else if (!this.hasLink() && !this.hasText()) {
      // No Link, no text

      return (
        <span class={classes}>
          <i class={icons}></i>
          {badge.title}
        </span>
      );

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

  destroy () {}

}
