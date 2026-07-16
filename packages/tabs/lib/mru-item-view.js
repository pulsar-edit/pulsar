"use babel";

import getIconServices from "./get-icon-services";

export default class MRUItemView {
  initialize(listView, item) {
    this.listView = listView;
    this.item = item;

    this.element = document.createElement("li");
    this.element.itemViewData = this;
    this.element.classList.add("two-lines");

    this.itemPath = null;
    if (item.getPath && typeof item.getPath === "function") {
      this.itemPath = item.getPath();
    }

    const repo = MRUItemView.repositoryForPath(this.itemPath);
    const summary = repo?.getPathStatusSummary(this.itemPath);
    if (summary != null) {
      const statusIconDiv = document.createElement("div");
      if (summary.conflicted) {
        statusIconDiv.className = "status status-conflicted icon icon-alert";
        this.element.appendChild(statusIconDiv);
      } else if (summary.modified) {
        statusIconDiv.className = "status status-modified icon icon-diff-modified";
        this.element.appendChild(statusIconDiv);
      } else if (summary.added) {
        statusIconDiv.className = "status status-added icon icon-diff-added";
        this.element.appendChild(statusIconDiv);
      }
    }

    this.firstLineDiv = this.element.appendChild(document.createElement("div"));
    this.firstLineDiv.classList.add("primary-line", "file");
    if (typeof item.getIconName === "function") {
      if (atom.config.get("tabs.showIcons"))
        this.firstLineDiv.classList.add("icon", "icon-" + item.getIconName());
    } else {
      getIconServices().updateMRUIcon(this);
    }
    this.firstLineDiv.setAttribute("data-name", item.getTitle());
    this.firstLineDiv.innerText = item.getTitle();

    if (this.itemPath) {
      this.firstLineDiv.setAttribute("data-path", this.itemPath);
      const secondLineDiv = this.element.appendChild(document.createElement("div"));
      secondLineDiv.classList.add("secondary-line", "path", "no-icon");
      secondLineDiv.innerText = this.itemPath;
    }
  }

  select() {
    this.element.classList.add("selected");
  }

  unselect() {
    this.element.classList.remove("selected");
  }

  static repositoryForPath(filePath) {
    return filePath ? atom.repositories.getForPath(filePath) : null;
  }
}
