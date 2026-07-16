const EMPTY_REFS_SNAPSHOT = Object.freeze({
  schemaVersion: 1,
  generation: 0,
  initialized: false,
  head: null,
  branches: Object.freeze([]),
  remoteBranches: Object.freeze([]),
  tags: Object.freeze([]),
  remotes: Object.freeze([]),
  worktrees: Object.freeze([]),
});

const FOR_EACH_REF_FIELD_COUNT = 10;

function parseUpstreamTrack(track) {
  if (track === "gone") return { ahead: 0, behind: 0, gone: true };
  const ahead = /(?:^|[ ,])ahead (\d+)/.exec(track);
  const behind = /(?:^|[ ,])behind (\d+)/.exec(track);
  return {
    ahead: ahead ? Number(ahead[1]) : 0,
    behind: behind ? Number(behind[1]) : 0,
    gone: false,
  };
}

function parseForEachRef(output) {
  const branches = [];
  const remoteBranches = [];
  const tags = [];

  for (const record of String(output).split("\n")) {
    if (!record) continue;
    const fields = record.split("\0");
    if (fields.length !== FOR_EACH_REF_FIELD_COUNT) {
      throw new Error(`Invalid Git for-each-ref record: ${record}`);
    }
    const [
      ref,
      shortName,
      oid,
      objectType,
      peeledOid,
      upstreamRef,
      upstreamShort,
      upstreamTrack,
      headMarker,
      symref,
    ] = fields;

    if (ref.startsWith("refs/heads/")) {
      branches.push(
        Object.freeze({
          name: shortName,
          ref,
          oid,
          isHead: headMarker === "*",
          upstream: upstreamRef
            ? Object.freeze({
                ref: upstreamRef,
                name: upstreamShort,
                ...parseUpstreamTrack(upstreamTrack),
              })
            : null,
        }),
      );
    } else if (ref.startsWith("refs/remotes/")) {
      remoteBranches.push(
        Object.freeze({
          name: shortName,
          ref,
          oid,
          remoteName: ref.split("/")[2],
          symrefTarget: symref || null,
        }),
      );
    } else if (ref.startsWith("refs/tags/")) {
      tags.push(
        Object.freeze({
          name: shortName,
          ref,
          oid,
          targetOid: peeledOid || oid,
          annotated: objectType === "tag",
        }),
      );
    }
  }

  return { branches, remoteBranches, tags };
}

function parseRemotes(output) {
  const remotesByName = new Map();
  for (const line of String(output).split(/\r?\n/)) {
    const match = /^(\S+)\t(.*) \((fetch|push)\)$/.exec(line);
    if (!match) continue;
    let remote = remotesByName.get(match[1]);
    if (!remote) {
      remote = { name: match[1], fetchUrl: null, pushUrl: null };
      remotesByName.set(match[1], remote);
    }
    if (match[3] === "fetch") remote.fetchUrl = match[2];
    else remote.pushUrl = match[2];
  }
  return Array.from(remotesByName.values(), (remote) => Object.freeze(remote));
}

function parseWorktrees(output) {
  const worktrees = [];
  let current = null;

  const finish = () => {
    if (current) worktrees.push(Object.freeze(current));
    current = null;
  };

  for (const attribute of String(output).split("\0")) {
    if (attribute === "") {
      finish();
      continue;
    }
    if (attribute.startsWith("worktree ")) {
      finish();
      current = {
        path: attribute.slice("worktree ".length),
        headOid: null,
        branch: null,
        detached: false,
        bare: false,
        locked: false,
        lockedReason: null,
        prunable: false,
      };
      continue;
    }
    if (!current) continue;
    if (attribute.startsWith("HEAD ")) current.headOid = attribute.slice(5);
    else if (attribute.startsWith("branch ")) current.branch = attribute.slice(7);
    else if (attribute === "detached") current.detached = true;
    else if (attribute === "bare") current.bare = true;
    else if (attribute === "locked") current.locked = true;
    else if (attribute.startsWith("locked ")) {
      current.locked = true;
      current.lockedReason = attribute.slice(7);
    } else if (attribute === "prunable" || attribute.startsWith("prunable ")) {
      current.prunable = true;
    }
  }
  finish();

  return worktrees;
}

function parseHead(symbolicHead, headOid) {
  const ref = String(symbolicHead || "").trim();
  const oid = String(headOid || "").trim();
  return Object.freeze({
    oid: oid || null,
    ref: ref || null,
    name: ref.startsWith("refs/heads/") ? ref.slice("refs/heads/".length) : null,
    detached: !ref && Boolean(oid),
    unborn: !oid,
  });
}

function parseRefsSnapshot(
  { forEachRef, remotes, worktrees, symbolicHead, headOid },
  { generation = 1 } = {},
) {
  const refs = parseForEachRef(forEachRef);
  return Object.freeze({
    schemaVersion: 1,
    generation,
    initialized: true,
    head: parseHead(symbolicHead, headOid),
    branches: Object.freeze(refs.branches),
    remoteBranches: Object.freeze(refs.remoteBranches),
    tags: Object.freeze(refs.tags),
    remotes: Object.freeze(parseRemotes(remotes)),
    worktrees: Object.freeze(parseWorktrees(worktrees)),
  });
}

module.exports = {
  EMPTY_REFS_SNAPSHOT,
  parseRefsSnapshot,
};
