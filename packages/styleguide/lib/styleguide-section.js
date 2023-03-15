/** @babel */
/** @jsx etch.dom */

import etch from 'etch'

export default class StyleguideSection {
  constructor (props, children) {
    this.collapsed = props.collapsed
    this.title = props.title
    this.name = props.name
    this.children = children
    etch.initialize(this)
    if (props.onDidInitialize) {
      props.onDidInitialize(this)
    }
  }

  render () {
    if (this.loaded) {
      let className = 'bordered'
      if (this.collapsed) {
        className += ' collapsed'
      }
      return (
        <section className={className} dataset={{name: this.name}}>
          <h1 className='section-heading' onclick={() => this.toggle()}>{this.title}</h1>
          {this.children}
        </section>
      )
    } else {
      return (
        <section className='bordered collapsed' dataset={{name: this.name}}>
          <h1 className='section-heading' onclick={() => this.toggle()}>{this.title}</h1>
        </section>
      )
    }
  }

  update (props, children) {
    if (props.title) {
      this.title = props.title
    }

    if (props.name) {
      this.name = props.name
    }

    if (children) {
      this.children = children
    }

    if (props.didExpandOrCollapseSection) {
      this.didExpandOrCollapseSection = props.onDidExpandOrCollapseSection
    }

    return etch.update(this)
  }

  toggle () {
    return this.collapsed ? this.expand() : this.collapse()
  }

  expand () {
    this.collapsed = false
    this.loaded = true
    return etch.update(this)
  }

  collapse () {
    this.collapsed = true
    return etch.update(this)
  }
}
