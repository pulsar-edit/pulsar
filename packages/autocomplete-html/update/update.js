/**
  This file will manage the updating of `autocomplete-html` `completions.json`
  We will partially utilize `@webref/elements` `.listAll()` function that returns
  a full list of HTML Elements along with a defined `interface`.
  To use this `interface` in any meaningful way, we will utilize the dataset
  of Attributes that apply to each `interface` from Chromiums DevTools resource
  `https://github.com/ChromeDevTools/devtools-frontend`.
  Finally from here we will utilize `https://github.com/mdn/content` to parse
  the Markdown docs of MDN's website to retreive descriptions for each element.

  Now for a summary of our `completions.json` file we aim to generate.
  There are two top level elements, `tags` and `attributes`, both objects.
  Within `tags` we expect the following:
  "tags": {
    "a": {
      "attributes": [ "href", "hreflang", "media", "rel", "target", "type" ],
      "description": "....."
    }
  };

  When an entry contains no `attributes` there is no empty array, the element
  simply doesn't exist.

  The `attributes` object contains keys of different elements that themselves
  are objects that can contain several valid keys.
  - global: Seems to be used exclusively for Global Attributes. Is a boolean
            which when false, the key does not appear.
  - type: A ?type? for the attribute. It's meaning is not immediately known.
          Nor a way to reliabley programatically collect it. Some discovered values:
          * cssStyle: Exclusively used for `class` attribute
          * boolean: Attributes that only accept `true` or `false`
          * flag: For attributes that don't require or accept values. eg autoplay
          * cssId: Exclusively used for the `id` attribute
          * color: Exclusively used for the `bgcolor` attribute
          * style: Exclusively used for the `style` attribute
  - description: A text description of the attribute
  - attribOption: A string array of valid values that can exist within the attribute.
                  Such as the case with `rel` where only so many valid options exist.

  Although with our data sources mentioned above, we are able to collect nearly
  all the data needed. Except the `type` that is defined within our
  `completions.json` as well as the `attribOption` within our completions.

  Studying these closer reveals that all attributes listing with our `completions.json`
  do not appear elsewhere, and are nearly all global attributes.

  In this case since there is no sane way to collect this data, we will leave this
  list as a manually maintained section of our `completions.json`.
  This does mean that `curated-attributes.json` is a static document that
  will require manual updating in the future. Or most ideally, will find a way
  to automatically generate the needed data.
*/

const chromiumElementsShim = require("./chromium-elements-shim.js");
const curatedAttributes = require("./curated-attributes.json");
const validate = require("./validate.js");
const elements = require("@webref/elements");
const fs = require("fs");

let GLOBAL_ATTRIBUTES = [];

async function update() {
  const chromiumElements = await chromiumElementsShim.bootstrap();
  const htmlElementsRaw = await elements.listAll();

  // Lets then validate our current data
  if (!validate.htmlElementsRaw(htmlElementsRaw)) {
    console.log(validate.htmlElementsRaw(htmlElementsRaw));
    process.exit(1);
  }

  // Then validate the devtools data
  if (!validate.devToolsDom(chromiumElements.DOMPinnedProperties)) {
    console.log(validate.devToolsDom(chromiumElements.DOMPinnedProperties));
    process.exit(1);
  }

  const fullArrayHtmlElements = buildHtmlElementsArray(htmlElementsRaw);

  const tagsWithAttrs = matchElementInterface(fullArrayHtmlElements, chromiumElements.DOMPinnedProperties);
  // tagsWithAttrs gives us an already built object for tags. Including their description.

  // Like mentioned in the docs above, instead of manually curate and organize
  // several aspects of the attributes portion of the file
  // we will simply just insert the manually curated file itself, allowing for any
  // change to occur to it later on as needed, as no good data source specifies
  // what is needed to create it.

  const completion = {
    tags: tagsWithAttrs,
    attributes: curatedAttributes
  };

  // Now to write our file
  fs.writeFileSync("./completions.json", JSON.stringify(completion, null, 2));

  // Now to check if our attributes contains all of the global values that we saw.
  const missingGlobals = confirmGlobals(curatedAttributes, GLOBAL_ATTRIBUTES);

  if (missingGlobals.length > 0) {
    console.log(missingGlobals);
    console.log("Above are the globals found during updating that do not exist in Curated Attributes.");
    console.log(`Total Missing Global Attributes: ${missingGlobals.length}`);
  }

  console.log("Updated all `autocomplete-html` completions.");
}

function confirmGlobals(have, want) {
  // have is an object, meanwhile want's is an array
  let result = [];

  for (const w of want) {
    if (typeof have[w] !== "object") {
      result.push(w);
    }
  }

  return result;
}

function buildHtmlElementsArray(elements) {
  let elementArray = [];

  for (const spec in elements) {
    if (Array.isArray(elements[spec].elements)) {
      for (const ele of elements[spec].elements) {
        elementArray.push(ele);
      }
    }
  }

  return elementArray;
}

function matchElementInterface(elements, domProperties) {
  let outElements = {};

  for (const ele of elements) {
    let tags = resolveElementInterfaceAttrs(ele, domProperties);

    outElements[ele.name] = {};

    if (tags.length > 0) {
      outElements[ele.name].attributes = tags;
    }

    let desc = getElementDescription(ele.name);
    outElements[ele.name].description = desc;

  }

  return outElements;
}

function resolveElementInterfaceAttrs(element, domProperties) {
  let attrs = [];
  let interfaceArray = [];

  if (typeof element.interface === "string") {
    interfaceArray.push(element.interface);
  }

  // Now to loop through every interface and resolve the tags within.
  while (interfaceArray.length > 0) {
    let inter = interfaceArray[0];

    if (domProperties[inter]) {
      // First add all immediate props
      for (const prop in domProperties[inter].props) {
        if (!domProperties[inter].props[prop].global && inter !== "GlobalEventHandlers") {
          // Seems that according to the previous completions.json
          // We don't want to include any global values in our individual attributes
          attrs.push(prop);
        } else {
          // We don't want global attributes on our actual completions. But do want them tracked
          if (!GLOBAL_ATTRIBUTES.includes(prop)) {
            GLOBAL_ATTRIBUTES.push(prop);
          }
        }
      }
      // Now resolve any additional interfaces, by adding them to our existing array
      if (typeof domProperties[inter].inheritance === "string") {
        interfaceArray.push(domProperties[inter].inheritance);
      }
      if (Array.isArray(domProperties[inter].includes)) {
        interfaceArray = interfaceArray.concat(domProperties[inter].includes);
      }
    }
    // Now we have done everything needed for this one interface to be resolved,
    // so we can just remove the first element of the array and let the while
    // loop continue
    interfaceArray.shift();
  }

  // Return our final list of attributes
  return attrs;
}

function getElementDescription(element) {
  // We will gather a description by checking if there's a document written
  // on MDN for our Element and then extract a summary from there.

  // Some elements are similar enough they exist in a single folder of a different
  // name. So we will manually intervein in those cases.

  if (element.match(/^h[1-6]$/)) {
    element = 'heading_elements';
  }

  let file;

  // First lets find the file, but when not initially found, we will continue
  // to search valid locations. Since MDN has content of valid tags seperated
  // by essentially the spec they exist in.
  const filePath = [ "html", "svg", "mathml" ].map(path =>
    `./node_modules/content/files/en-us/web/${path}/element/${element}/index.md`
  ).find(f => fs.existsSync(f));

  if (filePath) {
    file = fs.readFileSync(filePath, { encoding: "utf8" });
  }

  if (typeof file === "string") {
    // Now lets parse the file, as long as it was assigned at some point in
    // the above checks.

    // This logic is largely borrowed from `autocomplete-css` update.js Which does the same thing.
    let breaks = file.split("---");

    // The first two breaks should be the yaml metadata block
    let data = breaks[2].replace(/\{\{\S+\}\}\{\{\S+\}\}/gm, "")
                        .replace(/\{\{HTMLSidebar\}\}/gm, "") // Used when within `web/html`
                        .replace(/\{\{SVGRef\}\}/gm, "") // used when within `web/svg`
                        .replace(/\{\{MathMLRef\}\}/gm, ""); // used when within `web/mathml`

    let summaryRaw = data.split("\n");
    // In case the first few lines is an empty line break
    for (let i = 0; i < summaryRaw.length; i++) {
      if (summaryRaw[i].length > 1) {
        return sanitizeDescription(summaryRaw[i]);
      }
    }
  } else {
    // No proper file was ever found. Return an empty description
    return "";
  }

}

function sanitizeDescription(input) {
  return input
          .replace(/\{\{\S+\("(\S+)"\)\}\}/g, '$1')
            // ^ Parses special MDN Markdown Links.
            // eg. {{htmlattrxref("title")}} => title
            // Where we still want to keep the text within
          .replace(/[\*\`\{\}\"]/g, "") // Removes special Markdown based characters
          .replace(/\[([A-Za-z0-9-_* ]+)\]\(\S+\)/g, '$1');
          // ^ Parses Markdown links, extracting only the linked text
          // eg. [HTML](/en-US/docs/Web/HTML) => HTML
}

update();

module.exports = {
  sanitizeDescription,
};
