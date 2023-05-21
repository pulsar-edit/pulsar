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

const emittedPaths = new Set()

class PathLoader {
  constructor (rootPath, ignoreVcsIgnores, traverseSymlinkDirectories, ignoredNames, useRipGrep) {
    this.rootPath = rootPath
    this.ignoreVcsIgnores = ignoreVcsIgnores
    this.traverseSymlinkDirectories = traverseSymlinkDirectories
    this.ignoredNames = ignoredNames
    this.useRipGrep = useRipGrep
    this.paths = []
    this.inodes = new Set()
    this.repo = null
    if (ignoreVcsIgnores && !this.useRipGrep) {
      const repo = GitRepository.open(this.rootPath, {refreshOnWindowFocus: false})
      if ((repo && repo.relativize(path.join(this.rootPath, 'test'))) === 'test') {
        this.repo = repo
      }
    }
  }

  load (done) {
    if (this.useRipGrep) {
      this.loadFromRipGrep().then(done)

      return
    }

    this.loadPath(this.rootPath, true, () => {
      this.flushPaths()
      if (this.repo != null) this.repo.destroy()
      done()
    })
  }

  async loadFromRipGrep () {
    return new Promise((resolve) => {
      const args = ['--files', '--hidden', '--sort', 'path']

      if (!this.ignoreVcsIgnores) {
        args.push('--no-ignore')
      }

      if (this.traverseSymlinkDirectories) {
        args.push('--follow')
      }

      for (let ignoredName of this.ignoredNames) {
        args.push('-g', '!' + ignoredName.pattern)
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
          this.pathLoaded(path.join(this.rootPath, file))
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

  pathLoaded (loadedPath, done) {
    if (!emittedPaths.has(loadedPath)) {
      this.paths.push(loadedPath)
      emittedPaths.add(loadedPath)
    }

    if (this.paths.length === PathsChunkSize) {
      this.flushPaths()
    }
    done && done()
  }

  flushPaths () {
    emit('load-paths:paths-found', this.paths)
    this.paths = []
  }

  loadPath (pathToLoad, root, done) {
    if (this.isIgnored(pathToLoad) && !root) return done()

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
            this.pathLoaded(pathToLoad, done)
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
          this.loadFolder(pathToLoad, done)
        } else if (stats.isFile()) {
          this.pathLoaded(pathToLoad, done)
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

module.exports = function (rootPaths, followSymlinks, ignoreVcsIgnores, ignores, useRipGrep) {
  const ignoredNames = []
  for (let ignore of ignores) {
    if (ignore) {
      try {
        ignoredNames.push(new Minimatch(ignore, {matchBase: true, dot: true}))
      } catch (error) {
        console.warn(`Error parsing ignore pattern (${ignore}): ${error.message}`)
      }
    }
  }

  async.eachLimit(
    rootPaths,
    MaxConcurrentCrawls,
    (rootPath, next) =>
      new PathLoader(
        rootPath,
        ignoreVcsIgnores,
        followSymlinks,
        ignoredNames,
        useRipGrep
      ).load(next)
    ,
    this.async()
  )
}
