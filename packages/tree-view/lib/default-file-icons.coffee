fs = require 'fs-plus'
path = require 'path'

class DefaultFileIcons
  iconClassForPath: (filePath) ->
    extension = path.extname(filePath)

    if fs.isSymbolicLinkSync(filePath)
      'icon-file-symlink-file'
    else if fs.isReadmePath(filePath)
      'icon-book'
    else if fs.isCompressedExtension(extension)
      'icon-file-zip'
    else if fs.isImageExtension(extension)
      'icon-file-media'
    else if fs.isPdfExtension(extension)
      'icon-file-pdf'
    else if fs.isBinaryExtension(extension)
      'icon-file-binary'
    else
      'icon-file-text'

module.exports = new DefaultFileIcons
