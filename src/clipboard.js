const crypto = require('crypto');
const { clipboard } = require('electron');

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

  /**
   * @name md5
   * @memberof Clipboard
   * @desc Creates an `md5` hash of some text.
   * @param {string} text - A string to hash.
   * @returns {string} A hashed string.
   */
  md5(text) {
    return crypto
      .createHash('md5')
      .update(text, 'utf8')
      .digest('hex');
  }

  /**
   * @name write
   * @memberof Clipboard
   * @desc Public: Write the given text to the clipboard.
   * The metadata associated with the text is available by calling {::readWithMetadata}.
   * @param {string} text - The string to store.
   * @param {*} [metadata] - THe additional info to associate with the text.
   */
  write(text, metadata) {
    text = text.replace(/\r?\n/g, process.platform === 'win32' ? '\r\n' : '\n');

    this.signatureForMetadata = this.md5(text);
    this.metadata = metadata;
    clipboard.writeText(text);
  }

  /**
   * @name read
   * @memberof Clipboard
   * @desc Public: Read the text from the clipboard.
   * @returns {string}
   */
  read() {
    return clipboard.readText();
  }

  /**
   * @name writeFindText
   * @memberof Clipboard
   * @desc Public: Write the given text to the macOS find pasteboard.
   */
  writeFindText(text) {
    clipboard.writeFindText(text);
  }

  /**
   * @name readFindText
   * @memberof Clipboard
   * @desc Public: Read the text from the macOS find pasteboard.
   * @returns {string}
   */
  readFindText() {
    return clipboard.readFindText();
  }

  /**
   * @name readWithMetadata
   * @memberof Clipboard
   * @desc Public: Read the text from the clipboard and return both the text and
   * the associated metadata.
   * @returns {object} An object containing the following keys:
   *    * `text` The {string} clipboard text.
   *    * `metadata` The metadata stored by an earlier call to {::write}.
   */
  readWithMetadata() {
    const text = this.read();
    if (this.signatureForMetadata === this.md5(text)) {
      return { text, metadata: this.metadata };
    } else {
      return { text };
    }
  }
};
