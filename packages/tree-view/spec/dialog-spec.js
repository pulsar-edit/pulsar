const fs = require("fs");
const os = require("os");
const path = require("path");
const fsCompat = require("../lib/fs-compat");
const AddDialog = require("../lib/add-dialog");
const MoveDialog = require("../lib/move-dialog");
const CopyDialog = require("../lib/copy-dialog");

describe("TreeView dialogs", () => {
  let projectPath;
  let dialogs;

  beforeEach(() => {
    projectPath = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "tree-view-dialog-")));
    atom.project.setPaths([projectPath]);
    jasmine.attachToDOM(atom.views.getView(atom.workspace));
    dialogs = [];
  });

  afterEach(() => {
    for (const dialog of dialogs) {
      try {
        dialog.inputDialogView.destroy();
      } catch {
        // already destroyed by a confirm/cancel
      }
    }
    fs.rmSync(projectPath, { recursive: true, force: true });
  });

  function track(dialog) {
    dialogs.push(dialog);
    return dialog;
  }

  function fixture(name, contents = "") {
    const full = path.join(projectPath, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
    return full;
  }

  describe("AddDialog", () => {
    it("renders the prompt in the header and creates a file", () => {
      const dialog = track(new AddDialog(projectPath, true));
      dialog.attach();

      const header = dialog.inputDialogView.element.querySelector("label.icon");
      expect(header.textContent).toContain("file");

      let created = null;
      dialog.onDidCreateFile((createdPath) => (created = createdPath));
      dialog.miniEditor.setText("newfile.txt");
      dialog.onConfirm(dialog.miniEditor.getText());

      expect(created).toBe(path.join(projectPath, "newfile.txt"));
      expect(fs.existsSync(created)).toBe(true);
    });

    it("shows an error when the target already exists", async () => {
      fixture("exists.txt");
      const dialog = track(new AddDialog(projectPath, true));
      dialog.attach();
      dialog.miniEditor.setText("exists.txt");
      dialog.onConfirm(dialog.miniEditor.getText());

      await dialog.inputDialogView.constructor.getScheduler().getNextUpdatePromise();
      expect(dialog.inputDialogView.refs.errorMessage.textContent).toContain("already exists");
      expect(dialog.inputDialogView.element.classList.contains("error")).toBe(true);
    });
  });

  describe("MoveDialog", () => {
    it("moves the entry and reports the move", () => {
      const source = fixture("old.txt", "content");
      let moved = null;
      const dialog = track(
        new MoveDialog(source, {
          onMove: ({ initialPath, newPath }) => (moved = { initialPath, newPath }),
        }),
      );
      dialog.attach();
      dialog.miniEditor.setText("renamed.txt");
      dialog.onConfirm(dialog.miniEditor.getText());

      const destination = path.join(projectPath, "renamed.txt");
      expect(fs.existsSync(source)).toBe(false);
      expect(fs.existsSync(destination)).toBe(true);
      expect(moved).toEqual({ initialPath: source, newPath: destination });
    });
  });

  describe("CopyDialog", () => {
    function makeCopyDialog(source, onCopy) {
      return track(new CopyDialog(source, { onCopy: onCopy || (() => {}) }));
    }

    it("binds the open-after-copy checkbox to the tree-view.openAfterCopy config", () => {
      atom.config.set("tree-view.openAfterCopy", true);
      const dialog = makeCopyDialog(fixture("a.txt", "hi"));
      dialog.attach();

      const checkbox = dialog.inputDialogView.element.querySelector(".input-checkbox");
      expect(checkbox.checked).toBe(true);

      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      expect(atom.config.get("tree-view.openAfterCopy")).toBe(false);
    });

    it("reflects an external config change in the checkbox", async () => {
      atom.config.set("tree-view.openAfterCopy", false);
      const dialog = makeCopyDialog(fixture("a.txt", "hi"));
      dialog.attach();
      expect(dialog.inputDialogView.element.querySelector(".input-checkbox").checked).toBe(false);

      atom.config.set("tree-view.openAfterCopy", true);
      await dialog.inputDialogView.constructor.getScheduler().getNextUpdatePromise();
      expect(dialog.inputDialogView.element.querySelector(".input-checkbox").checked).toBe(true);
    });

    it("opens the duplicate when openAfterCopy is enabled", () => {
      atom.config.set("tree-view.openAfterCopy", true);
      // Run the copy callback synchronously so the open decision is testable
      // without depending on real async filesystem timing.
      spyOn(fsCompat, "copy").and.callFake((source, destination, callback) => callback());
      spyOn(atom.workspace, "open").and.returnValue(Promise.resolve());

      const dialog = makeCopyDialog(fixture("a.txt", "hi"));
      dialog.attach();
      dialog.miniEditor.setText("b.txt");
      dialog.onConfirm(dialog.miniEditor.getText());

      expect(fsCompat.copy).toHaveBeenCalled();
      expect(atom.workspace.open).toHaveBeenCalledWith(path.join(projectPath, "b.txt"), {
        activatePane: true,
      });
    });

    it("does not open the duplicate when openAfterCopy is disabled", () => {
      atom.config.set("tree-view.openAfterCopy", false);
      spyOn(fsCompat, "copy").and.callFake((source, destination, callback) => callback());
      spyOn(atom.workspace, "open").and.returnValue(Promise.resolve());

      const dialog = makeCopyDialog(fixture("a.txt", "hi"));
      dialog.attach();
      dialog.miniEditor.setText("b.txt");
      dialog.onConfirm(dialog.miniEditor.getText());

      expect(fsCompat.copy).toHaveBeenCalled();
      expect(atom.workspace.open).not.toHaveBeenCalled();
    });
  });
});
