/** @babel */
/** @jsx etch.dom */

import path from 'path'
import etch from 'etch'

export default class CachePanelView {
  constructor () {
    etch.initialize(this)
  }

  update () {}

  destroy () {
    return etch.destroy(this)
  }

  render () {
    return (
      <div className='tool-panel padded package-panel'>
        <div className='inset-panel'>
          <div className='panel-heading'>Compile Cache</div>
          <div className='panel-body padded'>
            <div className='timing'>
              <span className='inline-block'>CoffeeScript files compiled</span>
              <span className='inline-block' ref='coffeeCompileCount'>Loading…</span>
            </div>

            <div className='timing'>
              <span className='inline-block'>Babel files compiled</span>
              <span className='inline-block' ref='babelCompileCount'>Loading…</span>
            </div>

            <div className='timing'>
              <span className='inline-block'>Typescript files compiled</span>
              <span className='inline-block' ref='typescriptCompileCount'>Loading…</span>
            </div>

            <div className='timing'>
              <span className='inline-block'>CSON files compiled</span>
              <span className='inline-block' ref='csonCompileCount'>Loading…</span>
            </div>

            <div className='timing'>
              <span className='inline-block'>Less files compiled</span>
              <span className='inline-block' ref='lessCompileCount'>Loading…</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  populate () {
    const compileCacheStats = this.getCompileCacheStats()
    if (compileCacheStats) {
      this.refs.coffeeCompileCount.classList.add('highlight-info')
      this.refs.coffeeCompileCount.textContent = compileCacheStats['.coffee'].misses
      this.refs.babelCompileCount.classList.add('highlight-info')
      this.refs.babelCompileCount.textContent = compileCacheStats['.js'].misses
      this.refs.typescriptCompileCount.classList.add('highlight-info')
      this.refs.typescriptCompileCount.textContent = compileCacheStats['.ts'].misses
    }

    this.refs.csonCompileCount.classList.add('highlight-info')
    this.refs.csonCompileCount.textContent = this.getCsonCompiles()
    this.refs.lessCompileCount.classList.add('highlight-info')
    this.refs.lessCompileCount.textContent = this.getLessCompiles()
  }

  getCompileCacheStats () {
    try {
      return require(path.join(atom.getLoadSettings().resourcePath, 'src', 'compile-cache')).getCacheStats()
    } catch (error) {
      return null
    }
  }

  getCsonCompiles () {
    try {
      const CSON = require(path.join(atom.getLoadSettings().resourcePath, 'node_modules', 'season'))
      if (CSON.getCacheMisses) {
        return CSON.getCacheMisses() || 0
      } else {
        return 0
      }
    } catch (error) {
      return 0
    }
  }

  getLessCompiles () {
    const lessCache = atom.themes.lessCache
    if (lessCache && lessCache.cache && lessCache.cache.stats && lessCache.cache.stats.misses) {
      return lessCache.cache.stats.misses || 0
    } else {
      return 0
    }
  }
}
