const path = require("path");
const fs = require("fs");
const MarkdownIt = require("markdown-it");
const { TextEditor } = require("atom");
const { Matcher } = require("@pulsar-edit/fuzzy-native");
let yamlFrontMatter, markdownItEmoji, markdownItGitHubHeadings, markdownItTaskCheckbox;

// Helper Markdown Components
const mdComponents = {
  deps: {
    domPurify: null,
    yamlFrontMatter: null,
    markdownItEmoji: null,
    markdownItGitHubHeadings: null,
    markdownItTaskCheckbox: null
  },
  // Regex Declarations
  reg: {
    localLinks: {
      currentDir: new RegExp(/^\.\//),
      rootDir: new RegExp(/^\//)
    },
    globalLinks: {
      base64: new RegExp(/^data:image\/.*;base64/, "i")
    },
    atomLinks: {
      package: new RegExp(/^https:\/\/atom\.io\/packages\/(.*)$/),
      flightManual: new RegExp(/^https:\/\/flight-manual\.atom\.io\//)
    }
  },
};

/**
 * @function renderMarkdown
 * @memberof markdown
 * @alias render
 * @desc Takes a Markdown document and renders it as HTML.
 * @param {string} content - The Markdown source material.
 * @param {object} givenOpts - The optional arguments:
 * @param {string} givenOpts.renderMode - Determines how the page is rendered.
 * Valid values "full" or "fragment".
 * @param {boolean} givenOpts.html - Whether HTML tags should be allowed.
 * @param {boolean} givenOpts.sanitize - If the page content should be saniized via DOMPurify.
 * @param {boolean} givenOpts.sanitizeAllowUnknownProtocols - Controls DOMPurify's
 * own option of 'ALLOW_UNKNOWN_PROTOCOLS'.
 * @param {boolean} givenOpts.sanitizeAllowSelfClose - Controls DOMPurify's
 * own option of 'ALLOW_SELF_CLOSE'
 * @param {boolean} givenOpts.breaks - If newlines should always be converted
 * into breaklines.
 * @param {boolean} givenOpts.handleFrontMatter - Whether frontmatter data should
 * processed and displayed.
 * @param {boolean} givenOpts.useDefaultEmoji - Whether `markdown-it-emoji` should be enabled.
 * @param {boolean} givenOpts.useGitHubHeadings - Whether `markdown-it-github-headings`
 * should be enabled. False by default.
 * @param {boolean} givenOpts.useTaskCheckbox - Whether `markdown-it-task-checkbox`
 * should be enabled. True by default.
 * @param {boolean} givenOpts.taskCheckboxDisabled - Controls `markdown-it-task-checkbox`
 * `disabled` option. True by default.
 * @param {boolean} givenOpts.taskCheckboxDivWrap - Controls `markdown-it-task-checkboc`
 * `divWrap` option. False by default.
 * @param {boolean} givenOpts.transformImageLinks - Attempt to resolve image URLs.
 * True by default.
 * @param {boolean} givenOpts.transformAtomLinks - Attempt to resolve links
 * pointing to Atom. True by Default.
 * @param {boolean} givenOpts.transformNonFqdnLinks - Attempt to resolve links
 * that are not fully qualified domain names. True by Default.
 * @param {string} givenOpts.rootDomain - The root URL of the online resource.
 * Useful when attempting to resolve any links on the page. Only works for online
 * resources.
 * @param {string} givenOpts.filePath - The local alternative to `rootDomain`.
 * Used to resolve incomplete paths, but locally on the file system.
 * @param {string} givenOpts.disabledMode - The level of disabling of markdown features.
 * `none` by default. But supports: "none", "strict"
 * @returns {string} Parsed HTML content.
 */
function renderMarkdown(content, givenOpts = {}) {
  // First we will setup our markdown renderer instance according to the opts provided
  const defaultOpts = {
    renderMode: "full", // Determines if we are rendering a fragment or full page.
    // Valid values: 'full', 'fragment'
    html: true, // Enable HTML tags in source
    sanitize: true, // Enable or disable sanitization
    sanitizeAllowUnknownProtocols: true,
    sanitizeAllowSelfClose: true,
    breaks: false, // Convert `\n` in paragraphs into `<br>`
    handleFrontMatter: true, // Determines if Front Matter content should be parsed
    useDefaultEmoji: true, // Use `markdown-it-emoji`
    useGitHubHeadings: false, // Use `markdown-it-github-headings`
    useTaskCheckbox: true, // Use `markdown-it-task-checkbox`
    taskCheckboxDisabled: true, // `markdown-it-task-checkbox`: Disable checkbox interactivity
    taskCheckboxDivWrap: false, // `markdown-it-task-checkbox`: Wrap div arround checkboc
    transformImageLinks: true, // Attempt to resolve image urls
    transformAtomLinks: true, // Attempt to rewrite links to Atom pages, changing them to Pulsar
    transformNonFqdnLinks: true, // Attempt to resolve non-FQDN links
    rootDomain: "", // The root URL that should be used for the above 'transform' options
    filePath: "", // The path to the file where this markdown is generated from,
    disableMode: "none", // The level of disabling that should be done on the output.
    // Provides helpful defaults to control how much or how little is disabled:
    // - none: Nothing is disabled
    // - strict: Everything possible is disabled, except what is otherwise needed
  };

  let opts = { ...defaultOpts, ...givenOpts };

  const validateRootDomain = () => {
    return typeof opts.rootDomain === "string" && opts.rootDomain.length > 1;
  };

  const cleanRootDomain = () => {
    // We will also remove any trailing `/` as link resolvers down the line add them in
    return opts.rootDomain.replace(".git", "").replace(/\/$/, "");
  };

  const markdownItOpts = {
    html: opts.html,
    breaks: opts.breaks
  };

  let md = new MarkdownIt(markdownItOpts);

  if (opts.useDefaultEmoji) {
    mdComponents.deps.markdownItEmoji ??= require("markdown-it-emoji");
    md.use(mdComponents.deps.markdownItEmoji, {});
  }
  if (opts.useGitHubHeadings) {
    mdComponents.deps.markdownItGitHubHeadings ??= require("markdown-it-github-headings");
    md.use(mdComponents.deps.markdownItGitHubHeadings, {});
  }
  if (opts.useTaskCheckbox) {
    mdComponents.deps.markdownItTaskCheckbox ??= require("markdown-it-task-checkbox");
    md.use(mdComponents.deps.markdownItTaskCheckbox, {
      disabled: opts.taskCheckboxDisabled,
      divWrap: opts.taskCheckboxDivWrap
    });
  }
  if (opts.transformImageLinks && validateRootDomain()) {
    // Here we will take any links for images provided in the content, and do
    // our best to ensure they can accurately resolve.
    const defaultImageRenderer = md.renderer.rules.image; // We want to keep access to this

    // Determines when we handle links if the item could be a local file or not
    let couldBeLocalItem;
    if (typeof opts.filePath != "string" || opts.filePath.length < 1) {
      couldBeLocalItem = false;
    } else {
      couldBeLocalItem = true;
    }

    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      let token = tokens[idx];
      let aIndex = token.attrIndex("src");

      // Lets say content contains './my-cool-image.png'
      // We need to turn it into something like this:
      // https://github.com/USER/REPO/raw/HEAD/my-cool-image.png
      if (mdComponents.reg.localLinks.currentDir.test(token.attrGet("src"))) {
        let rawLink = token.attrGet("src");
        rawLink = rawLink.replace(mdComponents.reg.localLinks.currentDir, "");
        // Now we need to handle links for both the web and locally
        // We can do this by first checking if the link resolves locally
        if (couldBeLocalItem) {
          let newSrc = path.resolve(path.dirname(opts.filePath, rawLink));
          if (!fs.lstatSync(newSrc).isFile()) {
            token.attrSet("src", newSrc);
          } else {
            token.attrSet("src", `${cleanRootDomain()}/raw/HEAD/${rawLink}`);
          }
        } else {
          token.attrSet("src", `${cleanRootDomain()}/raw/HEAD/${rawLink}`);
        }
      } else if (mdComponents.reg.localLinks.rootDir.test(token.attrGet("src"))) {
        let rawLink = token.attrGet("src");
        rawLink = rawLink.replace(mdComponents.reg.localLinks.rootDir, "");
        // Now to handle the possible web or local link
        if (couldBeLocalItem) {
          const [rootDirectory] = atom.project.relativePath(opts.filePath);
          if (!fs.lstatSync(src).isFile() && rootDirectory) {
            let newSrc = path.join(rootDirectory, rawLink);
            token.attrSet("src", newSrc);
          } else {
            token.attrSet("src", `${cleanRootDomain()}/raw/HEAD/${rawLink}`);
          }
        } else {
          token.attrSet("src", `${cleanRootDomain()}/raw/HEAD/${rawLink}`);
        }
      } else if (!token.attrGet("src").startsWith("http") && !mdComponents.reg.globalLinks.base64.test(token.attrGet("src"))) {
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
  if (validateRootDomain() && opts.transformNonFqdnLinks) {
    md.core.ruler.after("inline", "fix-links", (state) => {
      state.tokens.forEach((blockToken) => {
        if (blockToken.type === "inline" && blockToken.children) {
          blockToken.children.forEach((token) => {
            if (token.type === "link_open") {
              token.attrs.forEach((attr) => {
                if (attr[0] === "href") {
                  let link = attr[1];

                  if (opts.transformNonFqdnLinks && mdComponents.reg.localLinks.currentDir.test(link)) {
                    attr[1] = `${cleanRootDomain()}/blob/HEAD/${link.replace(mdComponents.reg.localLinks.currentDir, "")}`;
                  } else if (opts.transformNonFqdnLinks && mdComponents.reg.localLinks.rootDir.test(link)) {
                    attr[1] = `${cleanRootDomain()}/blob/HEAD/${link.replace(mdComponents.reg.localLinks.rootDir, "")}`;
                  } else if (opts.transformNonFqdnLinks && !link.startsWith("http")) {
                    attr[1] = `${cleanRootDomain()}/blob/HEAD/${link.replace(".git", "")}`;
                  }
                }
              });
            }
          });
        }
      });
    });
  } else if (opts.transformAtomLinks) {
    // This is a separate if since transforming Atom links does not need a valid root domain provided
    md.core.ruler.after("inline", "fix-atom-links", (state) => {
      state.tokens.forEach((blockToken) => {
        if (blockToken.type === "inline" && blockToken.children) {
          blockToken.children.forEach((token) => {
            if (token.type === "link_open") {
              token.attrs.forEach((attr) => {
                if (attr[0] === "href") {
                  let link = attr[1];

                  if (mdComponents.reg.atomLinks.package.test(link)) {
                    // Fix any links that attempt to point to packages on `https://atom.io/packages/...`
                    attr[1] = `https://web.pulsar-edit.dev/packages/${link.match(mdComponents.reg.atomLinks.package)[1]}`;
                  } else if (mdComponents.reg.atomLinks.flightManual.test(link)) {
                    // Resolve any links to the flight manual to web archive
                    attr[1] = link.replace(mdComponents.reg.atomLinks.flightManual, "https://web.archive.org/web/20221215003438/https://flight-manual.atom.io/");
                  }
                }
              });
            }
          });
        }
      });
    });
  }

  // Here we can add some simple additions that make code highlighting possible later on,
  // but doesn't actually preform any code highlighting.
  md.options.highlight = function(str, lang) {
    return `<pre><code class="language-${lang}">${str}</code></pre>`;
  };

  // Process disables
  if (opts.disableMode === "strict") {

    // Easy Disable
    md.disable("lheading");

    // Disable Code Blocks
    md.renderer.rules.code_block = (tokens, idx, _options, _env, _self) => {
      if (tokens[idx].type === "code_block") {
        return "";
      }
    };

    // Disable Code Fences
    md.renderer.rules.fence = (tokens, idx, _options, _env, _self) => {
      if (tokens[idx].type === "fence") {
        return "";
      }
    };

    // Disable Images
    md.renderer.rules.image = (tokens, idx, _options, _env, _self) => {
      // Double check this is an image
      if (tokens[idx].type === "image") {
        return "";
      }
    };

    // Only support line breaks in HTML that's inline
    md.inline.ruler.before("html_inline", "only_allow_line_breaks", (state) => {
      // Determine how to best handle this to only allow line breaks. Research needed
      if (state.src.charAt(state.pos) === "<") {
        // We only want to act once on the beginning of the inline element
        // Then confirm if it's the item we expect
        const textAfterPending = state.src.replace(state.pending, "");
        const match = textAfterPending.match(/^<br\s*\/?>/);
        if (match) {
          // We define breakline as a custom Token Type
          let token = state.push("html_inline", "breakline", 0);
          token.content = "<br/>";
          state.pos += "<br/>".length;
          return true;
        }
      }
    });

    // Disable Heading
    md.block.ruler.before("heading", "strip_heading", (state, startLine, endLine) => {
      let pos = state.bMarks[startLine] + state.tShift[startLine];

      if (state.src.charAt(pos) === "#") {
        let max = state.eMarks[startLine];

        const isSpace = () => {
          let code = state.src.charCodeAt(pos);
          switch(code) {
            case 0x09:
            case 0x20:
              return true;
          }
          return false;
        };

        let level = 1;

        let ch = state.src.charAt(++pos);
        while (ch === "#" && pos < max && level <= 6) {
          level++;
          ch = state.src.charAt(++pos);
        }

        if (level > 6 || (pos < max && !isSpace())) { return false; }
        // Now that we are confident we are within a heading, lets strip it
        state.pos += level;
        state.line = startLine + 1;
        return true;
      }
    });

    const stripAllTokensTill = (tokens, initIdx, endType) => {
      // This function will loop a given set of tokens, stripping them of all data
      // (converting them to empty text tokens)
      // until the specified token is reached. Which it will also strip to text,
      // then return
      let idx = initIdx;
      while(idx < tokens.length) {
        tokens[idx].type = "text";
        tokens[idx].content = "";

        if (tokens[idx].type == endType) {
          break;
        }

        idx++;
      }
      return;
    };

    // Disable blockquotes
    md.renderer.rules.blockquote_open = (tokens, idx, _options, _env, _self) => {
      stripAllTokensTill(tokens, idx, "blockquote_close");
      return "";
    };

    // Disable Bullet lists
    md.renderer.rules.bullet_list_open = (tokens, idx, _options, _env, _self) => {
      stripAllTokensTill(tokens, idx, "bullet_list_close");
      return "";
    };

    // Disable Ordered lists
    md.renderer.rules.ordered_list_open = (tokens, idx, _options, _env, _self) => {
      stripAllTokensTill(tokens, idx, "ordered_list_close");
      return "";
    };

    // Ensure that only breaklines are supported as inline raw HTML
    md.renderer.rules.html_inline = (tokens, idx, _options, _env, _self) => {
      if (tokens[idx].type === "html_inline") {
        // Here we can build an allow list of inline HTML elements to keep.
        if (
          tokens[idx].tag !== "breakline"
          ) {
            return "";
          } else {
            return tokens[idx].content;
          }
      }
    };

    // Ensure nothing is supported as block HTML
    md.renderer.rules.html_block = (tokens, idx, _options, _env, _self) => {
      if (tokens[idx].type === "html_block") {
        return "";
      }
    };

  }

  let textContent;

  if (opts.handleFrontMatter) {
    mdComponents.deps.yamlFrontMatter ??= require("yaml-front-matter");
    const { __content, vars } = mdComponents.deps.yamlFrontMatter.loadFront(content);

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

  let rendered = md.render(textContent);

  if (opts.sanitize) {
    mdComponents.deps.domPurify ??= require("dompurify");

    let domPurifyOpts = {
      ALLOW_UNKNOWN_PROTOCOLS: opts.sanitizeAllowUnknownProtocols,
      ALLOW_SELF_CLOSE_IN_ATTR: opts.sanitizeAllowSelfClose
    };

    rendered = mdComponents.deps.domPurify.sanitize(rendered, opts);
  }

  return rendered;
}

/**
 * @function applySyntaxHighlighting
 * @memberof markdown
 * @async
 * @desc Uses Pulsar's built-in Syntax Highlighting system to apply the same syntax
 * highlighting to code blocks within markdown. Modifies the existing object passed.
 * @param {HTMLFragment} content - The HTML Node/Fragment to apply syntax highlighting on.
 * Will modifyn the original object.
 * @param {object} givenOpts - Optional Arguments:
 * @param {function} givenOpts.syntaxScopeNameFunc - A function that can be called with
 * any given language ID from a code block scope, and returns the grammar source id
 * that should be used to preform syntax highlighting.
 * @param {string} givenOpts.renderMode - Whether we are rdnering a document fragment
 * or a full document. Valid values: "full", "fragment".
 * @param {object} givenOpts.grammar - The grammar of the source file. Carryover from
 * original `markdown-preview` functionality.
 */
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

  let editorCallback;

  if (opts.renderMode === "fragment") {
    editorCallback = makeAtomEditorNonInteractive;
  } else {
    // Captures full and defaults
    editorCallback = convertAtomEditorToStandardElement;
  }

  const promises = [];
  for (const preElement of content.querySelectorAll("pre")) {
    const codeBlock = preElement.firstElementChild ?? preElement;
    const className = codeBlock.getAttribute("class");
    const fenceName =
      className != null ? className.replace(/^language-/, "") : defaultLanguage;

    const editor = new TextEditor({
      readonly: true,
      keyboardInputEnabled: false
    });
    const editorElement = editor.getElement();

    preElement.classList.add("editor-colors", `lang-${fenceName}`);
    editorElement.setUpdatedSynchronously(true);
    preElement.innerHTML = "";
    preElement.parentNode.insertBefore(editorElement, preElement);
    editor.setText(codeBlock.textContent.replace(/\r?\n$/, ""));
    atom.grammars.assignLanguageMode(editor, scopeForFenceName(fenceName));
    editor.setVisible(true);

    promises.push(editorCallback(editorElement, preElement));
  }
  return Promise.all(promises);
}

/**
 * @function convertToDOM
 * @memberof markdown
 * @desc Takes a raw HTML string of data and returns a proper HTMLFragment.
 * This should be done if you need access to APIs available on the DOM itself.
 * @param {string} content - The HTML String.
 * @returns {HTMLFragment}
 */
function convertToDOM(content) {
  const template = document.createElement("template");
  template.innerHTML = content;
  const fragment = template.content.cloneNode(true);
  return fragment;
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
    return this.match(candidate, query)?.score || 0;
  },

  match(candidate, query, opts = {}) {
    const matcher = setCandidates([candidate]);
    return matcher.match(query, opts)[0];
  }
}

function makeAtomEditorNonInteractive(editorElement, preElement) {
  preElement.remove();
  editorElement.setAttributeNode(document.createAttribute("gutter-hidden")); // Hide gutter
  editorElement.removeAttribute("tabindex"); // Make read-only

  // Remove line decorations from code blocks.
  for (const cursorLineDecoration of editorElement.getModel().cursorLineDecorations) {
    cursorLineDecoration.destroy();
  }
}

function convertAtomEditorToStandardElement(editorElement, preElement) {
  return new Promise(function (resolve) {
    const editor = editorElement.getModel();
    const done = () =>
      editor.component.getNextUpdatePromise().then(function () {
        for (const line of editorElement.querySelectorAll(
          ".line:not(.dummy)"
        )) {
          const line2 = document.createElement("div");
          line2.className = "line";
          line2.innerHTML = line.firstChild.innerHTML;
          preElement.appendChild(line2);
        }
        editorElement.remove();
        resolve();
      })
    const languageMode = editor.getBuffer().getLanguageMode();
    if (languageMode.fullyTokenized || languageMode.tree) {
      done();
    } else {
      editor.onDidTokenize(done);
    }
  });
}

// Markdown Exported Object
/**
 * @member markdown
 * @memberof ui
 * @desc The Markdown object exported from the UI API.
 * Provides access to: ".render", ".applySyntaxHighlighting", ".convertToDOM"
 */
const markdown = {
  render: renderMarkdown,
  applySyntaxHighlighting: applySyntaxHighlighting,
  convertToDOM: convertToDOM
};

module.exports = {
  markdown,
  fuzzyMatcher
};
