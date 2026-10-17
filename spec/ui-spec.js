const dedent = require('dedent');
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();

describe("Renders Markdown", () => {
  describe("properly when given no opts", () => {
    it("handles bold", () => {
      expect(atom.ui.markdown.render("**Hello World**"))
        .toBe("<p><strong>Hello World</strong></p>\n");
    });
  });

  it(`escapes HTML in code blocks properly`, () => {
    let input = dedent`
    Lorem ipsum dolor.

    \`\`\`html
    <p>sit amet</p>
    \`\`\`
    `

    let expected = dedent`
    <p>Lorem ipsum dolor.</p>
    <pre><code class="language-html">&lt;p&gt;sit amet&lt;/p&gt;
    </code></pre>
    `

    expect(
      atom.ui.markdown.render(input).trim()
    ).toBe(expected);
  })

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
      )).toBe('<p><a href="https://github.com/pulsar-edit/pulsar/blob/HEAD/readme.md">Hello</a></p>\n');
    });
    it("preserves in-page fragment links", () => {
      expect(atom.ui.markdown.render(
        "[Install](#install)",
        { rootDomain: "https://github.com/pulsar-edit/pulsar" }
      )).toBe('<p><a href="#install">Install</a></p>\n');
    });
    it("still rewrites relative links that contain a fragment", () => {
      expect(atom.ui.markdown.render(
        "[Install](./README.md#install)",
        { rootDomain: "https://github.com/pulsar-edit/pulsar" }
      )).toBe('<p><a href="https://github.com/pulsar-edit/pulsar/blob/HEAD/README.md#install">Install</a></p>\n');
    });
  });

  describe("handles GitHub headings", () => {
    it("does not add heading ids unless enabled", () => {
      const output = atom.ui.markdown.render("## Install");
      expect(output).not.toContain('id=');
      expect(output).not.toContain('<a');
    });
    it("adds a safely prefixed id while preserving the fragment href", () => {
      const output = atom.ui.markdown.render(
        "## Install",
        { useGitHubHeadings: true }
      );
      expect(output).toContain('id="user-content-install"');
      expect(output).toContain('href="#install"');
    });
    it("does not inject heading link icons", () => {
      const output = atom.ui.markdown.render(
        "## Install",
        { useGitHubHeadings: true }
      );
      expect(output).not.toContain('<svg');
      expect(output).not.toContain('octicon');
    });
    it("keeps DOM-clobbering heading ids after sanitization", () => {
      const output = atom.ui.markdown.render(
        "## Title",
        { useGitHubHeadings: true, sanitize: true }
      );
      expect(output).toContain('id="user-content-title"');
    });
    it("does not rewrite the heading's own fragment href when a rootDomain is set", () => {
      const output = atom.ui.markdown.render(
        "## Install",
        { useGitHubHeadings: true, rootDomain: "https://github.com/pulsar-edit/pulsar" }
      );
      expect(output).toContain('href="#install"');
      expect(output).not.toContain('blob/HEAD');
    });
  });

  describe("transforms images correctly", () => {
    it("properly handles a standard PNG image", () => {
      expect(atom.ui.markdown.render(
        "![Alt Text](/image-link.png)",
        { rootDomain: "https://github.com/pulsar-edit/pulsar" }
      )).toBe('<p><img src="https://github.com/pulsar-edit/pulsar/raw/HEAD/image-link.png" alt="Alt Text"></p>\n');
    });

    it("handles 'data:image/svg+xml' images", () => {
      expect(atom.ui.markdown.render(
        "![Baseline icon](data:image/svg+xml;base64,SoMeBaSe64cArAcTerS+)"
      )).toBe(
        '<p><img src="data:image/svg+xml;base64,SoMeBaSe64cArAcTerS+" alt="Baseline icon"></p>\n'
      );
    });

    describe("when given only a filePath", () => {
      let dir, filePath, imagePath;

      beforeEach(() => {
        dir = temp.mkdirSync('atom-spec-ui-images');
        filePath = path.join(dir, 'README.md');
        imagePath = path.join(dir, 'image.png');
        fs.writeFileSync(imagePath, '');
      });

      const render = (markdown, opts = {}) =>
        atom.ui.markdown.render(markdown, { filePath, ...opts });

      it("resolves an implicit relative path to an existing file", () => {
        expect(render("![a](image.png)")).toContain(`src="${imagePath}"`);
      });

      it("resolves a `./` path to an existing file", () => {
        expect(render("![a](./image.png)")).toContain(`src="${imagePath}"`);
      });

      it("leaves an absolute path to an existing file alone", (done) => {
        // A Windows path isn't a valid Markdown link destination: its
        // backslashes are treated as escapes or percent-encoded. This spec is
        // about POSIX-style absolute paths, which start with `/`.
        jasmine.filterByPlatform({ except: ['win32'] }, done);

        expect(render(`![a](${imagePath})`)).toContain(`src="${imagePath}"`);
        done();
      });

      it("leaves paths to missing files alone instead of throwing", () => {
        expect(render("![a](missing.png)")).toContain('src="missing.png"');
        expect(render("![a](./missing.png)")).toContain('src="./missing.png"');
        expect(render("![a](/no/such/dir/missing.png)")).toContain(
          'src="/no/such/dir/missing.png"'
        );
      });

      it("falls back to a GitHub URL for a missing file when a GitHub rootDomain is also given", () => {
        expect(
          render("![a](missing.png)", {
            rootDomain: "https://github.com/pulsar-edit/pulsar"
          })
        ).toContain(
          'src="https://github.com/pulsar-edit/pulsar/raw/HEAD/missing.png"'
        );
      });
    });
  });

});
