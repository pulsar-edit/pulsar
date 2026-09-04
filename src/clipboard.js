const crypto = require('crypto');
const { clipboard } = require('@electron/remote');

// Extended: Represents the clipboard used for copying and pasting in Pulsar.
//
// An instance of this class is always available as the `atom.clipboard` global.
//
// ## Examples
//
// ```js
// atom.clipboard.write('hello')
//
// console.log(atom.clipboard.read()) // 'hello'
// ```
/**
 * @class Clipboard
 * @desc Represents the clipboard used for copying and pasting in Pulsar.
 *
 * An instance of this class is always available as the `atom.clipboard` global.
 * @example
 * // returns 'hello'
 * atom.clipboard.write('hello');
 *
 * console.log(atom.clipboard.read());
 */
module.exports = class Clipboard {
  constructor() {
    this.reset();
  }

  reset() {
    this.metadata = null;
    this.signatureForMetadata = null;
  }

  // Creates an `md5` hash of some text.
  //
  // * `text` A {String} to hash.
  //
  // Returns a hashed {String}.
  md5(text) {
    return crypto
      .createHash('md5')
      .update(text, 'utf8')
      .digest('hex');
  }

  // Public: Write the given text to the clipboard.
  //
  // The metadata associated with the text is available by calling
  // {::readWithMetadata}.
  //
  // * `text` The {String} to store.
  // * `metadata` (optional) The additional info to associate with the text.
  async write(text, metadata) {
    text = text.replace(/\r?\n/g, process.platform === 'win32' ? '\r\n' : '\n');

    this.signatureForMetadata = this.md5(text);
    this.metadata = metadata;
    await clipboard.writeText(text);
  }

  // Public: Read the text from the clipboard.
  //
  // Returns a Promise that resolves to a {String}.
  read() {
    return clipboard.readText();
  }

  // Public: Write the given text to the macOS find pasteboard
  writeFindText(text) {
    return clipboard.writeFindText(text);
  }

  // Public: Read the text from the macOS find pasteboard.
  //
  // Returns a Promise that resolves to a {String}.
  readFindText() {
    return clipboard.readFindText();
  }

  // Public: Read the text from the clipboard and return both the text and the
  // associated metadata.
  //
  // Returns an {Object} with the following keys:
  // * `text` The {String} clipboard text.
  // * `metadata` The metadata stored by an earlier call to {::write}.
  async readWithMetadata() {
    const text = await this.read();
    if (this.signatureForMetadata === this.md5(text)) {
      return { text, metadata: this.metadata };
    } else {
      return { text };
    }
  }
};
