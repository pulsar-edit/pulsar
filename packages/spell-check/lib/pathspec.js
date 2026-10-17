const path = require('path');
const { app } = require('@electron/remote');

// Adapted from the `atom-pathspec` NPM package.

/**
 * Returns an absolute path from the given spec.
 *
 * @param {string} spec A path specifier which may be an absolute,
 *    pseudo-drive, or relative path.
 * @returns {string} An absolute path of the given spec.
 */
exports.getPath = function (spec) {
    // If the spec is blank, then just return it. If it starts with an absolute
    // path (`/` or `\`), then we don't have to do anything.
    if (!spec || spec[0] === '/' || spec[0] === '\\') {
        return spec;
    }

    // Check to see if we have a pseudo-directory first.
    var match = spec.match(/^(~|[\w-]+:)?\/*(.*)$/);

    if (!match) {
        // No match, so just make this directory relative to the current
        // working directory.
        return path.join(process.cwd(), spec);
    }

    // We have an apparent pseudo-drive, so normalize it and attempt to match
    // it against our known values.
    const normalized = match[1].toLowerCase().replace(/[:-]/g, '');
    let root;

    switch (normalized) {
        case 'application':
            // For the application, we use `getPath("exe")` instead of
            // `getAppPath()` becuase the EXE is what the user runs instead of
            // the working folder which is what the latter returns.
            root = app.getPath('exe');
            break;
        case 'home':
        case '~':
            root = app.getPath('home');
            break;
        case 'config':
            root = app.getPath('userData');
            break;
        case 'desktop':
            root = app.getPath('desktop');
            break;
        case 'documents':
            root = app.getPath('documents');
            break;
        case 'downloads':
            root = app.getPath('downloads');
            break;
        case 'project':
            throw new Error(
                'Cannot use `project:` paths with global path specifications'
            );
    }

    // If we don't have a root, then just pass it on. Otherwise, join the
    // relative path and use that.
    return root ? path.join(root, match[2]) : spec;
};
