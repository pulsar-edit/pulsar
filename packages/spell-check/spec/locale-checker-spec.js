const LocaleChecker = require('../lib/locale-checker');
const env = require('../lib/checker-env');
const { it, fit, ffit } = require('./async-spec-helpers');

let checker;

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

  // E.g., a typo in `spell-check.localePaths`. However we choose to report an
  // unusable entry, the checker should otherwise behave exactly as if the
  // entry weren't there.
  describe('when a locale path is invalid', function () {
    const invalidPaths = [
      '/this/path/does/not/exist',
      'this is not a path',
      // Not allowed in global path specifications.
      'project:dicts',
      // E.g., from a stray comma in the settings field.
      '',
    ];

    for (let locale of ['en-US', 'xx-XX']) {
      for (let invalidPath of invalidPaths) {
        it(`behaves as if it were absent (${locale}, ${JSON.stringify(
          invalidPath
        )})`, async function () {
          const baseline = new LocaleChecker(locale, [], false, false);
          baseline.deferredInit();

          checker = new LocaleChecker(locale, [invalidPath], false, false);
          expect(() => checker.deferredInit()).not.toThrow();
          expect(checker.isEnabled()).toEqual(baseline.isEnabled());
          expect(checker.getStatus()).toEqual(baseline.getStatus());
        });
      }
    }

    it('still searches the locale paths that follow it', async function () {
      // The dictionary directory that ships with the `spellchecker` module,
      // which has `en_US.dic`. With the fallbacks turned off, this path is
      // the only way to load `en-US` (except on Windows, where the Spelling
      // API is still tried).
      const { getDictionaryPath } = require('@pulsar-edit/spellchecker');
      checker = new LocaleChecker(
        'en-US',
        ['this is not a path', getDictionaryPath()],
        false,
        false
      );
      checker.checkDictionaryPath = false;
      checker.checkDefaultPaths = false;

      expect(() => checker.deferredInit()).not.toThrow();
      expect(checker.isEnabled()).toEqual(true);
      expect(checker.getStatus()).toEqual(null);
    });
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
