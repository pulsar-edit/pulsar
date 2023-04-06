/**
 This file aims to run some short simple tests against `update.js`. Focusing
 mainly on the Regex used within `sanitizeDescription()`
*/

const update = require("./update.js");

describe("Parses Descriptions Properly from Markdown", () => {

  test("Extracts Markdown Links text", () => {
    const text = "Here is my very important [link](https://github.com/pulsar-edit/pulsar)!";

    const out = update.sanitizeDescription(text);

    expect(out).toBe("Here is my very important link!");
  });

  test("Removes some Markdown characters", () => {
    const text = "Some *Bolded* text, some **italic** text";

    const out = update.sanitizeDescription(text);

    expect(out).toBe("Some Bolded text, some italic text");
  });

  test("Extracts Text from MDNs special Links", () => {
    const text = 'What about {{htmlattrxref("this?")}}';

    const out = update.sanitizeDescription(text);

    expect(out).toBe("What about this?");
  });

});
