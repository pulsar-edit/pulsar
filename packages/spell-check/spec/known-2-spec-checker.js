const SpecChecker = require('./spec-checker');

class Known2SpecChecker extends SpecChecker {
    constructor() {
        super('known-2', true, ['k2a', 'k0c', 'k0a']);
    }
}

const checker = new Known2SpecChecker();
module.exports = checker;
