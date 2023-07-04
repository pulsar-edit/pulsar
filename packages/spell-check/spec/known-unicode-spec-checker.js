const SpecChecker = require('./spec-checker');

class KnownUnicodeSpecChecker extends SpecChecker {
    constructor() {
        super('known-unicode', false, ['абырг']);
    }
}

const checker = new KnownUnicodeSpecChecker();
module.exports = checker;
