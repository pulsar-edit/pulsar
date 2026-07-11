"use strict";

const semver = require("semver");

const SELECTOR_TYPES = new Set(["branch", "tag", "commit"]);

function parsePackageSource(input) {
  const value = String(input || "").trim();
  if (!value) {
    throw new Error("A package repository is required.");
  }

  // Friendly shorthand for GitHub-style owner/repo sources. Generic Git URLs
  // retain the explicit #branch:, #tag:, and #commit: forms so URL characters
  // are never interpreted ambiguously.
  const shorthand = /#(?:branch|tag|commit):/i.test(value)
    ? null
    : value.match(/^([\w.-]+\/[\w.-]+)(?:@(.+)|#(.+)|~(.+))?$/i);
  if (shorthand) {
    const [, repository, tag, commit, branch] = shorthand;
    let selector = { type: "latest", value: null };
    if (tag) selector = { type: "tag", value: tag };
    if (commit) selector = { type: "commit", value: commit };
    if (branch) selector = { type: "branch", value: branch };
    return { repository, selector, source: value };
  }

  const hashIndex = value.lastIndexOf("#");
  const repository = (hashIndex === -1 ? value : value.slice(0, hashIndex)).trim();
  const fragment = hashIndex === -1 ? "" : value.slice(hashIndex + 1).trim();
  if (!repository) {
    throw new Error(`Invalid package repository: "${input}".`);
  }

  let selector = { type: "latest", value: null };
  if (fragment) {
    const separator = fragment.indexOf(":");
    const possibleType = separator === -1 ? "" : fragment.slice(0, separator).toLowerCase();
    if (SELECTOR_TYPES.has(possibleType)) {
      const selectorValue = fragment.slice(separator + 1).trim();
      if (!selectorValue) {
        throw new Error(`The ${possibleType} selector must include a value.`);
      }
      selector = { type: possibleType, value: selectorValue };
    } else {
      selector = { type: "ref", value: fragment };
    }
  }

  return { repository, selector, source: value };
}

function cloneUrlForRepository(repository) {
  if (/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    return `https://github.com/${repository}.git`;
  }
  if (/^(?:git\+)?(?:https?|ssh|git):\/\//.test(repository) || /^git@[^:]+:.+/.test(repository)) {
    return repository.replace(/^git\+/, "");
  }
  throw new Error(
    "Enter owner/repo[@tag|#commit|~branch] or a Git URL with an explicit #branch:, #tag:, or #commit: selector.",
  );
}

async function resolvePackageSource(input, lsRemote) {
  const parsed = typeof input === "string" ? parsePackageSource(input) : input;
  const cloneUrl = cloneUrlForRepository(parsed.repository);
  let { selector } = parsed;
  let sha = null;
  let fetchRef;
  let version = null;

  if (selector.type === "latest") {
    const tagsOutput = await lsRemote(cloneUrl, ["--tags"], []);
    const latestTag = selectLatestTag(parseRemoteTags(tagsOutput));
    if (latestTag) {
      selector = { type: "latest", value: latestTag.name };
      sha = latestTag.sha;
      fetchRef = `refs/tags/${latestTag.name}`;
      version = latestTag.version;
    } else {
      const refs = parseRemoteRefs(await lsRemote(cloneUrl, [], ["HEAD"]));
      sha = refs.get("HEAD") || null;
      fetchRef = "HEAD";
    }
  } else if (selector.type === "commit") {
    if (!/^[0-9a-f]{7,40}$/i.test(selector.value)) {
      throw new Error(`Invalid commit hash: "${selector.value}".`);
    }
    fetchRef = selector.value;
    if (selector.value.length === 40) sha = selector.value.toLowerCase();
  } else {
    const name = selector.value;
    const tagNames =
      selector.type === "tag" && semver.valid(name) && !name.toLowerCase().startsWith("v")
        ? [name, `v${name}`]
        : [name];
    const refs = parseRemoteRefs(
      await lsRemote(
        cloneUrl,
        [],
        [
          ...tagNames.flatMap((tagName) => [`refs/tags/${tagName}`, `refs/tags/${tagName}^{}`]),
          `refs/heads/${name}`,
        ],
      ),
    );
    const resolvedTagName = tagNames.find(
      (tagName) => refs.has(`refs/tags/${tagName}^{}`) || refs.has(`refs/tags/${tagName}`),
    );
    const tagSha = resolvedTagName
      ? refs.get(`refs/tags/${resolvedTagName}^{}`) || refs.get(`refs/tags/${resolvedTagName}`)
      : null;
    const branchSha = refs.get(`refs/heads/${name}`);

    if (selector.type === "tag" || (selector.type === "ref" && tagSha)) {
      if (!tagSha) throw new Error(`Tag "${name}" was not found in ${parsed.repository}.`);
      selector = { type: "tag", value: resolvedTagName };
      sha = tagSha;
      fetchRef = `refs/tags/${resolvedTagName}`;
      version = semver.valid(resolvedTagName);
    } else if (selector.type === "branch" || (selector.type === "ref" && branchSha)) {
      if (!branchSha) throw new Error(`Branch "${name}" was not found in ${parsed.repository}.`);
      selector = { type: "branch", value: name };
      sha = branchSha;
      fetchRef = `refs/heads/${name}`;
    } else if (selector.type === "ref" && /^[0-9a-f]{7,40}$/i.test(name)) {
      selector = { type: "commit", value: name };
      fetchRef = name;
      if (name.length === 40) sha = name.toLowerCase();
    } else {
      throw new Error(`Ref "${name}" was not found in ${parsed.repository}.`);
    }
  }

  return {
    repository: parsed.repository,
    source: formatPackageSource(parsed.repository, selector.type === "latest" ? null : selector),
    cloneUrl,
    selector,
    fetchRef,
    sha,
    version,
    updatePolicy: updatePolicyForSelector(selector),
  };
}

function parseRemoteTags(output) {
  const tags = new Map();
  for (const line of String(output || "").split(/\r?\n/)) {
    const match = line.match(/^([0-9a-f]{40})\s+refs\/tags\/(.+?)(\^\{\})?$/i);
    if (!match) continue;
    const [, sha, name, peeled] = match;
    const current = tags.get(name);
    if (!current || peeled) tags.set(name, sha);
  }
  return Array.from(tags, ([name, sha]) => ({ name, sha }));
}

function selectLatestTag(tags) {
  const versions = tags
    .map((tag) => ({ ...tag, version: semver.valid(tag.name) }))
    .filter((tag) => tag.version);
  const stable = versions.filter((tag) => semver.prerelease(tag.version) == null);
  const candidates = stable.length > 0 ? stable : versions;
  candidates.sort((a, b) => semver.rcompare(a.version, b.version));
  return candidates[0] || null;
}

function parseRemoteRefs(output) {
  const refs = new Map();
  for (const line of String(output || "").split(/\r?\n/)) {
    const match = line.match(/^([0-9a-f]{40})\s+(.+)$/i);
    if (match) refs.set(match[2], match[1]);
  }
  return refs;
}

function formatPackageSource(repository, selector) {
  if (!selector || selector.type === "latest") return repository;
  return `${repository}#${selector.type}:${selector.value}`;
}

function updatePolicyForSelector(selector) {
  if (!selector || selector.type === "latest") return "latest-tag";
  if (selector.type === "branch") return "branch";
  return "pinned";
}

module.exports = {
  cloneUrlForRepository,
  formatPackageSource,
  parsePackageSource,
  parseRemoteRefs,
  parseRemoteTags,
  resolvePackageSource,
  selectLatestTag,
  updatePolicyForSelector,
};
