const SpecChecker = require('./spec-checker');

class Known4SpecChecker extends SpecChecker {
    constructor() {
        super('known-4', true, ['k4a', 'k0c', 'k0a']);
    }
}

const checker = new Known4SpecChecker();
module.exports = checker;
