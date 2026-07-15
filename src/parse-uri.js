// Private: Parses a URI with the WHATWG URL parser into an object shaped like
// the output of Node's legacy `url.parse(uri, true)`.
//
// URI handlers registered by packages receive this object, so its shape is
// public API and must stay compatible with what `url.parse` produced:
// `protocol`, `slashes`, `auth`, `host`, `port`, `hostname`, `hash`, `search`,
// `query` (an object, with repeated keys collected into arrays), `pathname`,
// `path`, and `href`.
//
// Returns the parsed object, or null when the URI cannot be parsed.
module.exports = function parseUri(uri) {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    return null;
  }

  const query = Object.create(null);
  for (const [key, value] of parsed.searchParams) {
    const existing = query[key];
    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  }

  const auth = parsed.username
    ? parsed.password
      ? `${parsed.username}:${parsed.password}`
      : parsed.username
    : null;

  return {
    protocol: parsed.protocol,
    slashes: /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(uri) || null,
    auth,
    host: parsed.host,
    port: parsed.port || null,
    hostname: parsed.hostname,
    hash: parsed.hash || null,
    search: parsed.search || null,
    query,
    pathname: parsed.pathname || null,
    path: `${parsed.pathname}${parsed.search}` || null,
    href: parsed.href,
  };
};
