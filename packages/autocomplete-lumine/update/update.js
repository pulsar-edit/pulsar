/**
  Regenerates the static `completions.json` used by `autocomplete-lumine`.

  Lumine is a fork of Atom and inherits the `atom.*` global API, so the source
  of truth is still the `atom-api.json` asset published on the last `atom/atom`
  release. We download it, keep only the public instance properties and methods
  of every documented class, and shape each entry into an autocomplete
  suggestion.

  No `descriptionMoreURL` is emitted: the historical links pointed at the
  now-defunct `atom.io` docs and there is no Lumine API reference to replace
  them with.

  Run with `yarn update` (or `npm run update`) from this package directory.
*/

const fs = require("fs");
const path = require("path");

const RELEASE_URL = "https://api.github.com/repos/atom/atom/releases/latest";
const OUTPUT = path.join(__dirname, "..", "completions.json");

async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "autocomplete-lumine-update",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request to ${url} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function isVisible({ visibility }) {
  return ["Essential", "Extended", "Public"].includes(visibility);
}

function textComparator(a, b) {
  if (a.name > b.name) return 1;
  if (a.name < b.name) return -1;
  return 0;
}

function convertMethodToSuggestion(method) {
  const { name, summary, returnValues } = method;
  const args = method.arguments;

  let text = null;
  let snippet = null;
  if (args?.length) {
    const snippets = args.map((arg, i) => `\${${i + 1}:${arg.name}}`);
    snippet = `${name}(${snippets.join(", ")})`;
  } else {
    text = `${name}()`;
  }

  return {
    name,
    text,
    snippet,
    description: summary,
    leftLabel: returnValues?.[0]?.type,
    type: "method",
  };
}

function convertPropertyToSuggestion({ name, summary }) {
  return {
    name,
    text: name,
    description: summary,
    leftLabel: summary?.match(/\{(\w+)\}/)?.[1],
    type: "property",
  };
}

async function update() {
  const release = await fetchJSON(RELEASE_URL);
  const apiAsset = release.assets?.find((asset) => asset.name === "atom-api.json");

  if (!apiAsset?.browser_download_url) {
    throw new Error("No atom-api.json asset found in the latest atom/atom release");
  }

  const { classes } = await fetchJSON(apiAsset.browser_download_url);

  const publicClasses = {};
  for (const [name, { instanceProperties, instanceMethods }] of Object.entries(classes)) {
    const properties = instanceProperties
      .filter(isVisible)
      .map(convertPropertyToSuggestion)
      .sort(textComparator);
    const methods = instanceMethods
      .filter(isVisible)
      .map(convertMethodToSuggestion)
      .sort(textComparator);

    if (properties.length > 0 || methods.length > 0) {
      publicClasses[name] = properties.concat(methods);
    }
  }

  fs.writeFileSync(OUTPUT, `${JSON.stringify(publicClasses, null, "  ")}\n`);
  console.log(`Updated ${Object.keys(publicClasses).length} classes in completions.json`);
}

update().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
