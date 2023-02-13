const fs = require('fs')
const path = require('path')

class DefaultFileIcons {
  iconClassForPath (filePath) {
    const extension = path.extname(filePath).toLowerCase()
    const base = path.basename(filePath, extension).toLowerCase();

    let isSymbolicLinkSync = false
    try {
      fs.lstatSync(filePath)?.isSymbolicLink();
    } catch (e) {}
    if (isSymbolicLinkSync) return 'icon-file-symlink-file'

    if (base === 'readme' && ['','.markdown','.md','.mdown','.mkd','.mkdown','.rmd','.ron'].includes(extension)) {
      return 'icon-book'
    }

    if (['.bz2','.egg','.epub','.gem','.gz','.jar','.lz','.lzma','.lzo','.rar','.tar','.tgz','.war','.whl','.xpi','.xz','.z','.zip'].includes(extension)) {
      return 'icon-file-zip'
    }

    if (['.gif','.ico','.jpeg','.jpg','.png','.tif','.tiff','.webp'].includes(extension)) {
      return 'icon-file-media'
    }

    if (extension === ".pdf") return 'icon-file-pdf'

    if (['.ds_store','.a','.exe','.o','.pyc','.pyo','.so','.woff'].includes(extension)) {
      return 'icon-file-binary'
    }
    return 'icon-file-text'
  }
}

module.exports = new DefaultFileIcons()
