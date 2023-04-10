const EncodingListView = require('./encoding-list-view')
const EncodingStatusView = require('./encoding-status-view')

const encodings = {
  utf8: {
    list: 'UTF-8',
    status: 'UTF-8'
  },
  utf16le: {
    list: 'UTF-16 LE',
    status: 'UTF-16 LE'
  },
  utf16be: {
    list: 'UTF-16 BE',
    status: 'UTF-16 BE'
  },
  windows1252: {
    list: 'Western (Windows 1252)',
    status: 'Windows 1252'
  },
  iso88591: {
    list: 'Western (ISO 8859-1)',
    status: 'ISO 8859-1'
  },
  iso88593: {
    list: 'Western (ISO 8859-3)',
    status: 'ISO 8859-3'
  },
  iso885915: {
    list: 'Western (ISO 8859-15)',
    status: 'ISO 8859-15'
  },
  macroman: {
    list: 'Western (Mac Roman)',
    status: 'Mac Roman'
  },
  cp437: {
    list: 'DOS (CP 437)',
    status: 'CP437'
  },
  cp850: {
    list: 'DOS (CP 850)',
    status: 'CP850'
  },
  windows1256: {
    list: 'Arabic (Windows 1256)',
    status: 'Windows 1256'
  },
  iso88596: {
    list: 'Arabic (ISO 8859-6)',
    status: 'ISO 8859-6'
  },
  windows1257: {
    list: 'Baltic (Windows 1257)',
    status: 'Windows 1257'
  },
  iso88594: {
    list: 'Baltic (ISO 8859-4)',
    status: 'ISO 8859-4'
  },
  windows1250: {
    list: 'Central European (Windows 1250)',
    status: 'Windows 1250'
  },
  iso88592: {
    list: 'Central European (ISO 8859-2)',
    status: 'ISO 8859-2'
  },
  windows1251: {
    list: 'Cyrillic (Windows 1251)',
    status: 'Windows 1251'
  },
  cp866: {
    list: 'Cyrillic (CP 866)',
    status: 'CP 866'
  },
  iso88595: {
    list: 'Cyrillic (ISO 8859-5)',
    status: 'ISO 8859-5'
  },
  koi8r: {
    list: 'Cyrillic (KOI8-R)',
    status: 'KOI8-R'
  },
  koi8u: {
    list: 'Cyrillic (KOI8-U)',
    status: 'KOI8-U'
  },
  iso885913: {
    list: 'Estonian (ISO 8859-13)',
    status: 'ISO 8859-13'
  },
  windows1253: {
    list: 'Greek (Windows 1253)',
    status: 'Windows 1253'
  },
  iso88597: {
    list: 'Greek (ISO 8859-7)',
    status: 'ISO 8859-7'
  },
  windows1255: {
    list: 'Hebrew (Windows 1255)',
    status: 'Windows 1255'
  },
  iso88598: {
    list: 'Hebrew (ISO 8859-8)',
    status: 'ISO 8859-8'
  },
  iso885916: {
    list: 'Romanian (ISO 8859-16)',
    status: 'ISO 8859-16'
  },
  windows1254: {
    list: 'Turkish (Windows 1254)',
    status: 'Windows 1254'
  },
  iso88599: {
    list: 'Turkish (ISO 8859-9)',
    status: 'ISO 8859-9'
  },
  windows1258: {
    list: 'Vietnamese (Windows 1254)',
    status: 'Windows 1254'
  },
  gbk: {
    list: 'Chinese (GBK)',
    status: 'GBK'
  },
  gb18030: {
    list: 'Chinese (GB18030)',
    status: 'GB18030'
  },
  cp950: {
    list: 'Traditional Chinese (Big5)',
    status: 'Big5'
  },
  big5hkscs: {
    list: 'Traditional Chinese (Big5-HKSCS)',
    status: 'Big5-HKSCS'
  },
  shiftjis: {
    list: 'Japanese (Shift JIS)',
    status: 'Shift JIS'
  },
  cp932: {
    list: 'Japanese (CP 932)',
    status: 'CP 932'
  },
  eucjp: {
    list: 'Japanese (EUC-JP)',
    status: 'EUC-JP'
  },
  euckr: {
    list: 'Korean (EUC-KR)',
    status: 'EUC-KR'
  }
}

const posixOnlyEncodings = {
  iso885914: {
    list: 'Celtic (ISO 8859-14)',
    status: 'ISO 8859-14'
  },
  iso885910: {
    list: 'Nordic (ISO 8859-10)',
    status: 'ISO 8859-10'
  }
}

let encodingListView = null
let encodingStatusView = null
let commandSubscription = null

module.exports = {
  activate () {
    if (process.platform !== 'win32') {
      Object.assign(encodings, posixOnlyEncodings)
    }

    commandSubscription = atom.commands.add('atom-text-editor', 'encoding-selector:show', () => {
      if (!encodingListView) encodingListView = new EncodingListView(encodings)
      encodingListView.toggle()
    })
  },

  deactivate () {
    if (commandSubscription) commandSubscription.dispose()
    commandSubscription = null

    if (encodingStatusView) encodingStatusView.destroy()
    encodingStatusView = null

    if (encodingListView) encodingListView.destroy()
    encodingListView = null
  },

  consumeStatusBar (statusBar) {
    encodingStatusView = new EncodingStatusView(statusBar, encodings)
    encodingStatusView.attach()
  }
}
