const { formatAbsolute, formatRelative } = require("../lib/timestamp-format");

describe("timestamp-format", () => {
  describe("formatAbsolute", () => {
    it("returns a non-empty localized date/time string", () => {
      const result = formatAbsolute(new Date(2026, 6, 15, 14, 30, 45));
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("formatRelative", () => {
    const now = new Date(2026, 6, 15, 12, 0, 0).getTime();

    it("picks the second unit for recent timestamps", () => {
      expect(formatRelative(new Date(now - 30 * 1000), now)).toMatch(/second/);
    });

    it("picks the minute unit", () => {
      expect(formatRelative(new Date(now - 3 * 60 * 1000), now)).toMatch(/minute/);
    });

    it("picks the hour unit", () => {
      expect(formatRelative(new Date(now - 5 * 60 * 60 * 1000), now)).toMatch(/hour/);
    });

    it("scales up to days", () => {
      const result = formatRelative(new Date(now - 3 * 24 * 60 * 60 * 1000), now);
      expect(result).toMatch(/day/);
    });

    it("returns distinct strings for different magnitudes", () => {
      const minutesAgo = formatRelative(new Date(now - 3 * 60 * 1000), now);
      const hoursAgo = formatRelative(new Date(now - 5 * 60 * 60 * 1000), now);
      expect(minutesAgo).not.toEqual(hoursAgo);
    });
  });
});
