const CommunityPackageCatalogClient = require("../lib/community-package-catalog-client");
const { normalizeCatalogSource } = CommunityPackageCatalogClient;
const path = require("path");

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) || null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe("CommunityPackageCatalogClient", function () {
  it("normalizes repository shorthands and index URLs", function () {
    expect(normalizeCatalogSource("owner/catalog")).toBe(
      "https://raw.githubusercontent.com/owner/catalog/main/index.json",
    );
    expect(normalizeCatalogSource("https://github.com/owner/catalog.git")).toBe(
      "https://raw.githubusercontent.com/owner/catalog/main/index.json",
    );
    expect(normalizeCatalogSource("https://catalog.example/community")).toBe(
      "https://catalog.example/community/index.json",
    );
    expect(normalizeCatalogSource("https://catalog.example/custom.json")).toBe(
      "https://catalog.example/custom.json",
    );
  });

  it("loads a catalog directly from a local JSON file", function () {
    const client = new CommunityPackageCatalogClient({ storage: createStorage() });
    const catalogPath = path.join(__dirname, "fixtures", "community-package-catalog.json");

    waitsForPromise(() =>
      client.load(catalogPath).then((catalog) => {
        expect(catalog.packages[0].name).toBe("local-package");
        expect(catalog.packages[0].catalogSource).toBe(catalogPath);
      }),
    );
  });

  it("validates and normalizes catalog entries", function () {
    const client = new CommunityPackageCatalogClient({ storage: createStorage() });
    const catalog = client.validate({
      schemaVersion: 1,
      packages: [
        {
          name: "sample-package",
          repository: "owner/sample-package@2.1.0",
          keywords: ["sample", 42],
        },
      ],
    });

    expect(catalog.packages[0].repository).toBe("owner/sample-package");
    expect(catalog.packages[0].installSource).toBe("owner/sample-package@2.1.0");
    expect(catalog.packages[0].keywords).toEqual(["sample"]);
    expect(catalog.packages[0].engines).toEqual({ atom: "*" });
  });

  it("allows the same name from different repositories", function () {
    const client = new CommunityPackageCatalogClient({ storage: createStorage() });
    const catalog = client.validate({
      schemaVersion: 1,
      packages: [
        { name: "shared", repository: "owner/one" },
        { name: "shared", repository: "owner/two" },
      ],
    });

    expect(catalog.packages.map(({ repository }) => repository)).toEqual([
      "owner/one",
      "owner/two",
    ]);
  });

  it("rejects duplicate repositories", function () {
    const client = new CommunityPackageCatalogClient({ storage: createStorage() });
    expect(() =>
      client.validate({
        schemaVersion: 1,
        packages: [
          { name: "one", repository: "owner/pkg" },
          { name: "two", repository: "owner/pkg@2.0.0" },
        ],
      }),
    ).toThrow();
  });

  it("uses a fresh cache without requesting the catalog again", function () {
    let now = 100;
    const storage = createStorage();
    const requestImpl = jasmine.createSpy("requestImpl").andCallFake((_options, callback) =>
      callback(
        null,
        { statusCode: 200 },
        {
          schemaVersion: 1,
          packages: [{ name: "cached", repository: "owner/cached" }],
        },
      ),
    );
    const client = new CommunityPackageCatalogClient({ requestImpl, storage, now: () => now });

    waitsForPromise(() =>
      client
        .load("https://example.test/index.json")
        .then(() => {
          now += 100;
          return client.load("https://example.test/index.json");
        })
        .then((catalog) => {
          expect(catalog.packages[0].name).toBe("cached");
          expect(requestImpl.callCount).toBe(1);
        }),
    );
  });

  it("preserves repository selectors when reading cached metadata", function () {
    const storage = createStorage();
    const requestImpl = (_options, callback) =>
      callback(
        null,
        { statusCode: 200 },
        {
          schemaVersion: 1,
          packages: [{ name: "selected", repository: "owner/selected@2.1.0" }],
        },
      );
    const client = new CommunityPackageCatalogClient({ requestImpl, storage, now: () => 100 });

    waitsForPromise(() =>
      client
        .load("https://example.test/index.json")
        .then(() => client.load("https://example.test/index.json"))
        .then((catalog) => {
          expect(catalog.packages[0].installSource).toBe("owner/selected@2.1.0");
        }),
    );
  });

  it("never touches the network in cacheOnly mode", function () {
    let now = 100;
    const storage = createStorage();
    const requestImpl = jasmine.createSpy("requestImpl").andCallFake((_options, callback) =>
      callback(
        null,
        { statusCode: 200 },
        {
          schemaVersion: 1,
          packages: [{ name: "cached", repository: "owner/cached" }],
        },
      ),
    );
    const client = new CommunityPackageCatalogClient({ requestImpl, storage, now: () => now });

    waitsForPromise(() =>
      client
        .load("https://example.test/index.json", { cacheOnly: true })
        .then((catalog) => {
          expect(catalog).toBeNull();
          expect(requestImpl.callCount).toBe(0);
          return client.load("https://example.test/index.json");
        })
        .then(() => {
          now += CommunityPackageCatalogClient.CACHE_TTL + 1;
          return client.load("https://example.test/index.json", { cacheOnly: true });
        })
        .then((catalog) => {
          expect(catalog.packages[0].name).toBe("cached");
          expect(requestImpl.callCount).toBe(1);
        }),
    );
  });

  it("falls back to stale cached data when refresh fails", function () {
    let fail = false;
    let now = 100;
    const storage = createStorage();
    const requestImpl = (_options, callback) => {
      if (fail) return callback(new Error("offline"));
      callback(
        null,
        { statusCode: 200 },
        {
          schemaVersion: 1,
          packages: [{ name: "offline", repository: "owner/offline" }],
        },
      );
    };
    const client = new CommunityPackageCatalogClient({ requestImpl, storage, now: () => now });

    waitsForPromise(() =>
      client
        .load("https://example.test/index.json")
        .then(() => {
          fail = true;
          now += CommunityPackageCatalogClient.CACHE_TTL + 1;
          return client.load("https://example.test/index.json");
        })
        .then((catalog) => {
          expect(catalog.packages[0].name).toBe("offline");
        }),
    );
  });
});
