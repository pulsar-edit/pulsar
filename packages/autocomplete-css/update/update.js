/**
  This file will manage the updating of `autocomplete-css` `completions.json`.
  We will mainly utilize `@webref/css`.listAll() function that returns a full CSS
  list of all properties seperated by their spec shortname. An example
  of this format is defined below for ease of future modifications.

  Some important notes about the data contained here:
    - Often times the `value` within the `property` will be in the following format:
      `<valueGroupName>` or even `<valueGroupName> | value | value2` or just `value | value2`
      It will be important to build a parser that can handle this format.
      The `<valueGroupName>` then can be realized via that specs `values` where
      `values[x].name` will match the `<valueGroupName>`. Another important note about
      handling values here is that oftentimes `values[x].values[]` won't actually
      contain all possible values. And instead this must be handled by checking
      `values[x].value` which is another string of `<valueGroupName> | value`.
      So this should be handled by the same parser.
    - Additionally an important note is that nowhere in this data do we get any kind
      of description about the data that could lend a hand in being documentation.
      So the documentation must be gathered seperatly. Likely the best way to collect
      our documentation data is via `mdn/content`.
      Within `content/files/en-us/web/css` is a directory of folders titled
      by the name of properties.

    The last important thing to note here:
      MDN doesn't have docs on everything. And that's a good thing. But it means
      many of our items don't have any kind of description. For this situation
      we have `manual-property-desc.json` which is a list of manually updated
      descriptions for properties where there are none. This was a last resort
      intended to provide the highest quality of completions possible.
      Overtime many items on this list will likely be able to be removed just as
      new ones are added. After running the update script you'll see a warning
      saying how many properties are without completions that would then need to
      be added to the JSON file.

  "spec-shortname": {
    "spec": {
      "title": "",
      "url": ""
    },
    "properties": [
      {
        "name": "",
        "value": "",
        "initial": "",
        "appliesTo": "",
        "percentages": "",
        "computedValue": "",
        "canonicalOrder": "",
        "animationType": "",
        "media": "",
        "styleDeclaration": [ "", "", "" ]
      }
    ],
    "atrules": [
      {
        "name": "",
        "descriptors": [
          {
            "name": "",
            "for": "",
            "value": "",
            "type": ""
          }
        ]
      }
    ],
    "selectors": [],
    "values": [
      {
        "name": "",
        "type": "",
        "prose": "Optional description",
        "value": "",
        "values": [
          {
            "name": "",
            "prose": "Optional Description",
            "type": "",
            "value": ""
          }
        ]
      }
    ],
    "warnings": []
  }
*/

const css = require("@webref/css");
const fs = require("fs");
const superagent = require("superagent");
const CSSParser = require("./cssValueDefinitionSyntaxExtractor.js");
const manualPropertyDesc = require("./manual-property-desc.json");

async function update(params) {
  const parsedFiles = await css.listAll();

  const properties = await buildProperties(parsedFiles);
  const tags = await getTagsHTML();
  const pseudoSelectors = await getPseudoSelectors();

  const completions = {
    tags: tags,
    properties: properties,
    pseudoSelectors: pseudoSelectors
  };

  completions.properties = sortByLength(completions.properties);
  completions.properties = await sortByPopularity(completions.properties);

  // Now to write out our updated file
  fs.writeFileSync("./completions.json", JSON.stringify(completions, null, 2));

  // Now to determine how many properties have empty descriptions.

  let count = 0;
  let showEmpty = false;

  for (const param of params) {
    if (param === "--show-empty") {
      showEmpty = true;
    }
  }

  for (const prop in completions.properties) {
    if (completions.properties[prop].description === "") {
      if (showEmpty) {
        console.log(prop);
      }
      count ++;
    }
  }

  console.log("Updated all `autocomplete-css` completions.");
  console.log(`Total Completion Properties without a description: ${count}!`);
  if (count !== 0) {
    console.log("It is not required to fix the above empty completions issue.");
    console.log("Use `node update.js --show-empty` to show the empty property names.");
  };
}

function sortByLength(obj) {
  let keys = Object.keys(obj);

  keys.sort((a, b) => {
    if (a.length > b.length) {
      return 1;
    } else if (a.length < b.length) {
      return -1;
    } else {
      return 0;
    }
  });

  let newObj = {};

  // Now rebuild the object according to our new keys
  for (i in keys) {
    newObj[keys[i]] = obj[keys[i]];
  }

  return newObj;
}

async function sortByPopularity(obj) {
  try {
    const res = await superagent.get("https://chromestatus.com/data/csspopularity");
    if (res.status !== 200) {
      console.error(res);
      process.exit(1);
    }

    let newObj = {};

    for (prop in res.body) {
      let property = res.body[prop].property_name;

      if (typeof obj[property] === "object") {
        newObj[property] = obj[property];
      }
    }

    if (Object.keys(obj).length === Object.keys(newObj).length) {
      return newObj;
    }

    for (prop in obj) {
      if (typeof newObj[prop] !== "object") {
        newObj[prop] = obj[prop];
      }
    }

    return newObj;

  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}

async function buildProperties(css) {
  // This function will take a CSS object of all values from @webref/css
  // and will gather descriptions from mdn/content for these properties.
  // Returning data in the expected format for the old fashioned `completions.json`

  let propertyObj = {};

  for (const spec in css) {

    // For now we will only retain `properties` in these files. At a later time
    // we can revist and looking at adding `atrules`
    if (Array.isArray(css[spec].properties)) {
      for (const prop of css[spec].properties) {

        const propDescription = await getDescriptionOfProp(prop.name);
        const propValues = getValuesOfProp(prop.value, css);

        if (typeof propertyObj[prop.name] !== "object") {
          propertyObj[prop.name] = {
            values: dedupPropValues(propValues),
            description: propDescription
          };
        } else {
          // So seems this happens way more often than assumed.
          // So instead of discard a previously entered entry, we will prioritize
          // having values accomponing it. So whoever has the longer array of
          // values will be used as the tiebreaker.
          if (propertyObj[prop.name].values.length < propValues.length) {
            propertyObj[prop.name] = {
              values: dedupPropValues(propValues),
              description: propDescription
            };
          }
        }
        // Unfortunately the no duplication guarantee of @webref/css seems
        // inaccurate. As there are duplicate `display` definitions.
        // The first containing all the data we want, and the later containing nothing.
        // This protects against overriding previously definied definitions.

      }
    } // else continue our loop
  }

  return propertyObj;
}

async function getDescriptionOfProp(name) {
  // We will gather a description by checking if there's a document written
  // on MDN for our property and then extract a summary from there.

  // Since not all CSS property definitions will exist within the CSS docs
  // While this seems strange, it's because some selectors are part of other
  // specs and may not be worth mentioning standalone.
  let file;
  let filePath = [ "css", "svg/attribute", "svg/element" ].map(path =>
    `./node_modules/content/files/en-us/web/${path}/${name}/index.md`
  ).find(f => fs.existsSync(f));

  if (filePath) {
    file = fs.readFileSync(filePath, { encoding: "utf8" });
  }

  if (file) {
    // Here we will do a quick and dirty way to parse the markdown file to retreive a raw string
    let breaks = file.split("---");

    // The first two breaks should be the yaml metadata block
    let data = breaks[2].replace(/\{\{\S+\}\}\{\{\S+\}\}/gm, "")
                        .replace(/\{\{CSSRef\}\}/gm, "")
                        .replace(/\{\{SVGRef\}\}/gm, "");
    let summaryRaw = data.split("\n");
    // In case the first few lines is an empty line break
    for (let i = 0; i < summaryRaw.length; i++) {
      // Filtering the starting character protects agains't collecting accidental
      // warnings or other notices within the MDN site.
      if (summaryRaw[i].length > 1 && !summaryRaw[i].startsWith("> ") && !summaryRaw[i].startsWith("« ")) {
        return summaryRaw[i]
          .replace(/\{\{\S+\("(\S+)"\)\}\}/g, '$1')
          .replace(/\*/g, "")
          .replace(/\`/g, "")
          .replace(/\{/g, "")
          .replace(/\}/g, "")
          .replace(/\"/g, "")
          .replace(/\_/g, "")
          .replace(/\[([A-Za-z0-9-_* ]+)\]\(\S+\)/g, '$1');
      }
    }
  } else {
    // A document doesn't yet exist, let's ensure it's not in our manual list first
    if (manualPropertyDesc[name]) {
      return manualPropertyDesc[name].desc;
    }
    // A document doesn't yet exist. And it's not in our manual list
    // Let's return an empty value.
    return "";
  }
}

function getValuesOfProp(value, allValues, appendImplicitValues=true) {
  // value holds the value string of the values we expect
  // allValues holds all of the values that apply to the spec
  // Like mentioned above `value` = "value1 | value2 | <valueGroupName>"
  // https://developer.mozilla.org/en-US/docs/Web/CSS/Value_definition_syntax

  // We will at least supply the implicitly defined keywords that apply to all CSS properties
  let implicitValues = [ "inherit", "initial", "unset" ];

  if (!value) {
    if (appendImplicitValues === true) {
      return implicitValues;
    }

    return [];
  };

  let values = [];
  let parser = new CSSParser(value);

  let rawArrayValues = parser.parse();

  for (const val of rawArrayValues) {
    if (val.length > 1) {
      // Since some values contain `||` some splits leave a zero length string
      if (val.trim().startsWith("<") && val.trim().endsWith(">")) {
        // This is a valueGroup lookup key
        let valueGroup = parseValueGroup(val.trim(), allValues);
        values = values.concat(valueGroup);
      } else {
        values.push(val.trim());
      }
    }
  }

  if (appendImplicitValues === true) {
    // Add the implicit values to the end...
    values = values.concat(implicitValues);
  };

  return values;

}

function parseValueGroup(valueGroupName, allValues) {
  // Will lookup a valueGroup name within allValues and parse it

  let resolvedValueGroupString;

  // Now we can receive two kinds of Basic Data Types here
  // - Non-Terminal Data Types: <'valueGroupName'> which will share the name of a property
  // - And the standard that this was built to deal with.

  if (valueGroupName.startsWith("<'") && valueGroupName.endsWith("'>")) {
    // Non-Terminal Data Types
    for (const spec in allValues) {
      if (Array.isArray(allValues[spec].properties)) {
        for (const prop of allValues[spec].properties) {
          if (prop.name === valueGroupName.replace("<'", "").replace("'>", "")) {
            resolvedValueGroupString = prop.value;
            break;
          }
        }
      }
    }
  } else {
    // Standard handling
    for (const spec in allValues) {
      if (Array.isArray(allValues[spec].values)) {
        for (const val of allValues[spec].values) {
          if (val.name === valueGroupName) {
            resolvedValueGroupString = val.value;
            break;
          }
        }
      }
    }
  }

  return getValuesOfProp(resolvedValueGroupString, allValues=null, appendImplicitValues=false);
}

async function getTagsHTML() {
  // This will also use our dep of `mdn/content` to find all tags currently
  // within their docs. By simply grabbing all folders of tag docs by their name

  // Some of the page titles from MDN's docs don't accurately reflect what we
  // would expect to appear. The object below is named after what the name of the
  // folder from MDN's docs is called, whose value is then the array we would instead expect.
  const replaceTags = {
    "heading_elements": [ "h1", "h2", "h3", "h4", "h5", "h6" ],
  };

  let tags = [];

  let files = fs.readdirSync("./node_modules/content/files/en-us/web/html/element");

  files.forEach(file => {
    if (file != "index.md") {
      if (Array.isArray(replaceTags[file])) {
        tags = tags.concat(replaceTags[file]);
      } else {
        tags.push(file);
      }
    }
  });

  return tags;
}

async function getPseudoSelectors() {
  // For now since there is no best determined way to collect all modern psudoselectors
  // We will just grab the existing list for our existing `completions.json`

  let existingCompletions = require("../completions.json");

  return existingCompletions.pseudoSelectors;
}

function dedupPropValues(values) {
  // Takes an array of values and returns an array without any duplicates
  let out = [];
  let check = {};

  for (let i = 0; i < values.length; i++) {
    if (!check[values[i]]) {
      out.push(values[i]);
      check[values[i]] = true;
    }
  }
  return out;
}

update(process.argv.slice(2));
