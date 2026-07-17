const { InputDialogView } = require("@lumine-code/select-list");

// Branch-name prompt built on InputDialogView: the query is the proposed name
// and confirming submits it.
module.exports = class BranchNameDialog {
  constructor() {
    this.inputDialogView = new InputDialogView({
      className: "git-switcher-branch-name-dialog",
      didChangeQuery: () => this.inputDialogView.update({ errorMessage: null }),
      didConfirm: () => this.confirm(),
      didCancel: () => this.hide(),
    });
  }

  show({ prompt, onConfirm }) {
    this.onConfirm = onConfirm;
    this.pending = false;
    this.inputDialogView.reset();
    this.inputDialogView.update({
      infoMessage: prompt,
      errorMessage: null,
      placeholderText: "Branch name",
    });
    this.inputDialogView.show();
  }

  async confirm() {
    const name = this.inputDialogView.getQuery().trim();
    if (this.pending) return;
    if (!name) {
      await this.inputDialogView.update({ errorMessage: "Enter a branch name." });
      return;
    }

    this.pending = true;
    const succeeded = await this.onConfirm?.(name);
    this.pending = false;
    if (succeeded) this.hide();
  }

  hide() {
    this.inputDialogView.hide();
  }

  destroy() {
    this.inputDialogView.destroy();
  }
};
