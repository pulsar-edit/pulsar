"use babel";

import { conditionPromise, waitForAutocomplete } from "./spec-helper";
import path from "path";

describe("Autocomplete", () => {
  let editorView;
  let editor;
  let autocompleteManager;
  let mainModule;

  beforeEach(async () => {
    atom.workspace.project.setPaths([path.join(__dirname, "fixtures")]);
    jasmine.useRealClock();

    // Set to live completion
    atom.config.set("autocomplete.enableAutoActivation", true);
    atom.config.set("autocomplete.fileBlacklist", [".*", "*.md"]);

    let workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);

    editor = await atom.workspace.open("sample.js");
    await atom.packages.activatePackage("language-javascript");

    // Activate the package
    mainModule = (await atom.packages.activatePackage("autocomplete")).mainModule;

    await conditionPromise(
      () => mainModule.autocompleteManager && mainModule.autocompleteManager.ready,
    );

    autocompleteManager = mainModule.autocompleteManager;
    editorView = atom.views.getView(editor);
  });

  describe("@activate()", () =>
    it("activates autocomplete and initializes AutocompleteManager", () => {
      expect(autocompleteManager).toBeDefined();
      expect(editorView.querySelector(".autocomplete")).not.toExist();
    }));

  describe("@deactivate()", () => {
    it("removes all autocomplete views", async () => {
      // Trigger an autocompletion
      editor.moveToBottom();
      editor.insertText("A");

      await waitForAutocomplete(editor);

      expect(editorView.querySelector(".autocomplete")).toExist();

      // Deactivate the package
      await atom.packages.deactivatePackage("autocomplete");
      expect(editorView.querySelector(".autocomplete")).not.toExist();
    });
  });
});
