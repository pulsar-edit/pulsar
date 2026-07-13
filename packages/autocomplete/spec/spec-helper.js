
beforeEach(() => {
  spyOn(atom.views, "readDocument").andCallFake((fn) => fn());
  spyOn(atom.views, "updateDocument").andCallFake((fn) => fn());
  atom.config.set("autocomplete.minimumWordLength", 1);
  atom.config.set("autocomplete.suggestionListFollows", "Word");
  atom.config.set("autocomplete.useCoreMovementCommands", true);
  atom.config.set("autocomplete.includeCompletionsFromAllBuffers", false);
});

function waitForAutocomplete(editor) {
  const editorView = atom.views.getView(editor);

  return conditionPromise(() => editorView.querySelectorAll(".autocomplete li").length > 0);
}

function waitForAutocompleteToDisappear(editor) {
  const editorView = atom.views.getView(editor);

  return conditionPromise(() => editorView.querySelectorAll(".autocomplete li").length === 0);
}

let triggerAutocompletion = (editor, moveCursor = true, char = "f") => {
  if (moveCursor) {
    editor.moveToBottom();
    editor.moveToBeginningOfLine();
  }
  editor.insertText(char);
};

async function waitForDeferredSuggestions(editorView, totalSuggestions) {
  await conditionPromise(() =>
    editorView.querySelector(
      ".autocomplete autocomplete-suggestion-list .suggestion-list-scroller",
    ),
  );

  const scroller = editorView.querySelector(
    ".autocomplete autocomplete-suggestion-list .suggestion-list-scroller",
  );
  scroller.scrollTo(0, 100);
  scroller.scrollTo(0, 0);

  await conditionPromise(
    () => editorView.querySelectorAll(".autocomplete li").length === totalSuggestions,
  );
}

let buildIMECompositionEvent = (event, { data, target } = {}) => {
  event = new CustomEvent(event, { bubbles: true });
  event.data = data;
  Object.defineProperty(event, "target", {
    get() {
      return target;
    },
  });
  return event;
};

let buildTextInputEvent = ({ data, target }) => {
  let event = new CustomEvent("textInput", { bubbles: true });
  event.data = data;
  Object.defineProperty(event, "target", {
    get() {
      return target;
    },
  });
  return event;
};

async function conditionPromise(condition) {
  const startTime = Date.now();

  while (true) {
    await timeoutPromise(100);

    if (await condition()) {
      return;
    }

    if (Date.now() - startTime > 5000) {
      throw new Error("Timed out waiting on condition");
    }
  }
}

function timeoutPromise(timeout) {
  return new Promise(function (resolve) {
    setTimeout(resolve, timeout);
  });
}

module.exports = {
  conditionPromise,
  timeoutPromise,
  triggerAutocompletion,
  waitForAutocomplete,
  waitForAutocompleteToDisappear,
  buildIMECompositionEvent,
  buildTextInputEvent,
  waitForDeferredSuggestions,
};
