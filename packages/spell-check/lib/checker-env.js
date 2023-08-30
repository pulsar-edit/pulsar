module.exports = {
    isLinux() {
        return /linux/.test(process.platform);
    },
    isWindows() {
        return /win32/.test(process.platform);
    }, // TODO: Windows < 8 or >= 8
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
