/**
  This file will manage the updating of `autocomplete-html` `completions.json`
  We will partially utilize `@webref/elements` .listAll() function that returns
  a full list of HTML Elements along with a defined `interface`.
  To be able to use this `interface` in any meaningful way, we will utilize
  the dataset of Attributes that apply to each `interface` from Chromiums DevTools
  resource 'https://github.com/ChromeDevTools/devtools-frontend'
  Finally from here we will utilize https://github.com/mdn/content to parse
  the Markdown docs of MDN's website to retreive descriptions for each element.
  ==============================================================================
  ==============================================================================
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
  ==============================================================================
  ==============================================================================
  A quick check in for the structure of `@webref/elements` `listAll()` return.
  This will return an object, where each top level key is a HTML spec name.
  Then within each will be some information on the spec, and `elements` an array
  of objects that will contain the `name` of our element, and it's interface name.
  {
    "css-masking-1": {
      "spec": {},
      "elements": [
        { "name": "clipPath", "interface": "SVGClipPathElement" },
        { "name": "mask", "interface": "SVGMaskElement" }
      ]
    }
  };

  The `interface` here should match a return that we can receive from DevTools data.
  ==============================================================================
  ==============================================================================
  DevTools data then, is an object where the top level key is that of an `interface`
  This interface can be retreived from `@webref/elements` or may be declared
  internally.
  Then within each `interface` object several possible values:
    - inheritance: The value is a string. 'An inherited Type.' An additional
                    applicable interface.
    - includes: An array of strings. 'A set of Types to also include properties from.'
                Additional interfaces to includes properties of.
    - props: An object list of valid properties for the interface. Each prop
             iteself may contain values or may be empty. Possible values:
             * global: Only present when `global: true`, otherwise a global
                        Attribute value.
            * specs: A number. Refers to `SPECS` exported from the same DevTools
                    source code. Where values are `html`, `dom`, `cssom`.
                    We likely will not find any use here.
  To view the structure of this file visit:
  https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/javascript_metadata/DOMPinnedProperties.ts
  ==============================================================================
  ==============================================================================
  Finally with the topics covered above we are able to collect all the data needed.
  The only value that is not being retreived or covered here is:
  - `type`: The type defined within our `completions` attributes. Now the global
  attribute could be retreived by looking for the value from the DevTools data
  or could be known that when we find MDNs documentation for it, the global
  attribute docs reside in a different folder than the rest of the docs. But
  for all other types we may need to keep a manual list of where it applies.
  Most types only apply to a single attribute so would be simple, but
  `boolean` and `flag` types may have to be manually maintained.
  - `attribOption`: The valid values to pass an attribute currently
  does not have any consistent method to retreive valid values.
  Ideally this can be found within the `@webref` data, or alternatively may be
  collected from MDNs `web/html/attributes` documents. But may prove to be difficult
  to reliably parse.

  A note is that further research shows that MDNs attributes documentation cannot
  be created the same way as one would expect. That is by the folder names
  within the `web/html/attributes` folder. Instead we may have to parse
  a table of values from `attributes/index.md` as that contains many items and links
  to unwritten pages.
  ==============================================================================
  ==============================================================================
  The last note of our implementation.
  The provided attributes used within our `completions.json` seem interesting.
  The majority of them are only attributes that are not suggested via tags we have.
  Additionally all of the information, like mentioned earlier, would be rather
  difficult to automatically collect. Since we have no reliable way to obtain `type`,
  `global` values. With only the `description` being acheivable. But considering
  that this list is non-exhustive, and is explicitely items not included above
  it leads me to beleive that this list has been manually curated since inception.
  And rather than attempt to manually curate all of it's unique parts with only
  descriptions and global status being manual, while increasing the size ten-fold
  to include all possible attributes, it may be best to leave as is, and reinsert
  it into our completions during update time.
 */

const chromiumElementsShim = require("./chromium-elements-shim.js");
const curatedAttributes = require("./curated-attributes.json");
const elements = require("@webref/elements");
const fs = require("fs");

let GLOBAL_ATTRIBUTES = [];

async function update() {
  const chromiumElements = await chromiumElementsShim.bootstrap();
  const htmlElementsRaw = await elements.listAll();

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

  console.log("Updated all `autocomplete-html` completions.");
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
    let interface = interfaceArray[0];

    if (domProperties[interface]) {
      // First add all immediate props
      for (const prop in domProperties[interface].props) {
        attrs.push(prop);

        // Then add any needed values to our global attributes
        if (domProperties[interface].props[prop].global && !GLOBAL_ATTRIBUTES.includes(prop)) {
          GLOBAL_ATTRIBUTES.push(prop);
        }
      }
      // Now resolve any additional interfaces, by adding them to our existing array
      if (typeof domProperties[interface].inheritance === "string") {
        interfaceArray.push(domProperties[interface].inheritance);
      }
      if (Array.isArray(domProperties[interface].includes)) {
        interfaceArray = interfaceArray.concat(domProperties[interface].includes);
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

  const substitueElements = {
    "h1": "heading_elements",
    "h2": "heading_elements",
    "h3": "heading_elements",
    "h4": "heading_elements",
    "h5": "heading_elements",
    "h6": "heading_elements"
  };

  if (substitueElements[element]) {
    element = substitueElements[element];
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
        return summaryRaw[i]
                .replace(/\{\{\S+\("(\S+)"\)\}\}/g, '$1')
                  // ^ Parses special MDN Markdown Links.
                  // eg. {{htmlattrxref("title")}} => title
                  // Where we still want to keep the text within
                .replace(/[\*\`\{\}\"]/g, "") // Removes special Markdown based characters
                .replace(/\[([A-Za-z0-9-_* ]+)\]\(\S+\)/g, '$1');
                // ^ Parses Markdown links, extracting only the linked text
                // eg. [HTML](/en-US/docs/Web/HTML) => HTML
      }
    }
  } else {
    // No proper file was ever found. Return an empty description
    return "";
  }

}


update();
