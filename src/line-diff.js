const Diff = require("diff");

// Compute libgit2-compatible line-diff hunks between the HEAD blob text and the
// buffer text, matching the shape git-utils `getLineDiffs` produced: context-0
// hunks of `{oldStart, oldLines, newStart, newLines}`. jsdiff is Myers-based
// (like libgit2's xdiff) so hunk boundaries line up; the one adjustment is for
// pure deletions, where jsdiff reports the new-side start one line later than
// git's unified-diff convention. git-diff-view anchors the "removed" marker to
// the preceding line via that convention (its `newStart - 1`), so deletions are
// corrected here to match.
//
// * `oldText` The HEAD blob contents, or null when the path is absent at HEAD.
// * `newText` The current buffer contents.
// * `ignoreEolWhitespace` When true (win32, matching git-repository.js), ignore
//   end-of-line whitespace so an LF-in-HEAD vs CRLF-in-buffer file is not
//   reported as fully modified.
function computeLineDiffHunks(oldText, newText, { ignoreEolWhitespace = false } = {}) {
  if (oldText == null) return [];

  let a = oldText;
  let b = newText;
  if (ignoreEolWhitespace) {
    // Strip trailing whitespace (spaces, tabs, CR) at each line end. Line count
    // is preserved, so hunk line numbers still map to buffer rows.
    a = a.replace(/[ \t\r]+$/gm, "");
    b = b.replace(/[ \t\r]+$/gm, "");
  }

  const { hunks } = Diff.structuredPatch("a", "b", a, b, "", "", { context: 0 });
  return hunks.map((hunk) => ({
    oldStart: hunk.oldStart,
    oldLines: hunk.oldLines,
    newStart: hunk.newLines === 0 ? hunk.newStart - 1 : hunk.newStart,
    newLines: hunk.newLines,
  }));
}

module.exports = { computeLineDiffHunks };
