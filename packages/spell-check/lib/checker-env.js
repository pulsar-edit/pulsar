module.exports = {
  isLinux() {
    return /linux/.test(process.platform);
  },
  isWindows() {
    // TODO: Windows < 8 or >= 8
    return /win32/.test(process.platform);
  },
  isDarwin() {
    return /darwin/.test(process.platform);
  },
  preferHunspell() {
    return !!process.env.SPELLCHECKER_PREFER_HUNSPELL;
  },
  isSystemSupported() {
    return this.isWindows() || this.isDarwin();
  },
  isLocaleSupported() {
    return true;
  },
  useLocales() {
    return this.isLinux() || this.isWindows() || this.preferHunspell();
  },
};
