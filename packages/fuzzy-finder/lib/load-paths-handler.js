/* global emit */

const async = require('async')
const fs = require('fs')
const os = require('os')
const path = require('path')
const {GitRepository} = require('atom')
const {Minimatch} = require('minimatch')
const childProcess = require('child_process')
const { rgPath } = require('vscode-ripgrep')

const PathsChunkSize = 100

// Use the unpacked path if the ripgrep binary is in asar archive.
const realRgPath = rgPath.replace(/\bapp\.asar\b/, 'app.asar.unpacked')

// Define the maximum number of concurrent crawling processes based on the number of CPUs
// with a maximum value of 8 and minimum of 1.
const MaxConcurrentCrawls = Math.min(Math.max(os.cpus().length - 1, 8), 1)

const trackedPaths = new Set()
const ignoredPaths = new Set()

class PathLoader {
  constructor (rootPath, options) {
    this.rootPath = rootPath
    this.ignoreVcsIgnores = options.ignoreVcsIgnores
    this.traverseSymlinkDirectories = options.followSymlinks
    this.ignoredNames = options.ignoredNames
    this.useRipGrep = options.useRipGrep
    this.indexIgnoredPaths = options.indexIgnoredPaths
    this.paths = []
    this.ignoredPaths = []
    this.inodes = new Set()
    this.repo = null
    if (this.ignoreVcsIgnores && !this.useRipGrep) {
      const repo = GitRepository.open(this.rootPath, {refreshOnWindowFocus: false})
      if ((repo && repo.relativize(path.join(this.rootPath, 'test'))) === 'test') {
        this.repo = repo
      }
    }
  }

  load (done) {
    if (this.useRipGrep) {
      // first, load tracked paths and populate the set of tracked paths
      // then, load all paths (tracked and not), using the above set to differentiate
      this.loadFromRipGrep()
        .then(() => this.indexIgnoredPaths && this.loadFromRipGrep({loadIgnoredPaths: true}))
        .then(done)

      return
    }

    this.loadPath(this.rootPath, true, () => {
      this.flushPaths()
      if (this.repo != null) this.repo.destroy()
      done()
    })
  }

  async loadFromRipGrep (options = {}) {
    return new Promise((resolve) => {
      const args = ['--files', '--hidden', '--sort', 'path']

      if (!this.ignoreVcsIgnores || options.loadIgnoredPaths) {
        args.push('--no-ignore')
      }

      if (this.traverseSymlinkDirectories) {
        args.push('--follow')
      }

      if (! options.loadIgnoredPaths) {
          for (let ignoredName of this.ignoredNames) {
            args.push('-g', '!' + ignoredName.pattern)
          }
      }

      if (this.ignoreVcsIgnores) {
        if (!args.includes('!.git')) args.push('-g', '!.git')
        if (!args.includes('!.hg')) args.push('-g', '!.hg')
      }

      let output = ''
      const result = childProcess.spawn(realRgPath, args, {cwd: this.rootPath})

      result.stdout.on('data', chunk => {
        const files = (output + chunk).split('\n')
        output = files.pop()

        for (const file of files) {
          let loadedPath = path.join(this.rootPath, file)
          if (options.loadIgnoredPaths) {
            this.ignoredPathLoaded(loadedPath)
          } else {
            this.trackedPathLoaded(loadedPath)
          }
        }
      })
      result.stderr.on('data', () => {
        // intentionally ignoring errors for now
      })
      result.on('close', () => {
        this.flushPaths()
        resolve()
      })
    })
  }

  isIgnored (loadedPath) {
    const relativePath = path.relative(this.rootPath, loadedPath)
    if (this.repo && this.repo.isPathIgnored(relativePath)) {
      return true
    } else {
      for (let ignoredName of this.ignoredNames) {
        if (ignoredName.match(relativePath)) return true
      }
    }
  }

  trackedPathLoaded (loadedPath, done) {
    if (!trackedPaths.has(loadedPath)) {
      trackedPaths.add(loadedPath)
      this.paths.push(loadedPath)
    }

    if (this.paths.length === PathsChunkSize) {
      this.flushPaths()
    }

    done && done()
  }

  ignoredPathLoaded (loadedPath, done) {
    if (trackedPaths.has(loadedPath)) {
        return
    }

    if (!ignoredPaths.has(loadedPath)) {
      ignoredPaths.add(loadedPath)
      this.ignoredPaths.push(loadedPath)
    }

    if (this.ignoredPaths.length === PathsChunkSize) {
      this.flushPaths()
    }

    done && done()
  }

  flushPaths () {
    emit('load-paths:paths-found', {paths: this.paths, ignoredPaths: this.ignoredPaths})
    this.paths = []
    this.ignoredPaths = []
  }

  loadPath (pathToLoad, root, done) {
    const isIgnored = this.isIgnored(pathToLoad)
    if (isIgnored && !this.indexIgnoredPaths && !root) return done()

    fs.lstat(pathToLoad, (error, stats) => {
      if (error != null) { return done() }
      if (stats.isSymbolicLink()) {
        fs.stat(pathToLoad, (error, stats) => {
          if (error != null) return done()
          if (this.inodes.has(stats.ino)) {
            return done()
          } else {
            this.inodes.add(stats.ino)
          }

          if (stats.isFile()) {
            if (!isIgnored ) {
              this.trackedPathLoaded(pathToLoad, done)
            } else if (this.indexIgnoredPaths) {
              this.ignoredPathLoaded(pathToLoad, done)
            } else {
              done()
            }
          } else if (stats.isDirectory()) {
            if (this.traverseSymlinkDirectories) {
              this.loadFolder(pathToLoad, done)
            } else {
              done()
            }
          } else {
            done()
          }
        })
      } else {
        this.inodes.add(stats.ino)
        if (stats.isDirectory()) {
          // descend into the .git dir only if we're including ignored paths
          // FIXME this it not correct if the repo dir is non-default
          // FIXME / is not platform agnostic
          if (!pathToLoad.match(/(^|\/)\.git/) || !this.ignoreVcsIgnores) {
            this.loadFolder(pathToLoad, done)
          } else {
            done()
          }
        } else if (stats.isFile()) {
          if (!isIgnored) {
            this.trackedPathLoaded(pathToLoad, done)
          } else if (this.indexIgnoredPaths) {
            this.ignoredPathLoaded(pathToLoad, done)
          } else {
            done()
          }
        } else {
          done()
        }
      }
    })
  }

  loadFolder (folderPath, done) {
    fs.readdir(folderPath, (_, children = []) => {
      async.each(
        children,
        (childName, next) => {
          this.loadPath(path.join(folderPath, childName), false, next)
        },
        done
      )
    })
  }
}

module.exports = function (rootPaths, options) {
  const ignoredNameMatchers = []
  for (let ignore of options.ignoredNames) {
    if (ignore) {
      try {
        ignoredNameMatchers.push(new Minimatch(ignore, {matchBase: true, dot: true}))
      } catch (error) {
        console.warn(`Error parsing ignore pattern (${ignore}): ${error.message}`)
      }
    }
  }
  options.ignoredNames = ignoredNameMatchers

  async.eachLimit(
    rootPaths,
    MaxConcurrentCrawls,
    (rootPath, next) => new PathLoader(rootPath, options).load(next),
    this.async()
  )
}
