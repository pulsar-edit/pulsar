/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const fs = require('fs-plus');
const path = require('path');
const temp = require('temp').track();

const fileIcons = require('../lib/default-file-icons');

describe('DefaultFileIcons', function() {
  it('defaults to text', () => expect(fileIcons.iconClassForPath('foo.bar')).toEqual('icon-file-text'));

  it('recognizes READMEs', () => expect(fileIcons.iconClassForPath('README.md')).toEqual('icon-book'));

  it('recognizes compressed files', () => expect(fileIcons.iconClassForPath('foo.zip')).toEqual('icon-file-zip'));

  it('recognizes image files', () => expect(fileIcons.iconClassForPath('foo.png')).toEqual('icon-file-media'));

  it('recognizes PDF files', () => expect(fileIcons.iconClassForPath('foo.pdf')).toEqual('icon-file-pdf'));

  it('recognizes binary files', () => expect(fileIcons.iconClassForPath('foo.exe')).toEqual('icon-file-binary'));

  return describe('symlinks', function() {
    let [tempDir] = [];

    beforeEach(() => tempDir = temp.mkdirSync('atom-tree-view'));

    it('recognizes symlinks', function() {
      const filePath = path.join(tempDir, 'foo.bar');
      const linkPath = path.join(tempDir, 'link.bar');
      fs.writeFileSync(filePath, '');
      fs.symlinkSync(filePath, linkPath, 'junction');

      return expect(fileIcons.iconClassForPath(linkPath)).toEqual('icon-file-symlink-file');
    });

    return it('recognizes as symlink instead of other types', function() {
      const filePath = path.join(tempDir, 'foo.zip');
      const linkPath = path.join(tempDir, 'link.zip');
      fs.writeFileSync(filePath, '');
      fs.symlinkSync(filePath, linkPath, 'junction');

      return expect(fileIcons.iconClassForPath(linkPath)).toEqual('icon-file-symlink-file');
    });
  });
});
