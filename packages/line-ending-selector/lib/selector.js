"use babel";

import { SelectListView } from "@lumine-code/select-list";

import { TextEditor } from "atom";
import { setLineEnding } from "./main";

export class Selector {
  lineEndingListView;

  // Make a selector object (should be called once)
  constructor(selectorItems) {
    this.lineEndingListView = new SelectListView({
      // an array containing the objects you want to show in the select list
      items: selectorItems,

      // called whenever an item needs to be displayed.
      elementForItem: (lineEnding) => {
        const element = document.createElement("li");
        element.textContent = lineEnding.name;
        return element;
      },

      // called to retrieve a string property on each item and that will be used to filter them.
      filterKeyForItem: (lineEnding) => {
        return lineEnding.name;
      },

      // called when the user clicks or presses Enter on an item. // use `=>` for `this`
      didConfirmSelection: (lineEnding) => {
        const editor = atom.workspace.getActiveTextEditor();
        if (editor instanceof TextEditor) {
          setLineEnding(editor, lineEnding.value);
        }
        this.hide();
      },

      // called when the user presses Esc or the list loses focus. // use `=>` for `this`
      didCancelSelection: () => {
        this.hide();
      },
    });
  }

  // Show a selector object
  show() {
    this.lineEndingListView.reset();
    this.lineEndingListView.show();
  }

  // Hide a selector
  hide() {
    this.lineEndingListView.hide();
  }

  // Dispose selector
  dispose() {
    this.lineEndingListView.destroy();
  }
}
