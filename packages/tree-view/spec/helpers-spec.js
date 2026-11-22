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

  describe('withoutDescendants', () => {
    const root = path.resolve(path.sep, 'project')
    const a = path.join(root, 'a')
    const ab = path.join(root, 'ab')
    const aChild = path.join(a, 'child')
    const aGrandchild = path.join(aChild, 'grandchild')
    const b = path.join(root, 'b')

    it('removes paths inside another path in the list, at any depth', () => {
      expect(helpers.withoutDescendants([a, aChild, aGrandchild, b])).toEqual([a, b])
    })

    it('removes a descendant even when it comes before its ancestor', () => {
      expect(helpers.withoutDescendants([aGrandchild, b, a])).toEqual([b, a])
    })

    it('keeps siblings whose names share a prefix', () => {
      expect(helpers.withoutDescendants([a, ab])).toEqual([a, ab])
    })

    it('removes exact duplicates, keeping the first', () => {
      expect(helpers.withoutDescendants([b, a, b])).toEqual([b, a])
    })

    it('treats an ancestor with a trailing separator as an ancestor', () => {
      expect(helpers.withoutDescendants([a + path.sep, aChild])).toEqual([a + path.sep])
    })

    it('returns an empty list for an empty list', () => {
      expect(helpers.withoutDescendants([])).toEqual([])
    })
  })
})
