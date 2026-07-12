const request = require("request");

const PULSAR_API = "https://api.pulsar-edit.dev/api";
const SEARCH_LIMIT = 25;

// Maps a package object from the Pulsar registry API to the shape used by
// PackageCard, tagging it so the UI can mark its origin. Returns null when the
// entry has no usable repository.
function normalizePulsarPackage(entry) {
  if (!entry || typeof entry !== "object") return null;
  const metadata = entry.metadata || {};

  const rawRepository = entry.repository || metadata.repository;
  let repository = "";
  if (typeof rawRepository === "string") {
    repository = rawRepository;
  } else if (rawRepository && typeof rawRepository.url === "string") {
    repository = rawRepository.url;
  }
  repository = repository.trim();
  if (!repository) return null;

  const name = entry.name || metadata.name;
  if (typeof name !== "string" || !name) return null;

  const version =
    (entry.releases && typeof entry.releases.latest === "string" && entry.releases.latest) ||
    (typeof metadata.version === "string" ? metadata.version : undefined);

  return {
    name,
    repository,
    installSource: repository,
    version,
    description: typeof metadata.description === "string" ? metadata.description : "",
    keywords: Array.isArray(metadata.keywords)
      ? metadata.keywords.filter((keyword) => typeof keyword === "string")
      : [],
    theme: metadata.theme === "ui" || metadata.theme === "syntax" ? metadata.theme : false,
    engines: metadata.engines || { atom: "*" },
    badges: Array.isArray(entry.badges) ? entry.badges : [],
    source: "pulsar",
  };
}

module.exports = class PulsarPackageClient {
  constructor({ requestImpl = request } = {}) {
    this.requestImpl = requestImpl;
  }

  // Fetches a single package's details from the Pulsar registry, returning the
  // normalized shape or null when the package is not published there.
  async getPackage(name) {
    const trimmed = String(name || "").trim();
    if (!trimmed) return null;
    const entry = await this.get(`/packages/${encodeURIComponent(trimmed)}`);
    return normalizePulsarPackage(entry);
  }

  // Live search against the Pulsar registry — never fetches the full catalog.
  async search(query) {
    const trimmed = String(query || "").trim();
    if (!trimmed) return [];
    const results = await this.get(
      `/packages/search?q=${encodeURIComponent(trimmed)}&sort=relevance`,
    );
    return (Array.isArray(results) ? results : [])
      .map(normalizePulsarPackage)
      .filter(Boolean)
      .slice(0, SEARCH_LIMIT);
  }

  get(pathAndQuery) {
    return new Promise((resolve, reject) => {
      this.requestImpl(
        {
          url: `${PULSAR_API}${pathAndQuery}`,
          headers: { "User-Agent": navigator.userAgent, Accept: "application/json" },
          gzip: true,
          json: true,
        },
        (error, response, body) => {
          if (error) return reject(error);
          if (!response || response.statusCode < 200 || response.statusCode >= 300) {
            return reject(
              new Error(
                `Pulsar registry request failed with status ${response?.statusCode || "unknown"}.`,
              ),
            );
          }
          try {
            resolve(typeof body === "string" ? JSON.parse(body) : body);
          } catch (parseError) {
            reject(parseError);
          }
        },
      );
    });
  }
};

module.exports.normalizePulsarPackage = normalizePulsarPackage;
