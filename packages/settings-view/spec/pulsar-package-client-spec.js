const PulsarPackageClient = require("../lib/pulsar-package-client");
const { normalizePulsarPackage } = PulsarPackageClient;

describe("PulsarPackageClient", function () {
  describe("normalizePulsarPackage", function () {
    it("maps a registry entry to the package card shape and tags the source", function () {
      const pack = normalizePulsarPackage({
        name: "hydrogen",
        repository: { url: "https://github.com/nteract/hydrogen", type: "git" },
        releases: { latest: "2.16.3" },
        metadata: { description: "Run code", keywords: ["run", 7], engines: { atom: "*" } },
      });
      expect(pack.name).toBe("hydrogen");
      expect(pack.repository).toBe("https://github.com/nteract/hydrogen");
      expect(pack.installSource).toBe("https://github.com/nteract/hydrogen");
      expect(pack.version).toBe("2.16.3");
      expect(pack.keywords).toEqual(["run"]);
      expect(pack.theme).toBe(false);
      expect(pack.source).toBe("pulsar");
    });

    it("passes badges through for display in the card", function () {
      const badges = [{ title: "Outdated", type: "warn", link: "https://x.test" }];
      const pack = normalizePulsarPackage({
        name: "hydrogen",
        repository: { url: "https://github.com/nteract/hydrogen" },
        badges,
      });
      expect(pack.badges).toEqual(badges);
    });

    it("keeps ui and syntax theme flags", function () {
      expect(
        normalizePulsarPackage({
          name: "monokai",
          repository: { url: "https://github.com/kevinsawicki/monokai" },
          metadata: { theme: "syntax" },
        }).theme,
      ).toBe("syntax");
    });

    it("returns null when there is no usable repository", function () {
      expect(normalizePulsarPackage({ name: "x", metadata: {} })).toBe(null);
      expect(normalizePulsarPackage(null)).toBe(null);
    });
  });

  describe("getPackage", function () {
    it("fetches a single package by name and normalizes it", function () {
      const requestImpl = jasmine.createSpy("request").andCallFake((options, callback) =>
        callback(
          null,
          { statusCode: 200 },
          {
            name: "hydrogen",
            repository: { url: "https://github.com/nteract/hydrogen" },
            releases: { latest: "2.16.3" },
          },
        ),
      );
      const client = new PulsarPackageClient({ requestImpl });

      waitsForPromise(() =>
        client.getPackage("hydrogen").then((pack) => {
          expect(requestImpl.mostRecentCall.args[0].url).toContain("/packages/hydrogen");
          expect(pack.name).toBe("hydrogen");
          expect(pack.version).toBe("2.16.3");
          expect(pack.source).toBe("pulsar");
        }),
      );
    });

    it("returns null for a blank name without querying the registry", function () {
      const requestImpl = jasmine.createSpy("request");
      const client = new PulsarPackageClient({ requestImpl });

      waitsForPromise(() =>
        client.getPackage("  ").then((pack) => {
          expect(pack).toBe(null);
          expect(requestImpl).not.toHaveBeenCalled();
        }),
      );
    });
  });

  describe("search", function () {
    it("queries the registry search endpoint and normalizes the results", function () {
      const requestImpl = jasmine
        .createSpy("request")
        .andCallFake((options, callback) =>
          callback(null, { statusCode: 200 }, [
            { name: "found", repository: { url: "https://github.com/owner/found" } },
            { name: "no-repo" },
          ]),
        );
      const client = new PulsarPackageClient({ requestImpl });

      waitsForPromise(() =>
        client.search("code").then((results) => {
          expect(requestImpl.mostRecentCall.args[0].url).toContain("/packages/search?q=code");
          expect(results.map((pack) => pack.name)).toEqual(["found"]);
          expect(results[0].source).toBe("pulsar");
        }),
      );
    });

    it("does not query the registry for a blank query", function () {
      const requestImpl = jasmine.createSpy("request");
      const client = new PulsarPackageClient({ requestImpl });

      waitsForPromise(() =>
        client.search("   ").then((results) => {
          expect(results).toEqual([]);
          expect(requestImpl).not.toHaveBeenCalled();
        }),
      );
    });

    it("rejects on a non-success status", function () {
      const requestImpl = (options, callback) => callback(null, { statusCode: 500 }, "");
      const client = new PulsarPackageClient({ requestImpl });

      let rejected = false;
      waitsForPromise(() => client.search("code").catch(() => (rejected = true)));
      runs(() => expect(rejected).toBe(true));
    });
  });
});
