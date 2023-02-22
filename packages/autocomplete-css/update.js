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

async function update() {
  const parsedFiles = await css.listAll();

  const completions = {
    tags: [],
    properties: {},
    psuedoSelectors: {}
  };

  const properties = await buildProperties(parsedFiles);
  console.log(properties);

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
        const propValues = await getValuesOfProp(prop.value, css[spec].values);

        propertyObj[prop.name] = {
          values: propValues,
          description: propDescription
        };
        //console.log(propertyObj);
        //process.exit(1);
      }
    } // else continue our loop
  }

  return propertyObj;
}

async function getDescriptionOfProp(name) {
  // We will gather a description by checking if there's a document written
  // on MDN for our property and then extract a summary from there.

  if (fs.existsSync(`./node_modules/content/files/en-us/web/css/${name}/index.md`)) {
    let file = fs.readFileSync(`./node_modules/content/files/en-us/web/css/${name}/index.md`, { encoding: "utf8" });

    // Here we will do a quick and dirty way to parse the markdown file to retreive a raw string
    let breaks = file.split("---");

    // The first two breaks should be the yaml metadata block
    let data = breaks[2].replace(/\{\S+\}/gm, "");
    let summaryRaw = data.split("\n");
    // In case the first few lines is an empty line break
    for (let i = 0; i < summaryRaw.length; i++) {
      if (summaryRaw[i].length > 1) {
        return summaryRaw[i]
          .replace(/\*/g, "")
          .replace(/\`/g, "")
          .replace(/\[([\S ]+)\]\(\S+\)/, '$1');
      }
    }
  } else {
    // A document doesn't yet exist. Let's return an empty value.
    return "";
  }
}

async function getValuesOfProp(value, allValues) {
  // value holds the value string of the values we expect
  // allValues holds all of the values that apply to the spec
  // Like mentioned above `value` = "value1 | value2 | <valueGroupName>"


}

update();
