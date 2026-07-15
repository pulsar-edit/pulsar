// Native replacements for the two `moment` calls this package used to make:
// an absolute localized date/time (formerly `moment(date).format("ll LTS")`)
// and a relative "time ago" string (formerly `moment(date).fromNow()`).

const absoluteFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

// Largest-first so we pick the coarsest unit that fits the elapsed time.
const RELATIVE_UNITS = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
  ["second", 1000],
];

// e.g. "Jul 15, 2026, 2:30:45 PM" (locale-dependent).
function formatAbsolute(date) {
  return absoluteFormatter.format(date);
}

// e.g. "3 minutes ago", "yesterday", "now" (locale-dependent).
function formatRelative(date, now = Date.now()) {
  const elapsed = date.getTime() - now; // negative for the past
  const magnitude = Math.abs(elapsed);
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (magnitude >= ms || unit === "second") {
      return relativeFormatter.format(Math.round(elapsed / ms), unit);
    }
  }
  return relativeFormatter.format(0, "second");
}

module.exports = { formatAbsolute, formatRelative };
