const UI = require("../src/ui.js");

describe("Just testing for now", async () => {
  console.log("here0");
  const content =
`
# Hello World

My friends

\`\`\`javascript
const hello = "world";
\`\`\`

`;

  console.log("here4");
  try {
    const html = UI.markdown.renderMarkdown(content);
    console.log("here3");
    console.log(html);

    const htmlDom = UI.markdown.convertToDOM(html);

    console.log("here1");
    await UI.markdown.applySyntaxHighlighting(htmlDom);
    console.log("here2");

    console.log(htmlDom.innerHTML);

  } catch(er) {
    console.log("we errored");
    console.error(er);
  }

});
