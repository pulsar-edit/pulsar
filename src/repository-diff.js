const HUNK_HEADER_PATTERN = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?: (.*))?$/;

// Git C-quotes paths containing double quotes or control characters (we run
// diffs with core.quotePath=false, so ordinary non-ASCII names stay literal).
function unquoteGitPath(rawPath) {
  if (!rawPath.startsWith('"') || !rawPath.endsWith('"')) return rawPath;

  const inner = rawPath.slice(1, -1);
  const bytes = [];
  for (let index = 0; index < inner.length; index++) {
    const character = inner[index];
    if (character !== "\\") {
      for (const byte of Buffer.from(character, "utf8")) bytes.push(byte);
      continue;
    }

    const next = inner[++index];
    if (next >= "0" && next <= "7") {
      let octal = next;
      while (octal.length < 3 && inner[index + 1] >= "0" && inner[index + 1] <= "7") {
        octal += inner[++index];
      }
      bytes.push(Number.parseInt(octal, 8));
    } else {
      const escapes = { n: 10, t: 9, r: 13, b: 8, f: 12, a: 7, v: 11, '"': 34, "\\": 92 };
      bytes.push(escapes[next] ?? next.charCodeAt(0));
    }
  }
  return Buffer.from(bytes).toString("utf8");
}

function headerPath(rawPath, prefix) {
  // Git appends a tab to header paths that contain spaces.
  let value = unquoteGitPath(rawPath.replace(/\t$/, ""));
  if (value === "/dev/null") return null;
  if (value.startsWith(prefix)) value = value.slice(prefix.length);
  return value;
}

function createFile() {
  return {
    oldPath: null,
    newPath: null,
    status: "modified",
    similarity: null,
    binary: false,
    oldMode: null,
    newMode: null,
    hunks: [],
  };
}

function isTypeChange(oldMode, newMode) {
  if (!oldMode || !newMode) return false;
  return (oldMode.startsWith("120") || newMode.startsWith("120")) && oldMode !== newMode;
}

function finalizeFile(file) {
  if (file.status === "modified" && isTypeChange(file.oldMode, file.newMode)) {
    file.status = "typechange";
  }
  if (file.status === "added") file.oldPath = null;
  if (file.status === "deleted") file.newPath = null;
  for (const hunk of file.hunks) {
    Object.freeze(hunk.lines);
    Object.freeze(hunk);
  }
  file.hunks = Object.freeze(file.hunks);
  return Object.freeze(file);
}

// Parse `git diff --patch` output into structured files, hunks, and lines.
// Header lines have CR stripped; hunk body text is kept verbatim minus the
// leading marker character.
function parseDiffPatch(patchText) {
  const files = [];
  let file = null;
  let hunk = null;

  const finish = () => {
    if (file) files.push(finalizeFile(file));
    file = null;
    hunk = null;
  };

  for (const rawLine of String(patchText).split("\n")) {
    if (hunk && (rawLine.startsWith("+") || rawLine.startsWith("-") || rawLine.startsWith(" "))) {
      const kind = rawLine[0] === "+" ? "added" : rawLine[0] === "-" ? "deleted" : "context";
      hunk.lines.push(Object.freeze({ kind, text: rawLine.slice(1) }));
      continue;
    }
    if (hunk && rawLine.startsWith("\\")) {
      hunk.lines.push(Object.freeze({ kind: "nonewline", text: "" }));
      continue;
    }

    const line = rawLine.replace(/\r$/, "");

    if (line.startsWith("diff --git ")) {
      finish();
      file = createFile();
      continue;
    }
    if (!file) continue;

    const hunkMatch = HUNK_HEADER_PATTERN.exec(line);
    if (hunkMatch) {
      hunk = {
        oldStart: Number(hunkMatch[1]),
        oldLines: hunkMatch[2] == null ? 1 : Number(hunkMatch[2]),
        newStart: Number(hunkMatch[3]),
        newLines: hunkMatch[4] == null ? 1 : Number(hunkMatch[4]),
        heading: hunkMatch[5] || null,
        lines: [],
      };
      file.hunks.push(hunk);
      continue;
    }

    if (hunk) continue;

    if (line.startsWith("old mode ")) file.oldMode = line.slice(9);
    else if (line.startsWith("new mode ")) file.newMode = line.slice(9);
    else if (line.startsWith("new file mode ")) {
      file.status = "added";
      file.newMode = line.slice(14);
    } else if (line.startsWith("deleted file mode ")) {
      file.status = "deleted";
      file.oldMode = line.slice(18);
    } else if (line.startsWith("similarity index ")) {
      file.similarity = Number.parseInt(line.slice(17), 10);
    } else if (line.startsWith("rename from ")) {
      file.status = "renamed";
      file.oldPath = unquoteGitPath(line.slice(12));
    } else if (line.startsWith("rename to ")) {
      file.newPath = unquoteGitPath(line.slice(10));
    } else if (line.startsWith("copy from ")) {
      file.status = "copied";
      file.oldPath = unquoteGitPath(line.slice(10));
    } else if (line.startsWith("copy to ")) {
      file.newPath = unquoteGitPath(line.slice(8));
    } else if (line.startsWith("index ")) {
      const modeMatch = / ([0-7]{6})$/.exec(line);
      if (modeMatch) {
        if (file.oldMode == null) file.oldMode = modeMatch[1];
        if (file.newMode == null) file.newMode = modeMatch[1];
      }
    } else if (line.startsWith("--- ")) {
      if (file.oldPath == null) file.oldPath = headerPath(line.slice(4), "a/");
    } else if (line.startsWith("+++ ")) {
      if (file.newPath == null) file.newPath = headerPath(line.slice(4), "b/");
    } else if (line.startsWith("Binary files ") || line === "GIT binary patch") {
      file.binary = true;
    }
  }
  finish();

  return Object.freeze({ files: Object.freeze(files) });
}

module.exports = { parseDiffPatch };
