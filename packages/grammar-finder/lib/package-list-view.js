const SelectListView = require("atom-select-list");

module.exports =
class PackageListView {
  constructor(packageList) {

    this.packageList = packageList;

    this.packageListView = new SelectListView({
      itemsClassList: [ "mark-active" ],
      items: [],
      filterKeyForItem: (pack) => pack.name,
      elementForItem: (pack) => {
        const packageCard = document.createElement("div");
        packageCard.classList.add("package-card");

        const body = document.createElement("div");
        body.classList.add("body");

        const cardName = document.createElement("h4");
        cardName.classList.add("card-name");

        const packageName = document.createElement("a");
        packageName.classList.add("package-name");
        packageName.textContent = pack.name;
        packageName.href = `https://web.pulsar-edit.dev/packages/${pack.name}`;
        cardName.appendChild(packageName);

        const packageVersion = document.createElement("span");
        packageVersion.classList.add("package-version");
        packageVersion.textContent = pack.metadata.version;
        cardName.appendChild(packageVersion);

        const packageDescription = document.createElement("span");
        packageDescription.classList.add("package-description");
        packageDescription.textContent = pack.metadata.description;

        body.appendChild(cardName);
        body.appendChild(packageDescription);

        packageCard.appendChild(body);

        return packageCard;
      },
      didConfirmSelection: (pack) => {
        this.cancel();
        // Then we defer to `settings-view` to install the package
        atom.workspace.open(`atom://settings-view/show-package?package=${pack.name}`);
      },
      didCancelSelection: () => {
        this.cancel();
      }
    });

    this.packageListView.element.classList.add("grammar-finder");
  }

  destroy() {
    this.cancel();
    this.packageList = null;
    return this.packageListView.destroy();
  }

  cancel() {
    if (this.panel != null) {
      this.panel.destroy();
    }
    this.panel = null;

    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  attach() {
    this.previouslyFocusedElement = document.activeElement;
    if (this.panel == null) {
      this.panel = atom.workspace.addModalPanel({ item: this.packageListView });
    }
    this.packageListView.focus();
    this.packageListView.reset();
  }

  async toggle() {
    if (this.panel != null) {
      this.cancel();
      return;
    }

    await this.packageListView.update({ items: this.packageList });
    this.attach();
  }
}
