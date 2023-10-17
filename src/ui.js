const MarkdownIt = require("markdown-it");
const { TextEditor } = require("atom");
const { Matcher } = require("@pulsar-edit/fuzzy-native");
let yamlFrontMatter, markdownItEmoji, markdownItGitHubHeadings, markdownItTaskCheckbox;

// Regex Declarations
const reg = {
  localLinks: {
    currentDir: new RegExp(/^\.\//),
    rootDir: new RegExp(/^\//)
  },
  atomLinks: {
    package: new RegExp(/^https:\/\/atom\.io\/packages\/(.*)$/),
    flightManual: new RegExp(/^https:\/\/flight-manual\.atom\.io\//)
  }
};

function renderMarkdown(content, givenOpts = {}) {
  // First we will setup our markdown renderer instance according to the opts provided
  const defaultOpts = {
    renderMode: "full", // Determines if we are rendering a fragment or full page.
    // Valid values: 'full', 'fragment'
    html: true, // Enable HTML tags in source
    breaks: true, // Convert `\n` in paragraphs into `<br>`
    handleFrontMatter: true, // Determines if Front Matter content should be parsed
    useDefaultEmoji: true, // Use `markdown-it-emoji`
    useGitHubHeadings: true, // Use `markdown-it-github-headings`
    useTaskCheckbox: true, // Use `markdown-it-task-checkbox`
    taskCheckboxDisabled: true, // `markdown-it-task-checkbox`: Disable checkbox interactivity
    taskCheckboxDivWrap: false, // `markdown-it-task-checkbox`: Wrap div arround checkboc
    transformImageLinks: true, // Attempt to resolve image urls
    transformAtomLinks: true, // Attempt to rewrite links to Atom pages, changing them to Pulsar
    transformNonFqdnLinks: true, // Attempt to resolve non-FQDN links
    rootDomain: "", // The root URL that should be used for the above 'transform' options
  };

  let opts = { ...defaultOpts, ...givenOpts };

  const validateRootDomain = () => {
    return typeof opts.rootDomain === "string" && opts.rootDomain.length > 1;
  };

  const cleanRootDomain = () => {
    return opts.rootDomain.replace(".git", "");
  };

  const markdownItOpts = {
    html: opts.html,
    breaks: opts.breaks
  };

  let md = new MarkdownIt(markdownItOpts);

  if (opts.useDefaultEmoji) {
    markdownItEmoji = require("markdown-it-emoji");
    md.use(markdownItEmoji, {});
  }
  if (opts.useGitHubHeadings) {
    markdownItGitHubHeadings = require("markdown-it-github-headings");
    md.use(markdownItGitHubHeadings, {});
  }
  if (opts.useTaskCheckbox) {
    markdownItTaskCheckbox = require("markdown-it-task-checkbox");
    md.use(markdownItTaskCheckbox, {
      disabled: opts.taskCheckboxDisabled,
      divWrap: opts.taskCheckboxDivWrap
    });
  }
  if (opts.transformImageLinks && validateRootDomain()) {
    // Here we will take any links for images provided in the content, and do
    // our best to ensure they can accurately resolve.
    const defaultImageRenderer = md.renderer.rules.image; // We want to keep access to this

    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      let token = tokens[idx];
      let aIndex = token.attrIndex("src");

      // Lets say content contains './my-cool-image.png'
      // We need to turn it into something like this:
      // https://github.com/USER/REPO/raw/HEAD/my-cool-image.png
      if (reg.localLinks.currentDir.test(token.attrGet("src"))) {
        let rawLink = token.attrGet("src");
        rawLink = rawLink.replace(reg.localLinks.currentDir, "");
        token.attrSet("src", `${cleanRootDomain()}/raw/HEAD/${rawLink}`);
      } else if (reg.localLinks.rootDir.test(token.attrGet("src"))) {
        let rawLink = token.attrGet("src");
        rawLink = rawLink.replace(reg.localLinks.rootDir, "");
        token.attrSet("src", `${cleanRootDomain()}/raw/HEAD/${rawLink}`);
      } else if (!token.attrGet("src").startsWith("http")) {
        // Check for implicit relative urls
        let rawLink = token.attrGet("src");
        token.attrSet("src", `${cleanRootDomain()}/raw/HEAD/${rawLink}`);
      } else if ([".gif", ".png", ".jpg", ".jpeg", ".webp"].find(ext => token.attrGet("src").endsWith(ext)) && token.attrGet("src").startsWith("https://github.com") && token.attrGet("src").includes("blob")) {
        // Should match any image being distributed from GitHub that's using `blob` instead of `raw` causing images to not load correctly
        let rawLink = token.attrGet("src");
        token.attrSet("src", rawLink.replace("blob", "raw"));
      }

      // pass token to default renderer
      return defaultImageRenderer(tokens, idx, options, env, self);
    };
  }
  if (validateRootDomain() && (opts.transformNonFqdnLinks || opts.transformAtomLinks)) {
    md.core.ruler.after("inline", "fix-atom-links", (state) => {
      state.tokens.forEach((blockToken) => {
        if (blockToken.type === "inline" && blockToken.children) {
          blockToken.children.forEach((token) => {
            if (token.type === "link_open") {
              token.attrs.forEach((attr) => {
                if (attr[0] === "href") {
                  let link = attr[1];

                  if (opts.transformAtomLinks && reg.atomLinks.package.test(link)) {
                    // Fix any links that attempt to point to packages on `https://atom.io/packages/...`
                    attr[1] = `https://web.pulsar-edit.dev/packages/${link.match(reg.atomLinks.package)[1]}`;
                  } else if (opts.transformNonFqdnLinks && reg.localLinks.currentDir.test(link)) {
                    attr[1] = `${cleanRootDomain()}/raw/HEAD/${link.replace(reg.localLinks.currentDir, "")}`;
                  } else if (opts.transformNonFqdnLinks && reg.localLinks.rootDir.test(link)) {
                    attr[1] = `${cleanRootDomain()}/raw/HEAD/${link.replace(reg.localLinks.rootDir, "")}`;
                  } else if (opts.transformNonFqdnLinks && !link.startsWith("http")) {
                    attr[1] = `${cleanRootDomain()}/raw/HEAD/${link.replace(".git", "")}`;
                  } else if (opts.transformAtomLinks && reg.atomLinks.flightManual.test(link)) {
                    // Resolve any links to the flight manual to web archive
                    attr[1] = link.replace(reg.atomLinks.flightManual, "https://web.archive.org/web/20221215003438/https://flight-manual.atom.io/");
                  }
                }
              });
            }
          });
        }
      });
    });
  }

  let textContent;

  if (opts.handleFrontMatter) {
    yamlFrontMatter = require("yaml-front-matter");
    const { __content, vars } = yamlFrontMatter.loadFront(content);

    const renderYamlTable = (variables) => {
      if (typeof variables === "undefined") {
        return "";
      }

      const entries = Object.entries(variables);

      if (!entries.length) {
        return "";
      }

      const markdownRows = [
        entries.map(entry => entry[0]),
        entries.map(entry => '--'),
        entries.map((entry) => {
          if (typeof entry[1] === "object" && !Array.isArray(entry[1])) {
            // Remove all newlines, or they ruin formatting of parent table
            return md.render(renderYamlTable(entry[1])).replace(/\n/g, "");
          } else {
            return entry[1];
          }
        })
      ];

      return (
        markdownRows.map(row => "| " + row.join(" | ") + " |").join("\n") + "\n"
      );
    };

    textContent = renderYamlTable(vars) + __content;
  } else {
    textContent = content;
  }

  let rendered;

  if (opts.renderMode === "fragment") {
    rendered = md.renderInline(textContent);
  } else {
    // Captures "full" and anything else
    rendered = md.render(textContent);
  }

  return rendered;
}

function applySyntaxHighlighting(content, givenOpts = {}) {
  const defaultOpts = {
    syntaxScopeNameFunc: null, // Function used to resolve codeblock fences language id
    // to a Pulsar Grammar source. Should be a function that takes the declared scope and returns a source,
    grammar: null,
    renderMode: "full", // Just like in `renderMarkdown` this can be full or fragment
  };

  const opts = { ...defaultOpts, ...givenOpts };

  const scopeForFenceName = (fence) => {
    if (typeof opts.syntaxScopeNameFunc == "function") {
      return opts.syntaxScopeNameFunc(fence);
    } else {
      // We could build one in, or just return default
      return "text.plain";
    }
  };

  let defaultLanguage;
  const fontFamily = atom.config.get("editor.fontFamily");

  if ((opts.grammar != null ? opts.grammar.scopeName : undefined) === "source.litcoffee") {
    // This behavior is carried over from `markdown-preview` but it's purpose and need
    // is not fully understood.
    defaultLanguage = "coffee";
  } else {
    defaultLanguage = "text";
  }

  if (fontFamily) {
    for (const codeElement of content.querySelectorAll("code")) {
      codeElement.style.fontFamily = fontFamily;
    }
  }

  const promises = [];
  for (const preElement of content.querySelectorAll("pre")) {
    const codeBlock = preElement.firstElementChild != null  ? preElement.firstElementChild : preElement;
    const className = codeBlock.getAttribute("class");
    const fenceName = className != null ? className.replace(/^language-/, "") : defaultLanguage;

    const editor = new TextEditor({
      readonly: true,
      keyboardInputEnabled: false
    });

    const editorElement = editor.getElement();

    preElement.classList.add("editor-colors", `lang-${fenceName}`);
    editorElement.setUpdatedSynchronously(true);
    preElement.innerHTML = "";
    preElement.parentNode.insertBefore(editorElement, preElement);
    editor.setText(codeBlock.textContent.replace(/\r?\n%/, ""));
    atom.grammars.assignLanguageMode(editor, scopeForFenceName(fenceName));
    editor.setVisible(true);

    let editorCallback;

    if (opts.renderMode === "fragment") {
      editorCallback = (editorElementToModify, preElementToModify) => {
        return new Promise((resolve) => {
          const editorModel = editorElementToModify.getModel();
          const done = () => {
            editorModel.component.getNextUpdatePromise().then(() => {
              for (const line of editorElementToModify.querySelectorAll(".line:not(.dummy)")) {
                const line2 = document.createElement("div");
                line2.className = "line";
                line2.innerHTML = line.firstChild.innerHTML;
                preElementToModify.appendChild(line2);
              }
              editorElementToModify.remove();
              resolve();
            });
          };
          const languageMode = editorModel.getBuffer().getLanguageMode();
          if (languageMode.fullyTokenized || languageMode.tree) {
            done();
          } else {
            editorModel.onDidTokenize(done);
          }
        });
      };
    } else {
      // Captures full and defaults
      editorCallback = (editorElementToModify, preElementToModify) => {
        preElementToModify.remove();
        editorElementToModify.setAttributeNode(document.createAttribute("gutter-hidden")); // Hide gutter
        editorElementToModify.removeAttribute("tabindex"); // Make read-only

        // Remove line decorations from code blocks
        for (const cursorLineDecoration of editorElementToModify.getModel().cursorLineDecorations) {
          cursorLineDecoration.destroy();
        }
      };
    }
    promises.push(editorCallback(editorElement, preElement));
  }
  return Promise.all(promises);
}

function convertToDOM(content) {
  const template = new DOMParser().parseFromString(content, "text/html");
  return template.body;
}

function setCandidates(matcherOrCandidates, candidates) {
  if(candidates) {
    matcherOrCandidates.setCandidates(
      [...Array(candidates.length).keys()],
      candidates
    );
    return matcherOrCandidates;
  } else {
    return new Matcher(
      [...Array(matcherOrCandidates.length).keys()],
      matcherOrCandidates
    );
  }
}
const fuzzyMatcher = {
  setCandidates: setCandidates,
  score(candidate, query) {
    const matcher = setCandidates([candidate]);
    return matcher.match(query)[0].score;
  }
}

module.exports = {
  renderMarkdown,
  applySyntaxHighlighting,
  convertToDOM,
  fuzzyMatcher
};
