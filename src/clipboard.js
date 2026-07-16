const crypto = require("crypto");
// Access the clipboard through the main process via `@electron/remote`. Electron
// deprecated using the `clipboard` module directly from the renderer process, so
// this routes reads/writes to the main-process clipboard instead. This matches
// how the rest of the renderer reaches main-process modules (see electron-shims,
// context-menu-manager, application-delegate).
const { clipboard } = require("@electron/remote");

const VSCODE_COPY_METADATA_FORMAT = "application/vnd.code.copymetadata";
const LUMINE_TEXT_EDITOR_DATA_FORMAT = "application/lumine-text-editor";
const LUMINE_EDITOR_DATA_VERSION = 1;

// Extended: Represents the clipboard used for copying and pasting in Lumine.
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
 * @desc Represents the clipboard used for copying and pasting in Lumine.
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
    return crypto.createHash("md5").update(text, "utf8").digest("hex");
  }

  normalizeText(text) {
    return text.replace(/\r\n?|\n/g, process.platform === "win32" ? "\r\n" : "\n");
  }

  signatureForText(text) {
    return this.md5(text.replace(/\r\n?|\n/g, "\n"));
  }

  // Public: Write the given text to the clipboard.
  //
  // The metadata associated with the text is available by calling
  // {::readWithMetadata}.
  //
  // * `text` The {String} to store.
  // * `metadata` (optional) The additional info to associate with the text.
  write(text, metadata) {
    text = this.normalizeText(text);

    this.signatureForMetadata = this.md5(text);
    this.metadata = metadata;
    clipboard.writeText(text);
  }

  createDataTransferClipboard(clipboardData) {
    let state = this.readFromDataTransfer(clipboardData);
    let didWrite = false;

    return {
      write: (text, metadata) => {
        state = this.writeToDataTransfer(clipboardData, text, metadata);
        didWrite = true;
      },
      readWithMetadata: () => state,
      didWrite: () => didWrite,
    };
  }

  readFromDataTransfer(clipboardData) {
    if (typeof clipboardData.getData !== "function") return { text: "" };

    try {
      const text = clipboardData.getData("text/plain");
      const lumineData = this.readDataTransferData(
        clipboardData,
        LUMINE_TEXT_EDITOR_DATA_FORMAT,
      );
      const lumineMetadata = this.metadataFromLumineEditorData(lumineData, text);
      // A Lumine payload that fails validation is stale, and the VS Code copy
      // metadata written alongside it carries no signature, so it is equally
      // stale. Only fall back to it when the clipboard has no Lumine payload.
      const vscodeCopyMetadata =
        lumineData == null
          ? this.metadataFromSerializedCopyMetadata(
              clipboardData.getData(VSCODE_COPY_METADATA_FORMAT),
            )
          : null;
      const metadata = lumineMetadata || vscodeCopyMetadata;
      return metadata ? { text, metadata } : { text };
    } catch {
      return { text: "" };
    }
  }

  writeToDataTransfer(clipboardData, text, metadata) {
    text = this.normalizeText(text);
    const lumineData = this.buildLumineEditorData(text, metadata);
    const copyMetadata = this.buildVSCodeCopyMetadata(metadata);

    clipboardData.setData("text/plain", text);
    clipboardData.setData(VSCODE_COPY_METADATA_FORMAT, JSON.stringify(copyMetadata));
    if (lumineData) {
      this.writeDataTransferData(
        clipboardData,
        LUMINE_TEXT_EDITOR_DATA_FORMAT,
        lumineData,
      );
    }

    this.signatureForMetadata = this.md5(text);
    this.metadata = metadata;
    return { text, metadata };
  }

  buildLumineEditorData(text, metadata) {
    if (metadata == null) return null;
    try {
      JSON.stringify(metadata);
      return {
        version: LUMINE_EDITOR_DATA_VERSION,
        signature: this.signatureForText(text),
        metadata,
      };
    } catch {
      return null;
    }
  }

  buildVSCodeCopyMetadata(metadata) {
    const selections = Array.isArray(metadata?.selections) ? metadata.selections : null;
    const pasteOnNewLine = selections
      ? selections.length > 0 && selections.every((selection) => selection?.fullLine === true)
      : metadata?.fullLine === true;
    const multicursorText =
      selections && selections.length > 1
        ? selections.map((selection) => selection.text)
        : null;

    return {
      defaultPastePayload: {
        multicursorText,
        pasteOnNewLine,
        mode: null,
      },
    };
  }

  writeDataTransferData(clipboardData, format, data) {
    clipboardData.setData(format, JSON.stringify(data));
  }

  readDataTransferData(clipboardData, format) {
    if (typeof clipboardData?.getData !== "function") return null;
    try {
      return this.parseDataTransferData(clipboardData.getData(format));
    } catch {
      return null;
    }
  }

  parseDataTransferData(serialized) {
    if (!serialized) return null;
    let data;
    try {
      data = JSON.parse(serialized);
    } catch {
      return null;
    }
    if (data == null || typeof data !== "object" || Array.isArray(data)) {
      return null;
    }
    return data;
  }

  // Public: Read the text from the clipboard.
  //
  // Returns a {String}.
  read() {
    return clipboard.readText();
  }

  // Public: Write the given text to the macOS find pasteboard
  writeFindText(text) {
    clipboard.writeFindText(text);
  }

  // Public: Read the text from the macOS find pasteboard.
  //
  // Returns a {String}.
  readFindText() {
    return clipboard.readFindText();
  }

  // Public: Read the text from the clipboard and return both the text and the
  // associated metadata.
  //
  // Returns an {Object} with the following keys:
  // * `text` The {String} clipboard text.
  // * `metadata` The metadata stored by an earlier call to {::write}.
  readWithMetadata() {
    const text = this.read();
    const nativeMetadata = this.readNativeMetadata(text);
    if (nativeMetadata) return { text, metadata: nativeMetadata };

    if (this.signatureForMetadata === this.md5(text)) {
      return { text, metadata: this.metadata };
    } else {
      return { text };
    }
  }

  readNativeMetadata(text) {
    try {
      const lumineData = this.parseDataTransferData(
        this.readNativeFormat(LUMINE_TEXT_EDITOR_DATA_FORMAT),
      );
      const metadata = this.metadataFromLumineEditorData(lumineData, text);
      if (metadata) return metadata;
      // Same staleness rule as readFromDataTransfer: an invalid Lumine payload
      // means the companion VS Code copy metadata is stale too.
      if (lumineData != null) return null;

      const serializedCopyMetadata = this.readNativeFormat(VSCODE_COPY_METADATA_FORMAT);
      return this.metadataFromSerializedCopyMetadata(serializedCopyMetadata);
    } catch {
      return null;
    }
  }

  readNativeFormat(format) {
    if (typeof clipboard.readBuffer === "function") {
      try {
        const buffer = clipboard.readBuffer(format);
        if (buffer?.length > 0) {
          return buffer.toString("utf8").replace(/\0+$/, "");
        }
      } catch {
        // Fall through to Electron's string-format reader below.
      }
    }

    try {
      return clipboard.read(format);
    } catch {
      return "";
    }
  }

  metadataFromSerializedCopyMetadata(serialized) {
    if (!serialized) return null;

    const copyMetadata = this.parseDataTransferData(serialized);
    const payload = copyMetadata?.defaultPastePayload;
    if (payload == null || typeof payload !== "object" || Array.isArray(payload)) return null;

    return this.metadataFromVSCodeEditorData({
      isFromEmptySelection: payload.pasteOnNewLine,
      multicursorText: payload.multicursorText,
    });
  }

  metadataFromLumineEditorData(lumineData, text) {
    if (
      lumineData?.version !== LUMINE_EDITOR_DATA_VERSION ||
      lumineData.signature !== this.signatureForText(text) ||
      !this.isValidMetadata(lumineData.metadata)
    ) {
      return null;
    }
    return lumineData.metadata;
  }

  metadataFromVSCodeEditorData(editorData) {
    const metadata = {};
    let hasMetadata = false;

    if (typeof editorData.isFromEmptySelection === "boolean") {
      metadata.fullLine = editorData.isFromEmptySelection;
      hasMetadata = true;
    }

    if (
      Array.isArray(editorData.multicursorText) &&
      editorData.multicursorText.length > 0 &&
      editorData.multicursorText.every((text) => typeof text === "string")
    ) {
      metadata.selections = editorData.multicursorText.map((text) => ({
        text,
        fullLine: editorData.isFromEmptySelection === true,
      }));
      hasMetadata = true;
    }

    return hasMetadata ? metadata : null;
  }

  isValidMetadata(metadata) {
    if (metadata == null || typeof metadata !== "object" || Array.isArray(metadata)) {
      return false;
    }

    if (metadata.fullLine != null && typeof metadata.fullLine !== "boolean") return false;
    if (metadata.indentBasis != null && !Number.isFinite(metadata.indentBasis)) return false;

    if (metadata.selections != null) {
      if (!Array.isArray(metadata.selections)) return false;
      return metadata.selections.every(
        (selection) =>
          selection != null &&
          typeof selection === "object" &&
          !Array.isArray(selection) &&
          typeof selection.text === "string" &&
          (selection.fullLine == null || typeof selection.fullLine === "boolean") &&
          (selection.indentBasis == null || Number.isFinite(selection.indentBasis)),
      );
    }

    return true;
  }
};
