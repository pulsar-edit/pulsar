// The default prompt handler for the git auth broker. Git's askpass protocol
// asks for one value at a time (a username, a password, or an SSH/GPG
// passphrase), each with its own prompt string, so this is a single-field modal
// that echoes git's prompt and returns the value the user enters. The reply key
// is always `password` because that is the transport field the helper reads —
// it carries whatever single value git asked for.

function promptForGitCredential(query = {}) {
  const workspace = globalThis.atom && globalThis.atom.workspace;
  if (!workspace) {
    return Promise.reject(new Error("No workspace is available to prompt for credentials"));
  }

  const prompt = query.prompt || "Enter git credentials";
  const masked = /password|passphrase|secret|token/i.test(prompt);

  return new Promise((resolve, reject) => {
    const element = document.createElement("div");
    element.classList.add("git-credential-dialog");
    element.setAttribute("tabindex", "-1");
    element.style.padding = "10px";
    element.style.minWidth = "22em";

    const message = document.createElement("div");
    message.classList.add("git-credential-dialog-prompt");
    message.textContent = prompt;
    message.style.marginBottom = "8px";

    const input = document.createElement("input");
    input.type = masked ? "password" : "text";
    input.classList.add("git-credential-dialog-input", "native-key-bindings");
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    input.style.marginBottom = "10px";

    const buttons = document.createElement("div");
    buttons.classList.add("git-credential-dialog-buttons");
    buttons.style.display = "flex";
    buttons.style.justifyContent = "flex-end";
    buttons.style.gap = "8px";
    const okButton = document.createElement("button");
    okButton.classList.add("btn", "btn-primary");
    okButton.textContent = "OK";
    const cancelButton = document.createElement("button");
    cancelButton.classList.add("btn");
    cancelButton.textContent = "Cancel";
    buttons.append(cancelButton, okButton);

    element.append(message, input, buttons);

    const panel = workspace.addModalPanel({ item: element });
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      panel.destroy();
      fn(value);
    };
    const accept = () => finish(resolve, { password: input.value });
    const cancel = () => finish(reject, new Error("Git credential prompt was cancelled"));

    okButton.addEventListener("click", accept);
    cancelButton.addEventListener("click", cancel);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        accept();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    });

    input.focus();
  });
}

module.exports = { promptForGitCredential };
