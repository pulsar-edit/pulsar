const { CompositeDisposable } = require("atom");
const path = require("path");
const PackageListView = require("./package-list-view.js");

class GrammarFinder {
  activate() {

    atom.grammars.emitter.on("did-auto-assign-grammar", async (data) => {
      if (!atom.config.get("grammar-finder.autoFind")) {
        // autofind is turned off
        return;
      }

      let extOrFalse = this.inspectAssignment(data);
      if (!extOrFalse) {
        // We got false from inspectAssignment() we don't need to act
        return;
      }

      const ext = extOrFalse.replace(".", "");

      const ignoreExtList = atom.config.get("grammar-finder.ignoreExtList");

      if (ignoreExtList.includes(ext)) {
        // we have been told to ignore this ext
        return;
      }

      const packages = await this.checkForGrammars(ext);

      if (packages.length === 0) {
        // No packages were found that support this grammar
        return;
      }

      // Lets notify the user about the found packages
      this.notify(packages, extOrFalse, "Pulsar couldn't identify an installed grammar for this file.");
    });

    this.disposables = new CompositeDisposable();

    this.disposables.add(
      atom.commands.add("atom-workspace", {
        "grammar-finder:find-grammars-for-file": async () => {
          // Here we can let users find a grammar for the current file, even if
          // it's already correctly identified
          const grammar = atom.workspace.getActiveTextEditor().getGrammar();
          const buffer = atom.workspace.getActiveTextEditor().buffer;

          let extOrFalse = this.inspectAssignment(
            {
              grammar: grammar,
              buffer: buffer
            },
            {
              ignoreScope: true
            }
          );

          if (!extOrFalse) {
            // We didn't find any grammar, since this is manually invoked we may want to alert
            atom.notifications.addInfo("Grammar-Finder was unable to identify the file.", { dismissable: true });
            return;
          }

          let ext = extOrFalse.replace(".", "");

          const ignoreExtList = atom.config.get("grammar-finder.ignoreExtList");

          if (ignoreExtList.includes(ext)) {
            // we have been told to ignore this ext, since manually invoked we may want to alert
            atom.notifications.addInfo("This file is present on Grammar-Finder's ignore list.", { dismissable: true });
            return;
          }

          const packages = await this.checkForGrammars(ext);

          if (packages.length === 0) {
            // No packages were found that support this grammar
            // since manuall invoked we may want to notify
            atom.notifications.addInfo(`Unable to locate any Grammars for '${ext}'.`, { dismissable: true });
            return;
          }

          // Lets notify the user about the found packages
          this.notify(packages, ext, `'${packages.length}' Installable Grammars are available for '${ext}'.`);
        }
      })
    );
  }

  deactivate() {
    this.superagent = null;
  }

  inspectAssignment(data, opts = {}) {
    console.log(`grammar-finder.inspectAssignment(${data.grammar.scopeName}, ${data.buffer.getPath()})`);
    // data = { grammar, buffer }
    // Lets first make sure that the grammar returned is one where no
    // grammar could be found for the file.

    if (data.grammar.scopeName === "text.plain.null-grammar" || opts.ignoreScope) {
      const filePath = data.buffer.getPath();

      if (typeof filePath !== "string") {
        return false;
      }

      const parsed = path.parse(filePath);
      // NodeJS thinks that if the `.` is the first character of a filename
      // then it doesn't count as an extension. But according to our handling
      // in Pulsar, the same isn't true.
      let ext = false;

      if (typeof parsed.ext === "string" && parsed.ext.length > 0) {
        ext = parsed.ext;
      } else if (typeof parsed.name === "string" && parsed.name.length > 0) {
        ext = parsed.name;
      }

      console.log(`File: ${filePath} - Ext: ${ext}`);

      return ext;
    } else {
      return false;
    }
  }

  async checkForGrammars(ext) {
    this.superagent ??= require("superagent");

    const res = await this.superagent
      .get("https://api.pulsar-edit.dev/api/packages")
      .set("User-Agent", "Pulsar.Grammar-Finder")
      .query({ fileExtension: ext });

    if (res.status !== 200) {
      // Return empty array
      console.error(`Grammar-Finder received status '${res.status}' from the backend: ${res.body}`);
      return [];
    }

    return res.body;
  }

  notify(packages, ext, title) {
    atom.notifications.addInfo(
      title,
      {
        description: "Would you like to see installable packages that **may** support this file type?",
        dismissable: true,
        buttons: [
          {
            text: "View Available Packages",
            onDidClick: () => {
              let packageListView = new PackageListView(packages);
              packageListView.toggle();
            }
          },
          {
            text: `Disable Grammar-Finder for '${ext}'`,
            onDidClick: () => {
              let ignoreExtList = atom.config.get("grammar-finder.ignoreExtList");
              ignoreExtList.push(ext);
              atom.config.set("grammar-finder.ignoreExtList", ignoreExtList);
            }
          },
          {
            text: "Disable AutoFind",
            onDidClick: () => {
              atom.config.set("grammar-finder.autoFind", false);
            }
          }
        ]
      }
    );

  }
}

module.exports = new GrammarFinder();
