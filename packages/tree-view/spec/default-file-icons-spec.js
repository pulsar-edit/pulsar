
const fs = require('fs-plus');
const path = require('path');
const temp = require('temp').track();

const fileIcons = require('../lib/default-file-icons');

describe('DefaultFileIcons', () => {
  it('defaults to text', () => expect(fileIcons.iconClassForPath('foo.bar')).toEqual('icon-file-text'));

  it('recognizes READMEs', () => expect(fileIcons.iconClassForPath('README.md')).toEqual('icon-book'));

  it('recognizes compressed files', () => expect(fileIcons.iconClassForPath('foo.zip')).toEqual('icon-file-zip'));

  it('recognizes image files', () => expect(fileIcons.iconClassForPath('foo.png')).toEqual('icon-file-media'));

  it('recognizes PDF files', () => expect(fileIcons.iconClassForPath('foo.pdf')).toEqual('icon-file-pdf'));

  it('recognizes binary files', () => expect(fileIcons.iconClassForPath('foo.exe')).toEqual('icon-file-binary'));

  describe('symlinks', () => {
    let [tempDir] = [];

    beforeEach(() => tempDir = temp.mkdirSync('atom-tree-view'));

    it('recognizes symlinks', () => {
      const filePath = path.join(tempDir, 'foo.bar');
      const linkPath = path.join(tempDir, 'link.bar');
      fs.writeFileSync(filePath, '');
      fs.symlinkSync(filePath, linkPath, 'junction');

      expect(fileIcons.iconClassForPath(linkPath)).toEqual('icon-file-symlink-file');
    });

    it('recognizes as symlink instead of other types', () => {
      const filePath = path.join(tempDir, 'foo.zip');
      const linkPath = path.join(tempDir, 'link.zip');
      fs.writeFileSync(filePath, '');
      fs.symlinkSync(filePath, linkPath, 'junction');

      expect(fileIcons.iconClassForPath(linkPath)).toEqual('icon-file-symlink-file');
    });
  });
});
