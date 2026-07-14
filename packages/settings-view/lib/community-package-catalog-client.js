const fs = require("fs");
const path = require("path");
const { fileURLToPath, pathToFileURL } = require("url");

// eslint-disable-next-line n/no-unpublished-require
const { cloneUrlForRepository, parsePackageSource } = require("../../../src/package-source");
const { packageOriginKey } = require("./utils");

const CACHE_TTL = 1000 * 60 * 60 * 5;

// An in-memory, non-persistent store: fetched catalogs are cached for the life
// of the app process only, so nothing is written to disk and the cache is
// discarded when the window closes — no explicit cleanup needed.
function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, value),
  };
}

function normalizeCatalogSource(source) {
  const value = String(source || "")
    .trim()
    .replace(/\/+$/, "");
  if (!value) throw new Error("Enter a catalog repository or index URL.");

  if (/^file:\/\//i.test(value)) {
    const filePath = fileURLToPath(value);
    return pathToFileURL(filePath.endsWith(".json") ? filePath : path.join(filePath, "index.json"))
      .href;
  }

  if (path.isAbsolute(value)) {
    const filePath = value.endsWith(".json") ? value : path.join(value, "index.json");
    return pathToFileURL(filePath).href;
  }

  const shorthand = value.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (shorthand) {
    return `https://raw.githubusercontent.com/${shorthand[1]}/${shorthand[2]}/main/index.json`;
  }

  const github = value.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i);
  if (github) {
    return `https://raw.githubusercontent.com/${github[1]}/${github[2]}/main/index.json`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value.endsWith(".json") ? value : `${value}/index.json`;
  }

  throw new Error(
    "Catalog sources must be owner/repo, an HTTP(S) repository/index URL, or a local path.",
  );
}

module.exports = class CommunityPackageCatalogClient {
  constructor({
    fetchImpl = (...args) => fetch(...args),
    storage = createMemoryStorage(),
    now = Date.now,
  } = {}) {
    this.fetchImpl = fetchImpl;
    this.storage = storage;
    this.now = now;
  }

  // With cacheOnly, never touches the network: returns the cached catalog
  // regardless of age, or null when nothing is cached. Local file catalogs are
  // always read directly.
  async load(source, { refresh = false, cacheOnly = false } = {}) {
    const url = normalizeCatalogSource(source);
    if (url.startsWith("file://")) return this.fetch(url, source);

    const cached = this.readCache(url);
    if (cacheOnly) return cached ? cached.catalog : null;
    if (!refresh && cached && this.now() - cached.createdAt < CACHE_TTL) {
      return cached.catalog;
    }

    try {
      const catalog = await this.fetch(url, source);
      this.writeCache(url, catalog);
      return catalog;
    } catch (error) {
      if (cached) return cached.catalog;
      throw error;
    }
  }

  async fetch(url, source = url) {
    if (url.startsWith("file://")) {
      const body = await fs.promises.readFile(fileURLToPath(url), "utf8");
      return this.validate(JSON.parse(body), source);
    }

    const response = await this.fetchImpl(url, {
      headers: { "User-Agent": navigator.userAgent },
    });
    if (!response || response.status < 200 || response.status >= 300) {
      throw new Error(
        `Community package catalog request failed with status ${response?.status || "unknown"}.`,
      );
    }
    return this.validate(await response.json(), source);
  }

  validate(value, source) {
    if (!value || value.schemaVersion !== 1 || !Array.isArray(value.packages)) {
      throw new Error("Community package catalog must use schemaVersion 1 and contain packages.");
    }

    // A package is identified by its repository, not its name: the same name
    // may be published from different repositories.
    const origins = new Set();
    const packages = value.packages.map((entry, index) => {
      if (!entry || typeof entry.name !== "string" || typeof entry.repository !== "string") {
        throw new Error(`Community package catalog entry ${index + 1} needs name and repository.`);
      }

      const installSource =
        typeof entry.installSource === "string" ? entry.installSource : entry.repository;
      const parsed = parsePackageSource(installSource);
      cloneUrlForRepository(parsed.repository);

      const originKey = packageOriginKey(parsed.repository);
      if (originKey && origins.has(originKey)) {
        throw new Error(`Community package catalog contains duplicate repository "${originKey}".`);
      }
      if (originKey) origins.add(originKey);
      return {
        ...entry,
        name: entry.name,
        repository: parsed.repository,
        installSource,
        catalogSource: source || entry.catalogSource,
        description: typeof entry.description === "string" ? entry.description : "",
        keywords: Array.isArray(entry.keywords)
          ? entry.keywords.filter((keyword) => typeof keyword === "string")
          : [],
        engines: entry.engines || { atom: "*" },
      };
    });

    return { schemaVersion: 1, packages };
  }

  cacheKey(url) {
    return `settings-view:community-package-catalog:${url}`;
  }

  readCache(url) {
    try {
      const value = this.storage.getItem(this.cacheKey(url));
      if (!value) return null;
      const cached = JSON.parse(value);
      return {
        createdAt: cached.createdAt,
        catalog: this.validate(cached.catalog),
      };
    } catch {
      return null;
    }
  }

  writeCache(url, catalog) {
    this.storage.setItem(this.cacheKey(url), JSON.stringify({ createdAt: this.now(), catalog }));
  }
};

module.exports.CACHE_TTL = CACHE_TTL;
module.exports.normalizeCatalogSource = normalizeCatalogSource;
