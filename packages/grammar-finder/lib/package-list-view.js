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

        // === START OF STATS
        const statContainer = document.createElement("div");
        statContainer.classList.add("stats", "pull-right");

        const starSpan = document.createElement("span");
        starSpan.classList.add("stats-item");

        const starIcon = document.createElement("span");
        starIcon.classList.add("icon", "icon-star");
        starSpan.appendChild(starIcon);

        const starCount = document.createElement("span");
        starCount.classList.add("value");
        starCount.textContent = pack.stargazers_count;
        starSpan.appendChild(starCount);

        statContainer.appendChild(starSpan);

        const downSpan = document.createElement("span");
        downSpan.classList.add("stats-item");

        const downIcon = document.createElement("span");
        downIcon.classList.add("icon", "icon-cloud-download");
        downSpan.appendChild(downIcon);

        const downCount = document.createElement("span");
        downCount.classList.add("value");
        downCount.textContent = pack.downloads;
        downSpan.appendChild(downCount);

        statContainer.appendChild(downSpan);

        packageCard.appendChild(statContainer);
        // === END OF STATS

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

        const badges = document.createElement("span");
        if (Array.isArray(pack.badges)) {
          for (const badge of pack.badges) {
            let badgeHTML = this.generateBadge(badge);
            badges.appendChild(badgeHTML);
          }
        }
        cardName.appendChild(badges);

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

  generateBadge(badge) {
    const hasLink = (typeof badge.link === "string");
    const hasText = (typeof badge.text === "string");
    const classes = () => {
      switch(badge.type) {
        case "warn":
          return "badge-error";
        case "success":
          return "badge-success";
        case "info":
          return "badge-info";
        default:
          return "badge";
      }
    };
    const icons = () => {
      switch(badge.type) {
        case "warn":
          return "icon-alert";
        case "success":
          return "icon-check";
        case "info":
          return "icon-info";
        default:
          return "";
      }
    };

    if (hasLink) {
      if (hasText) {
        // Link and Text
        const link = document.createElement("a");
        link.href = badge.link;

        const spanContainer = document.createElement("span");
        spanContainer.classList.add("badge", classes());
        spanContainer.textContent = badge.title;

        const icon = document.createElement("i");
        icon.classList.add("icon", icons());

        spanContainer.appendChild(icon);
        link.appendChild(spanContainer);

        return link;

      } else {
        // Link no text
        const link = document.createElement("a");
        link.href = badge.link;

        const spanContainer = document.createElement("span");
        spanContainer.classList.add("badge", classes());
        spanContainer.textContent = badge.title;

        const icon = document.createElement("i");
        icon.classList.add("icon", icons());

        spanContainer.appendChild(icon);
        link.appendChild(spanContainer);

        return link;

      }
    } else {
      if (hasText) {
        // No link, has text
        const spanContainer = document.createElement("span");
        spanContainer.classList.add("badge", classes());
        spanContainer.textContent = badge.title;

        const icon = document.createElement("i");
        icon.classList.add("icon", icons());

        spanContainer.appendChild(icon);

        return spanContainer;

      } else {
        // no link and no text
        const spanContainer = document.createElement("span");
        spanContainer.classList.add("badge", classes());
        spanContainer.textContent = badge.title;

        const icon = document.createElement("i");
        icon.classList.add("icon", icons());

        spanContainer.appendChild(icon);

        return spanContainer;

      }
    }

  }
}
