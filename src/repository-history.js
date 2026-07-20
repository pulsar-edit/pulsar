const LOG_FIELD_COUNT = 10;

// The log format is %H%x00%P%x00%an%x00%ae%x00%aI%x00%cn%x00%ce%x00%cI%x00%s%x00%b
// with -z record terminators. Commit messages cannot contain NUL, so the
// output is a flat NUL-token stream with a fixed arity per commit.
function parseCommitRecords(output) {
  const text = String(output);
  if (text === "") return [];
  const tokens = text.split("\0");
  if (tokens[tokens.length - 1] === "") tokens.pop();
  if (tokens.length % LOG_FIELD_COUNT !== 0) {
    throw new Error(`Invalid Git log record stream of ${tokens.length} fields`);
  }

  const commits = [];
  for (let index = 0; index < tokens.length; index += LOG_FIELD_COUNT) {
    commits.push(
      Object.freeze({
        sha: tokens[index],
        parents: Object.freeze(tokens[index + 1] ? tokens[index + 1].split(" ") : []),
        author: Object.freeze({
          name: tokens[index + 2],
          email: tokens[index + 3],
          date: new Date(tokens[index + 4]),
        }),
        committer: Object.freeze({
          name: tokens[index + 5],
          email: tokens[index + 6],
          date: new Date(tokens[index + 7]),
        }),
        subject: tokens[index + 8],
        body: tokens[index + 9].replace(/\n+$/, ""),
      }),
    );
  }
  return commits;
}

// Parse `--name-status -z` output. Tolerates both NUL-separated status tokens
// and tab-joined `STATUS\tpath` tokens so diff-tree and diff variants parse
// identically.
function parseNameStatusTokens(output) {
  const tokens = String(output)
    .split("\0")
    .filter((token) => token !== "");
  const files = [];

  for (let index = 0; index < tokens.length; index++) {
    let statusToken = tokens[index];
    let firstPath;

    const joined = /^([AMDTUX]|[RC]\d*)\t([\s\S]*)$/.exec(statusToken);
    if (joined) {
      statusToken = joined[1];
      firstPath = joined[2];
    } else if (/^([AMDTUX]|[RC]\d*)$/.test(statusToken)) {
      firstPath = tokens[++index];
    } else {
      throw new Error(`Invalid Git name-status record: ${statusToken}`);
    }

    const statusCharacter = statusToken[0];
    const similarity = statusToken.length > 1 ? Number.parseInt(statusToken.slice(1), 10) : null;
    const statusNames = {
      A: "added",
      M: "modified",
      D: "deleted",
      T: "typechange",
      U: "unmerged",
      X: "unknown",
      R: "renamed",
      C: "copied",
    };

    if (statusCharacter === "R" || statusCharacter === "C") {
      const newPath = tokens[++index];
      files.push(
        Object.freeze({
          path: newPath,
          originalPath: firstPath,
          status: statusNames[statusCharacter],
          similarity,
        }),
      );
    } else {
      files.push(
        Object.freeze({
          path: firstPath,
          originalPath: null,
          status: statusNames[statusCharacter],
          similarity: null,
        }),
      );
    }
  }

  return files;
}

// Parse `git blame --porcelain` output. Commit metadata is emitted only the
// first time a commit appears, so it is cached per sha.
function parseBlamePorcelain(output) {
  const metadataBySha = new Map();
  const lines = [];
  let current = null;

  for (const line of String(output).split("\n")) {
    if (line.startsWith("\t")) {
      if (current) {
        const metadata = metadataBySha.get(current.sha) || {};
        lines.push(
          Object.freeze({
            line: current.line,
            originalLine: current.originalLine,
            sha: current.sha,
            author: Object.freeze({
              name: metadata.authorName ?? null,
              email: metadata.authorEmail ?? null,
              date: metadata.authorDate ?? null,
            }),
            summary: metadata.summary ?? null,
          }),
        );
        current = null;
      }
      continue;
    }

    const header = /^([0-9a-f]{40}) (\d+) (\d+)(?: \d+)?$/.exec(line);
    if (header) {
      current = {
        sha: header[1],
        originalLine: Number(header[2]),
        line: Number(header[3]),
      };
      if (!metadataBySha.has(current.sha)) metadataBySha.set(current.sha, {});
      continue;
    }

    if (!current) continue;
    const metadata = metadataBySha.get(current.sha);
    if (line.startsWith("author ")) metadata.authorName = line.slice(7);
    else if (line.startsWith("author-mail ")) {
      metadata.authorEmail = line.slice(12).replace(/^<|>$/g, "");
    } else if (line.startsWith("author-time ")) {
      metadata.authorDate = new Date(Number(line.slice(12)) * 1000);
    } else if (line.startsWith("summary ")) metadata.summary = line.slice(8);
  }

  return Object.freeze(lines);
}

module.exports = {
  parseCommitRecords,
  parseNameStatusTokens,
  parseBlamePorcelain,
};
