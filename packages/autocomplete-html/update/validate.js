const Joi = require("joi");

function htmlElementsRaw(obj) {
  // Function to validate structure of the `@webref/elements` `.listAll()`

  const innerSchema = Joi.object({
    "spec": Joi.object({ // Details on the spec
      "title": Joi.string().required(), // The title of the spec
      "url": Joi.string().required(), // URL to the definition of the spec
    }).required(),
    "elements": Joi.array().items( // the elements object is an array of objects
      Joi.object({
        "name": Joi.string().required(), // The name of the element
        "interface": Joi.string().optional(), // The optional interface of the element
        // ^ The interface name will match one from DevTools data.
        "obsolete": Joi.boolean().truthy().optional()
        // ^ The optional and uncommon boolean to indicate an element is absolete
      }).required()
    ).required()
  });

  let valid = true;
  let error = [];

  for (const ele in obj) {
    // The first key is the name of the spec the element is apart of.
    let validation = innerSchema.validate(obj[ele]);

    if (validation.error) {
      error.push(validation.error);
      valid = false;
    }
  }

  if (!valid) {
    console.log(error);
    return false;
  } else {
    return true;
  }
}

function devToolsDom(obj) {
  // Validates the structure of the data returned from Chromiums DevTools
  // DOMPinnedProperties
  // Read More: https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/javascript_metadata/DOMPinnedProperties.ts
  const innerSchema = Joi.object({
    "inheritance": Joi.string().optional(), // An interface to inherit
    "includes": Joi.array().items(Joi.string()), // An array of interfaces included with our current interface
    "props": Joi.object(), // An object list of properties. Where the key is the property name
  }).unknown();

  let valid = true;
  let error = [];

  for (const inter in obj) {
    // The first key is the name of an interface
    let validation = innerSchema.validate(obj[inter]);

    if (validation.error) {
      error.push(validation.error);
      valid = false;
    }
  }

  if (!valid) {
    console.log(error);
    return false;
  } else {
    return true;
  }
}

module.exports = {
  htmlElementsRaw,
  devToolsDom,
};
