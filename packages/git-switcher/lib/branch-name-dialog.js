const { SelectListView } = require("@lumine-code/select-list");

// Branch-name prompt implemented as an empty SelectListView: its query is the
// proposed name, and confirming with no selected item submits that query.
module.exports = class BranchNameDialog {
  constructor() {
    this.selectListView = new SelectListView({
      className: "git-switcher-branch-name-dialog",
      items: [],
      infoMessage: null,
      didChangeQuery: () => this.selectListView.update({ errorMessage: null }),
      didConfirmEmptySelection: () => this.confirm(),
      didCancelSelection: () => this.hide(),
    });
  }

  show({ prompt, onConfirm }) {
    this.onConfirm = onConfirm;
    this.pending = false;
    this.selectListView.reset();
    this.selectListView.update({
      items: [],
      infoMessage: prompt,
      errorMessage: null,
      placeholderText: "Branch name",
    });
    this.selectListView.show();
  }

  async confirm() {
    const name = this.selectListView.getQuery().trim();
    if (this.pending) return;
    if (!name) {
      await this.selectListView.update({ errorMessage: "Enter a branch name." });
      return;
    }

    this.pending = true;
    const succeeded = await this.onConfirm?.(name);
    this.pending = false;
    if (succeeded) this.hide();
  }

  hide() {
    this.selectListView.hide();
  }

  destroy() {
    this.selectListView.destroy();
  }
};
