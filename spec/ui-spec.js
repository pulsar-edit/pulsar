
describe("Renders Markdown", () => {
  describe("properly when given no opts", () => {
    it("handles bold", () => {
      expect(atom.ui.markdown.render("**Hello World**"))
        .toBe("<p><strong>Hello World</strong></p>\n");
    });
  });

  describe("transforms links correctly", () => {
    it("makes no changes to a fqdn link", () => {
      expect(atom.ui.markdown.render("[Hello World](https://github.com)"))
        .toBe('<p><a href="https://github.com">Hello World</a></p>\n');
    });
    it("resolves package links to pulsar", () => {
      expect(atom.ui.markdown.render("[Hello](https://atom.io/packages/hey-pane)"))
        .toBe('<p><a href="https://web.pulsar-edit.dev/packages/hey-pane">Hello</a></p>\n');
    });
    it("resolves atom links to web archive", () => {
      expect(atom.ui.markdown.render("[Hello](https://flight-manual.atom.io/some-docs)"))
        .toBe('<p><a href="https://web.archive.org/web/20221215003438/https://flight-manual.atom.io/some-docs">Hello</a></p>\n');
    });
    it("resolves incomplete local links", () => {
      expect(atom.ui.markdown.render(
        "[Hello](./readme.md)",
        { rootDomain: "https://github.com/pulsar-edit/pulsar" }
      )).toBe('<p><a href="https://github.com/pulsar-edit/pulsar/blob/HEAD/readme.md">Hello</a></p>\n');
    });
    it("resolves incomplete root links", () => {
      expect(atom.ui.markdown.render(
        "[Hello](/readme.md)",
        { rootDomain: "https://github.com/pulsar-edit/pulsar" }
      )).toBe('<p><a href="https://github.com/pulsar-edit/pulsar/blob/HEADreadme.md">Hello</a></p>\n');
    });
  });

});
