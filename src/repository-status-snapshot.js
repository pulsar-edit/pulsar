const NO_SUBMODULE = Object.freeze({
  isSubmodule: false,
  commitChanged: false,
  modified: false,
  hasUntrackedChanges: false,
});

const EMPTY_COUNTS = Object.freeze({
  total: 0,
  staged: 0,
  unstaged: 0,
  conflicted: 0,
  untracked: 0,
  ignored: 0,
});

const EMPTY_STATUS_SNAPSHOT = Object.freeze({
  schemaVersion: 1,
  generation: 0,
  initialized: false,
  includesIgnored: false,
  head: null,
  upstream: null,
  files: Object.freeze([]),
  counts: EMPTY_COUNTS,
});

function statusCharacter(value) {
  return value && value !== "." ? value : null;
}

function parseSubmodule(value) {
  if (!value || value[0] !== "S") return NO_SUBMODULE;
  return Object.freeze({
    isSubmodule: true,
    commitChanged: value[1] === "C",
    modified: value[2] === "M",
    hasUntrackedChanges: value[3] === "U",
  });
}

function createEntry({
  path,
  originalPath = null,
  kind,
  indexStatus = null,
  worktreeStatus = null,
  conflicted = false,
  untracked = false,
  ignored = false,
  similarity = null,
  submodule = NO_SUBMODULE,
}) {
  return Object.freeze({
    path,
    originalPath,
    kind,
    indexStatus,
    worktreeStatus,
    staged: indexStatus != null,
    unstaged: worktreeStatus != null || untracked,
    conflicted,
    untracked,
    ignored,
    similarity,
    submodule,
  });
}

function parseTrackedEntry(record, records, index) {
  if (record[0] === "1") {
    const match = /^1 ([^ ]{2}) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([\s\S]*)$/.exec(
      record,
    );
    if (!match) throw new Error(`Invalid ordinary Git status record: ${record}`);
    return {
      entry: createEntry({
        path: match[8],
        kind: "ordinary",
        indexStatus: statusCharacter(match[1][0]),
        worktreeStatus: statusCharacter(match[1][1]),
        submodule: parseSubmodule(match[2]),
      }),
      index,
    };
  }

  if (record[0] === "2") {
    const match =
      /^2 ([^ ]{2}) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([\s\S]*)$/.exec(
        record,
      );
    if (!match) throw new Error(`Invalid renamed or copied Git status record: ${record}`);
    if (index + 1 >= records.length) {
      throw new Error(`Missing original path for Git status record: ${record}`);
    }
    const score = match[8];
    return {
      entry: createEntry({
        path: match[9],
        originalPath: records[index + 1],
        kind: score[0] === "C" ? "copied" : "renamed",
        indexStatus: statusCharacter(match[1][0]),
        worktreeStatus: statusCharacter(match[1][1]),
        similarity: Number.parseInt(score.slice(1), 10),
        submodule: parseSubmodule(match[2]),
      }),
      index: index + 1,
    };
  }

  const match =
    /^u ([^ ]{2}) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([\s\S]*)$/.exec(
      record,
    );
  if (!match) throw new Error(`Invalid unmerged Git status record: ${record}`);
  return {
    entry: createEntry({
      path: match[10],
      kind: "unmerged",
      indexStatus: statusCharacter(match[1][0]),
      worktreeStatus: statusCharacter(match[1][1]),
      conflicted: true,
      submodule: parseSubmodule(match[2]),
    }),
    index,
  };
}

function parseHead(headers) {
  const oidValue = headers.get("branch.oid");
  const nameValue = headers.get("branch.head");
  const unborn = oidValue === "(initial)";
  return Object.freeze({
    oid: !oidValue || unborn ? null : oidValue,
    name: !nameValue || nameValue === "(detached)" ? null : nameValue,
    detached: nameValue === "(detached)",
    unborn,
  });
}

function parseUpstream(headers) {
  const name = headers.get("branch.upstream");
  if (!name) return null;
  const aheadBehind = /^\+(\d+) -(\d+)$/.exec(headers.get("branch.ab") || "");
  return Object.freeze({
    name,
    ahead: aheadBehind ? Number(aheadBehind[1]) : 0,
    behind: aheadBehind ? Number(aheadBehind[2]) : 0,
  });
}

function countEntries(files) {
  const counts = {
    total: files.length,
    staged: 0,
    unstaged: 0,
    conflicted: 0,
    untracked: 0,
    ignored: 0,
  };
  for (const file of files) {
    if (file.staged) counts.staged++;
    if (file.unstaged) counts.unstaged++;
    if (file.conflicted) counts.conflicted++;
    if (file.untracked) counts.untracked++;
    if (file.ignored) counts.ignored++;
  }
  return Object.freeze(counts);
}

function parseStatusSnapshot(output, { generation = 1, includesIgnored = false } = {}) {
  const records = String(output).split("\0");
  const headers = new Map();
  const files = [];

  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    if (!record) continue;

    if (record.startsWith("# ")) {
      const separator = record.indexOf(" ", 2);
      if (separator > 2) headers.set(record.slice(2, separator), record.slice(separator + 1));
      continue;
    }

    if (record.startsWith("1 ") || record.startsWith("2 ") || record.startsWith("u ")) {
      const parsed = parseTrackedEntry(record, records, index);
      files.push(parsed.entry);
      index = parsed.index;
    } else if (record.startsWith("? ")) {
      files.push(
        createEntry({
          path: record.slice(2),
          kind: "untracked",
          untracked: true,
        }),
      );
    } else if (record.startsWith("! ")) {
      files.push(
        createEntry({
          path: record.slice(2),
          kind: "ignored",
          ignored: true,
        }),
      );
    } else {
      throw new Error(`Unsupported Git status record: ${record}`);
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    generation,
    initialized: true,
    includesIgnored,
    head: parseHead(headers),
    upstream: parseUpstream(headers),
    files: Object.freeze(files),
    counts: countEntries(files),
  });
}

module.exports = {
  EMPTY_STATUS_SNAPSHOT,
  parseStatusSnapshot,
};
