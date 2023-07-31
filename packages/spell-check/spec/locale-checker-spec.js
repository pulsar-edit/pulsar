const LocaleChecker = require('../lib/locale-checker');
const env = require('../lib/checker-env');
const { it, fit, ffit } = require('./async-spec-helpers');

describe('Locale Checker', function () {
    it('can load en-US without paths', async function () {
        checker = new LocaleChecker('en-US', [], false, false);
        checker.deferredInit();

        expect(checker.isEnabled()).toEqual(true);
        expect(checker.getStatus()).toEqual(null);
    });

    it('cannot load xx-XX without paths', async function () {
        checker = new LocaleChecker('xx-XX', [], false, false);
        checker.deferredInit();

        expect(checker.isEnabled()).toEqual(false);
        expect(checker.getStatus()).toEqual(
            'Cannot load the locale dictionary for `xx-XX`.'
        );
    });

    it('cannot quietly load xx-XX without paths with system', async function () {
        checker = new LocaleChecker('xx-XX', [], true, true);
        checker.deferredInit();

        expect(checker.isEnabled()).toEqual(false);
        expect(checker.getStatus()).toEqual(
            'Cannot load the locale dictionary for `xx-XX`. No warning because system checker is in use and locale is inferred.'
        );
    });

    // On Windows, not using the built-in path should use the
    // Spelling API.
    if (env.isWindows()) {
        it('can load en-US from Windows API', async function () {
            checker = new LocaleChecker('en-US', [], false, false);
            checker.checkDictionaryPath = false;
            checker.checkDefaultPaths = false;
            checker.deferredInit();

            expect(checker.isEnabled()).toEqual(true);
            expect(checker.getStatus()).toEqual(null);
        });
    } else {
        it('cannot load en-US without paths or fallback', async function () {
            checker = new LocaleChecker('en-US', [], false, false);
            checker.checkDictionaryPath = false;
            checker.checkDefaultPaths = false;
            checker.deferredInit();

            expect(checker.isEnabled()).toEqual(false);
            expect(checker.getStatus()).toEqual(
                'Cannot load the locale dictionary for `en-US`.'
            );
        });
    }
});
