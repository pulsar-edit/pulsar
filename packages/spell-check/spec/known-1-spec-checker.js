const SpecChecker = require('./spec-checker');

class Known1SpecChecker extends SpecChecker {
    constructor() {
        super('known-1', false, ['k1a', 'k0b', 'k0a']);
    }
}

const checker = new Known1SpecChecker();
module.exports = checker;
