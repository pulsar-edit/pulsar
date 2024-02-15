const path = require("path");
const fs = require("fs");
const MarkdownIt = require("markdown-it");
const { TextEditor } = require("atom");
const fuzzyNative = require("@pulsar-edit/fuzzy-native");

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
 * @function render
 * @memberof markdown
 * @desc Processes the actual rendering of markdown content.
 * @param {string} content - The string of Markdown.
 * @param {object} givenOpts - The optional arguments
 * @param {boolean} givenOpts.frontMatter - Whether frontmatter data should be
 * processed and displayed.
 * @param {boolean} givenOpts.sanitize - Whether sanitization should be applied.
 * @param {boolean} givenOpts.sanitizeAllowUnknownProtocols - Whether DOMPurify's
 * `ALLOW_UNKNOWN_PROTOCOLS` should be enabled.
 * @param {boolean} givenOpts.sanitizeAllowSelfClose - Whether DOMPurify's
 * `ALLOW_SELF_CLOSE_IN_ATTR` should be enabled.
 * @param {string} givenOpts.renderMode - Determines how the page is returned.
 * `full` or `fragment` applies only when Syntax Highlighting.
 * @param {string|object} givenOpts.defaultGrammar - An instance of a Pulsar Grammar
 * or string, which will be used as the default grammar to apply to code blocks.
 * @param {boolean|function} givenOpts.highlight - Determines if Syntax Highlighting
 * is applied. Can be a boolean, with true applying syntax highlighting. Or it can
 * be a function, which will be used to resolve fenced code block scope names to
 * a Pulsar language grammar.
 * @param {object} mdInstance - An optional instance of MarkdownIT. Retreived from
 * `atom.ui.markdown.buildRenderer()`.
 */
function render(content, givenOpts = {}, mdInstance) {
  // Define our default opts to create a full options object
  const defaultOpts = {
    frontMatter: true, // Determines if Front Matter content should be parsed
    sanitize: true, // Enable or disable sanitization of Markdown output
    sanitizeAllowUnknownProtocols: true, // pass the value of `ALLOW_UNKNOWN_PROTOCOLS` to DomPurify
    sanitizeAllowSelfClose: true, // pass the value of `ALLOW_SELF_CLOSE_IN_ATTR` to DomPurify
    highlight: false, // This enables syntax highlighting. Can be true or a function
    // to resolve scope names
    defaultGrammar: null, // Allows passing a Pulsar Grammar to default to that
    // language if applicable, or otherwise allows passing a new default language,
    // if excluded, default becomes 'text'. This is an unresolved scope fence
    renderMode: "full", // Determines what type of content is returned during
    // syntax highlighting, can be `full` or `fragment`. `fragment` is recommended
    // for most applications.
  };

  let opts = { ...defaultOpts, ...givenOpts };

  // Some options have changed since the initial implmentation of the `atom.ui.markdown`
  // feature. We will pass along the values of no longer used config options, to
  // ensure backwards compatibility.
  opts.frontMatter = givenOpts.handleFrontMatter ?? givenOpts.frontMatter ?? defaultOpts.frontMatter;
  opts.highlight = givenOpts.syntaxScopeNameFunc ?? givenOpts.highlight ?? defaultOpts.highlight;
  opts.defaultGrammar = givenOpts.grammar ?? givenOpts.defaultGrammar ?? defaultOpts.defaultGrammar;
  // End of backwards compaitbility options
  // Maybe we should emit a warning or deprecation when one is used?

  let md;

  if (mdInstance) {
    // We have been provided a markdown instance from `buildRenderer()` so we
    // can use that
    md = mdInstance;
  } else {
    // No instance was provided, lets make our own
    // We will pass all values that we were given onto the `buildRenderer` func
    md = buildRenderer(givenOpts);
  }

  let textContent;

  if (opts.frontMatter) {
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

  // Now time to render the content
  let rendered = md.render(textContent);

  if (opts.sanitize) {
    mdComponents.deps.domPurify ??= require("dompurify");

    let domPurifyOpts = {
      ALLOW_UNKNOWN_PROTOCOLS: opts.sanitizeAllowUnknownProtocols,
      ALLOW_SELF_CLOSE_IN_ATTR: opts.sanitizeAllowSelfClose
    };

    rendered = mdComponents.deps.domPurify.sanitize(rendered, domPurifyOpts);
  }

  // We now could return this text as ready to go, but lets check if we can
  // apply any syntax highlighting
  if (opts.highlight) {
    // Checking above for truthy should match for if it's a function or true boolean
    const convertToDOM = (data) => {
      const template = document.createElement("template");
      template.innerHTML = data;
      const fragment = template.content.cloneNode(true);
      return fragment;
    };

    const domHTMLFragment = convertToDOM(rendered);

    // Now it's time to apply the actual syntax highlighting to our html fragment
    const scopeForFenceName = (fence) => {
      if (typeof opts.highlight === "function") {
        return opts.highlight(fence);
      } else {
        // TODO mimick the system we built into `markdown-preview` for this
        // We could build one in, or just return default
        return "text.plain";
      }
    };

    let defaultLanguage;
    const fontFamily = atom.config.get("editor.fontFamily");

    if (opts.defaultGrammar?.scopeName === "source.litcoffee") {
      // This is so that we can support defaulting to coffeescript if writing in
      // 'source.litcoffee' and rendering our markdown
      defaultLanguage = "coffee";
    } else if (typeof opts.defaultGrammar === "string") {
      defaultLanguage = opts.defaultGrammar;
    } else {
      defaultLanguage = "text";
    }

    if (fontFamily) {
      for (const codeElement of domHTMLFragment.querySelectorAll("code")) {
        codeElement.style.fontFamily = fontFamily;
      }
    }

    let editorCallback;

    if (opts.renderMode === "fragment") {
      editorCallback = makeAtomEditorNonInteractive;
    } else {
      editorCallback = convertAtomEditorToStandardElement;
    }

    const promises = [];
    for (const preElement of domHTMLFragment.querySelectorAll("pre")) {
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

    // Since we don't want to force this function to always be async, as it's only
    // needed to be async for this syntax highlighting call, we will instead return
    // an async function that can awaited on
    return async () => {
      await Promise.all(promises);
      return domHTMLFragment;
    };
  } else {
    // We aren't preforming any syntax highlighting, so lets return our rendered
    // text.
    return rendered;
  }
}

/**
 * @function buildRenderer
 * @memberof markdown
 * @desc Returns a Markdown Renderer instance with the provided options.
 * Helpful to avoid having to build a new one over and over.
 * @param {object} givenOpts - The optional arguments
 * @param {boolean} givenOpts.html - Whether HTML tags should be allowed.
 * @param {boolean} givenOpts.breaks - If newlines should always be converted
 * into breaklines.
 * @param {boolean} givenOpts.emoji - If emojis should be included.
 * @param {boolean} givenOpts.githubHeadings - Whether `markdown-it-github-headings`
 * should be enabled.
 * @param {boolean} givenOpts.taskCheckbox - Whether `markdown-it-task-checkbox`
 * should be enabled.
 * @param {boolean} givenOpts.taskCheckboxDisabled - Controls `markdown-it-task-checkbox`
 * `disabled` option.
 * @param {boolean} givenOpts.taskCheckboxDivWrap - Controls `markdown-it-task-checkbox`
 * `divWrap` option.
 * @param {boolean} givenOpts.transformImageLinks - If links to images should
 * attempted to be resolved.
 * @param {boolean} givenOpts.transformNonFqdnLinks - If non fully qualified
 * domain name links should be resolved.
 * @param {boolean} givenOpts.transformAtomLinks - If links to Atom pages should
 * resolved to the Pulsar equivolant.
 * @param {string} givenOpts.rootDomain - The root URL of the online resource.
 * Used when resolving links.
 * @param {string} givenOpts.filePath - The path to the local resource.
 * Used when resolving links.
 * @param {string} givenOpts.disableMode - The level of disabling to apply.
 * @return {object} An instance of a MarkdownIT.
 */
function buildRenderer(givenOpts = {}) {
  // Define our default opts to create a full options object
  const defaultOpts = {
    html: true, // Enable HTML tags in source
    breaks: true, // Convert `\n` in paragraphs into `<br>`
    emoji: false, // enable or disable emojis
    githubHeadings: false, // Use `markdown-it-github-headings`
    taskCheckbox: true, // Use `markdown-it-task-checkbox`
    taskCheckboxDisabled: true, // For `taskCheckbox`: Disable checkbox interactivity
    taskCheckboxDivWrap: false, // For `taskCheckbox`: Wrap div arround checkbox
    transformImageLinks: false, // Attempt to resolve image urls
    rootDomain: "", // the root URL that should be used for attempted translations
    filePath: "", // the local path to use during translations
    transformNonFqdnLinks: false, // Attempt to resolve non-FQDN links
    transformAtomLinks: true, // Attempt to rewrite links to Atom pages to the Pulsar equivolant
    disableMode: "none", // The level of disabling that should be set.
    // - none: Nothing is disabled, the default
    // - strict: Most everything is disabled.
  };

  let opts = { ...defaultOpts, ...givenOpts };

  // Some options have changed since the initial implmentation of the `atom.ui.markdown`
  // feature. We will pass along the values of no longer used config options, to
  // ensure backwards compatibility.
  opts.emoji = givenOpts.useDefaultEmoji ?? givenOpts.emoji ?? defaultOpts.emoji;
  opts.githubHeadings = givenOpts.useGitHubHeadings ?? givenOpts.githubHeadings ?? defaultOpts.githubHeadings;
  opts.taskCheckbox = givenOpts.useTaskCheckbox ?? givenOpts.taskCheckbox ?? defaultOpts.taskCheckbox;
  // End of backwards compaitbility options
  // Maybe we should emit a warning or deprecation when one is used?

  // Setup
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

  const md = new MarkdownIt(markdownItOpts);

  // Hook up emojis
  if (opts.emoji) {
    mdComponents.deps.markdownItEmoji ??= require("markdown-it-emoji");
    md.use(mdComponents.deps.markdownItEmoji, {});
  }
  if (opts.githubHeadings) {
    mdComponents.deps.markdownItGitHubHeadings ??= require("markdown-it-github-headings");
    md.use(mdComponents.deps.markdownItGitHubHeadings, {});
  }
  if (opts.taskCheckbox) {
    mdComponents.deps.markdownItTaskCheckbox ??= require("markdown-it-task-checkbox");
    md.use(mdComponents.deps.markdownItTaskCheckbox, {
      disabled: opts.taskCheckboxDisabled,
      divWrap: opts.taskCheckboxDivWrap
    });
  }

  // Hook up custom rules
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
  }

  if (opts.transformAtomLinks) {
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

  // Here we add a simple addition that makes code highlighting possible later on
  // but itself doesn't do much to highlight
  md.options.highlight = function(str, lang) {
    return `<pre><code class="language-${lang}">${str}</code></pre>`;
  };

  // Process disables
  if (opts.disableMode === "strict") {

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
        // then confirm if it's the item we expect
        const textAfterPending = state.src.replace(state.pending, "");
        const match = textAfterPending.match(/^<br\s*\/?>/);
        if (match) {
          // We define breakline as a custom Token Type
          let token = state.push("html_inline", "breakline", 0);
          token.content = "<br>";
          state.pos += match[0].length;
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

        if (tokens[idx].type === endType) {
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
    md.renderer.rules.ordered_list_open = (tokens, idx, _options, _env, _self) =>  {
      stripAllTokensTill(tokens, idx, "ordered_list_close");
      return "";
    };

    // Ensure that only breaklines are supported as inline raw HTML
    md.renderer.rules.html_inline = (tokens, idx, _options, _env, _self) => {
      if (tokens[idx].type === "html_inline") {
        // Here we can build an allow list of inline HTML elements to keep.
        if (tokens[idx].tag !== "breakline") {
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

  // Done processing restrictions

  // Return the fully complete markdown instance
  return md;
}

/*
  # Name: setCandidates
  # Type: ClassMethod

  Sets the candidates for a new matcher, or sets the candidates for an existing
  matcher. Returns a {Matcher} that can be used to query for candidates.

  * `matcherOrCandidates` - either a {Matcher} returned from a previous call
    from `setCandidates`, or an array of string candidates to be filtered
  * `candidates` - an array of string candidates to be filtered

  ## Examples
  ```js
  const matcher = atom.ui.fuzzyMatcher.setCandidates(["hello", "world"])
  matcher.match('he') // => will return [{value: "hello", score: <number>}]
  atom.ui.fuzzyMatcher.setCandidates(matcher, ["hello", "hope"])
  matcher.match('he') // => will now return "hope" too, but it'll be at
                     // second position with a lower score
  ```
*/
function setCandidates(matcherOrCandidates, candidates) {
  if(candidates) {
    matcherOrCandidates.fuzzyMatcher.setCandidates(
      [...Array(candidates.length).keys()],
      candidates
    );
    return matcherOrCandidates;
  } else {
    return new Matcher(
      new fuzzyNative.Matcher(
        [...Array(matcherOrCandidates.length).keys()],
        matcherOrCandidates
      )
    );
  }
}

/*
  # Name: Matcher
  # Type: Class

  The result from a call to {fuzzyMatcher.setCandidates}.
*/
class Matcher {
  constructor(fuzzyMatcher) {
    // Some heuristics to get the default number of CPUs to make the filter
    this.numCpus = Math.max(1, Math.round(4 * 0.8))
    this.fuzzyMatcher = fuzzyMatcher
  }

  /*
    # Name: match
    # Type: InstanceMethod

    Matches the current candidates to a query. Query must be a string

    * `query` A string query to filter the pre-defined candidates
    * `options` Key/map to customize the details of the search. All keys are
      optional, meaning they all have defaults
      * `algorithm` Either "fuzzaldrin" or "command-t". Defaults to "fuzzaldrin"
        (the **opposite** of @pulsar-edit/fuzzy-native)
      * `maxResults` The number of results to be returned. Defaults to Infinite,
        meaning that it'll return _all results_ that did match. Please notice
        that this have no difference in actual filtering speed
      * `recordMatchIndexes` If `true`, returns also `matchIndexes`, an array
        of numbers where each number is the index (0-based) of the character
        that was matched. Defaults to `false`
      * `numThreads` The number of threads to filter. Defaults to 80% of the
        current CPUs
      * `maxGap` (only "command-t") The number of maximum "character gap" between
        consecutive letters. A smaller gap means a faster result. Defaults to
        Infinite

    Returns: an object containing:

    * `id` The index of the candidate
    * `value` The original (string) value of the filtered candidate
    * `score` A number in the range 0 to 1. Higher scores are more relevant.
      0 denotes "no match" and will never be returned.
    * `matchIndexes` (optional) Will be returned only if `recordMatchIndexes`
      is set to true. It's an array of integer for each character index in
      `value` for each character in `query`. This can be expensive to calculate.
  */
  match(query, options = {}) {
    let {numThreads, algorithm} = options;
    numThreads ||= this.numCpus;
    algorithm ||= 'fuzzaldrin';
    return this.fuzzyMatcher.match(query, {...options, numThreads, algorithm});
  }

  /*
    # Name: setCandidates
    # Type: InstanceMethod

    Exactly the same as {setCandidates}, passing this {Matcher} as the first parameter
  */
  setCandidates(candidates) {
    return setCandidates(this, candidates);
  }
}

/*
  Essential: The {fuzzyMatcher} API, the same used in the autocomplete,
  fuzzy-finder core package, command pallete, etc.
  An instance of this API is available via the `atom.ui.fuzzyMatcher` global.

  This API have two parts - the filtering of an array of candidates, and the
  scoring. Scoring is done via the {fuzzyMatcher.score}, and filtering is
  done by returning a new {Matcher} using the {fuzzyMatcher.setCandidates}
  method, then calling {Matcher#match}. You can _also use_ the
  {fuzzyMatcher.match} to match a single candidate - it uses the same API and
  options as {Matcher#match}.
*/
const fuzzyMatcher = {
  setCandidates: setCandidates,

  // Same as {setCandidates} passing a single candidate, and returning only
  // the score. It can return `0` if there's no match.
  score(candidate, query, opts = {}) {
    return this.match(candidate, query)?.score || 0;
  },

  // The same as {setCandidates} with a single candidate. Returns just the
  // match, if there's one (can return `undefined`).
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
 * Provides access to: ".render", ".buildRenderer"
 */
const markdown = {
  render: render,
  buildRenderer: buildRenderer
};

module.exports = {
  markdown,
  fuzzyMatcher
};
