const LineEndingRegExp = /\r\n|\n/g;

module.exports = {
  getProcessPlatform() {
    return process.platform;
  },

  setLineEnding(item, lineEnding) {
    if (item && item.getBuffer) {
      let buffer = item.getBuffer();
      buffer.setPreferredLineEnding(lineEnding);
      buffer.setText(buffer.getText().replace(LineEndingRegExp, lineEnding));
    }
  }
};
