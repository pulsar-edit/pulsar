const { computeLineDiffHunks } = require("../src/line-diff");

// Hunks feed git-diff-view, which reads {newStart, oldLines, newLines} to place
// added/modified/removed gutter marks. These assertions pin the libgit2-parity
// shape git-utils produced, including the deletion new-start anchoring.
describe("computeLineDiffHunks", () => {
  it("reports a modified line", () => {
    expect(computeLineDiffHunks("a\nb\nc\n", "a\nB\nc\n")).toEqual([
      { oldStart: 2, oldLines: 1, newStart: 2, newLines: 1 },
    ]);
  });

  it("reports an inserted line", () => {
    expect(computeLineDiffHunks("a\nb\nc\n", "a\nb\nX\nc\n")).toEqual([
      { oldStart: 3, oldLines: 0, newStart: 3, newLines: 1 },
    ]);
  });

  it("anchors a deleted line to the preceding row (newStart one less than jsdiff)", () => {
    expect(computeLineDiffHunks("a\nb\nc\n", "a\nc\n")).toEqual([
      { oldStart: 2, oldLines: 1, newStart: 1, newLines: 0 },
    ]);
  });

  it("anchors a top-of-file deletion to row 0 via newStart 0", () => {
    expect(computeLineDiffHunks("a\nb\nc\n", "b\nc\n")).toEqual([
      { oldStart: 1, oldLines: 1, newStart: 0, newLines: 0 },
    ]);
  });

  it("returns no hunks for identical text", () => {
    expect(computeLineDiffHunks("a\nb\nc\n", "a\nb\nc\n")).toEqual([]);
  });

  it("returns no hunks when the blob is absent at HEAD", () => {
    expect(computeLineDiffHunks(null, "a\nb\n")).toEqual([]);
  });

  it("treats CRLF-vs-LF as unchanged when ignoreEolWhitespace is set", () => {
    expect(
      computeLineDiffHunks("a\nb\nc\n", "a\r\nb\r\nc\r\n", { ignoreEolWhitespace: true }),
    ).toEqual([]);
  });

  it("reports every line changed for CRLF-vs-LF when not ignoring EOL whitespace", () => {
    const hunks = computeLineDiffHunks("a\nb\nc\n", "a\r\nb\r\nc\r\n");
    expect(hunks.length).toBeGreaterThan(0);
  });
});
