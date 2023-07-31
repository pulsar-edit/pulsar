const SpecChecker = require('./spec-checker');

class Known3SpecChecker extends SpecChecker {
    constructor() {
        super('known-3', false, ['k3a', 'k0b', 'k0a']);
    }
}

const checker = new Known3SpecChecker();
module.exports = checker;
