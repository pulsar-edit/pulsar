const {it, fit, ffit, beforeEach, afterEach} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

const path = require('path')

const helpers = require('../lib/helpers')

describe('Helpers', () => {
  describe('repoForPath', () => {
    let fixturesPath, fixturesRepo

    beforeEach(async () => {
      fixturesPath = atom.project.getPaths()[0]
      fixturesRepo = await atom.project.repositoryForDirectory(atom.project.getDirectories()[0])
    })

    it('returns the repository for a given project path', () => {
      expect(helpers.repoForPath(fixturesPath)).toEqual(fixturesRepo)
    })

    it('returns the project repository for a subpath', () => {
      expect(helpers.repoForPath(path.join(fixturesPath, 'root-dir1', 'tree-view.txt'))).toEqual(fixturesRepo)
    })

    it('returns null for a path outside the project', () => {
      expect(helpers.repoForPath(path.join(fixturesPath, '..'))).toEqual(null)
    })
  })

  describe('getFullExtension', () => {
    it('returns the extension for a simple file', () => {
      expect(helpers.getFullExtension('filename.txt')).toBe('.txt')
    })

    it('returns the extension for a path', () => {
      expect(helpers.getFullExtension(path.join('path', 'to', 'filename.txt'))).toBe('.txt')
    })

    it('returns the full extension for a filename with more than one extension', () => {
      expect(helpers.getFullExtension('index.html.php')).toBe('.html.php')
      expect(helpers.getFullExtension('archive.tar.gz.bak')).toBe('.tar.gz.bak')
    })

    it('returns no extension when the filename begins with a period', () => {
      expect(helpers.getFullExtension('.gitconfig')).toBe('')
      expect(helpers.getFullExtension(path.join('path', 'to', '.gitconfig'))).toBe('')
    })
  })
})
