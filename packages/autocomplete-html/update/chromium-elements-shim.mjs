import * as tsImport from 'ts-import';

export const bootstrap = async () => {
  const filePath = "./node_modules/chrome-devtools-frontend/front_end/models/javascript_metadata/DOMPinnedProperties.ts";
  const compiled = await tsImport.default.tsImport.compile(filePath);

  return compiled;
};

// Used to aid in the automated process of updating `completions.json`
// More information in `chromium-elements-shim.js`
