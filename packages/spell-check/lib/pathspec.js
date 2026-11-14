const path = require('path');
const { app } = require('@electron/remote');

// Adapted from the `atom-pathspec` NPM package.

/**
 * Resolves a path spec that may start with a pseudo-drive (e.g., `~/dicts` or
 * `config:dicts`).
 *
 * @param {string} spec A path specifier: an absolute path, or a path starting
 *    with a pseudo-drive.
 * @returns {string} The resolved path if the spec starts with a known
 *    pseudo-drive; otherwise the spec, unchanged. The result isn't
 *    necessarily absolute, so callers that need an absolute path should
 *    check.
 * @throws If the spec uses `project:`, which needs a project context.
 */
exports.getPath = function (spec) {
  // If the spec is blank, then just return it. If it starts with an absolute
  // path (`/` or `\`), then we don't have to do anything.
  if (!spec || spec[0] === '/' || spec[0] === '\\') {
    return spec;
  }

  // Check to see if we have a pseudo-drive. (Every part of this pattern is
  // optional, so it matches any string; what matters is whether it captured
  // a pseudo-drive.)
  const match = spec.match(/^(~|[\w-]+:)?\/*(.*)$/);
  if (!match[1]) return spec;

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
