const { ownerFromRepository, packageOrigin, packageCoordinate } = require("../lib/utils");

describe("Utils", () => {
  describe("ownerFromRepository", () => {
    it("handles a long github url", () => {
      const owner = ownerFromRepository("http://github.com/omgwow/some-package");
      expect(owner).toBe("omgwow");
    });

    it("handles a short github url", () => {
      const owner = ownerFromRepository("omgwow/some-package");
      expect(owner).toBe("omgwow");
    });
  });

  describe("packageOrigin", () => {
    it("uses a catalog entry's installSource/repository", () => {
      expect(packageOrigin({ name: "linter", repository: "author-a/linter" })).toBe(
        "author-a/linter",
      );
      expect(
        packageOrigin({ name: "linter", installSource: "author-a/linter", repository: "x/y" }),
      ).toBe("author-a/linter");
    });

    it("normalizes a Pulsar-style repository URL", () => {
      expect(
        packageOrigin({
          name: "hydrogen-next",
          repository: "https://github.com/asiloisad/pulsar-hydrogen-next",
          installSource: "https://github.com/asiloisad/pulsar-hydrogen-next",
        }),
      ).toBe("asiloisad/pulsar-hydrogen-next");
    });

    it("strips a version selector from the origin", () => {
      expect(packageOrigin({ name: "invert-colors", installSource: "owner/repo@0.4.0" })).toBe(
        "owner/repo",
      );
    });

    it("prefers the recorded apmInstallSource.origin above all else", () => {
      const metadata = {
        name: "thing",
        repository: "upstream/thing",
        apmInstallSource: { type: "git", origin: "author/thing", repository: "other/thing" },
      };
      expect(packageOrigin(metadata)).toBe("author/thing");
    });

    it("prefers apmInstallSource over the package.json repository (forks)", () => {
      // A fork whose package.json still points at the upstream repository must be
      // identified by where it was actually installed from, not the upstream.
      const metadata = {
        name: "hydrogen-next",
        repository: "https://github.com/upstream/pulsar-hydrogen-next",
        apmInstallSource: {
          type: "git",
          source: "lumine-code/hydrogen-next",
          repository: "lumine-code/hydrogen-next",
        },
      };
      expect(packageOrigin(metadata)).toBe("lumine-code/hydrogen-next");
    });

    it("falls back to the repository only when nothing else is known", () => {
      expect(packageOrigin({ name: "thing", repository: "owner/thing" })).toBe("owner/thing");
      expect(packageOrigin({ name: "thing" })).toBe("");
      expect(packageOrigin(null)).toBe("");
    });
  });

  describe("packageCoordinate", () => {
    it("returns the install slot (name) and the unique origin", () => {
      expect(packageCoordinate({ name: "linter", repository: "author-a/linter" })).toEqual({
        name: "linter",
        origin: "author-a/linter",
      });
    });

    it("distinguishes the same name published from different sources", () => {
      const a = packageCoordinate({ name: "linter", repository: "author-a/linter" });
      const b = packageCoordinate({ name: "linter", repository: "author-b/linter" });
      expect(a.name).toBe(b.name);
      expect(a.origin).not.toBe(b.origin);
    });
  });
});
