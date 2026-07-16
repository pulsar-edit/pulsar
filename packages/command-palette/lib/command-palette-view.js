/** @babel */

import {
  SelectListView,
  getMatchIndices,
  highlightMatches,
} from "@lumine-code/select-list";
import { humanizeKeystroke } from "@lumine-code/underscore-plus";

export default class CommandPaletteView {
  constructor(initiallyVisibleItemCount = 10) {
    this.keyBindingsForActiveElement = [];
    this.selectListView = new SelectListView({
      className: "command-palette",
      initiallyVisibleItemCount: initiallyVisibleItemCount, // just for being able to disable visible-on-render in spec
      items: [],
      filter: this.filter,
      emptyMessage: "No matches found",
      elementForItem: (item, { selected, visible }) => {
        if (!visible) {
          return document.createElement("li");
        }

        const li = document.createElement("li");
        li.classList.add("event", "two-lines");
        li.dataset.eventName = item.name;

        const rightBlock = document.createElement("div");
        rightBlock.classList.add("pull-right");

        this.keyBindingsForActiveElement
          .filter(({ command }) => command === item.name)
          .forEach((keyBinding) => {
            const kbd = document.createElement("kbd");
            kbd.classList.add("key-binding");
            kbd.textContent = humanizeKeystroke(keyBinding.keystrokes);
            rightBlock.appendChild(kbd);
          });
        li.appendChild(rightBlock);

        const leftBlock = document.createElement("div");
        const titleEl = document.createElement("div");
        titleEl.classList.add("primary-line");
        titleEl.title = item.name;
        leftBlock.appendChild(titleEl);

        const query = this.selectListView.getQuery();
        titleEl.appendChild(
          highlightMatches(item.displayName, getMatchIndices(item.displayName, query)),
        );

        if (selected) {
          let secondaryEl = document.createElement("div");
          secondaryEl.classList.add("secondary-line");
          secondaryEl.style.display = "flex";

          if (typeof item.description === "string") {
            secondaryEl.appendChild(this.createDescription(item.description, query));
          }

          if (Array.isArray(item.tags)) {
            const matchingTags = item.tags
              .map((t) => [t, atom.ui.fuzzyMatcher.score(t, query)])
              .filter(([, s]) => s > 0)
              .sort((a, b) => a[1] - b[1])
              .map(([t]) => t);

            if (matchingTags.length > 0) {
              secondaryEl.appendChild(this.createTags(matchingTags, query));
            }
          }

          leftBlock.appendChild(secondaryEl);
        }

        li.appendChild(leftBlock);
        return li;
      },
      didConfirmSelection: (keyBinding) => {
        this.hide();
        const event = new CustomEvent(keyBinding.name, { bubbles: true, cancelable: true });
        this.activeElement.dispatchEvent(event);
      },
      didCancelSelection: () => {
        this.hide();
      },
    });
  }

  async destroy() {
    await this.selectListView.destroy();
  }

  toggle() {
    if (this.selectListView.isVisible()) {
      this.hide();
      return Promise.resolve();
    } else {
      return this.show();
    }
  }

  async show(showHiddenCommands = false) {
    if (!this.preserveLastSearch) {
      this.selectListView.reset();
    }

    this.activeElement =
      document.activeElement === document.body
        ? atom.views.getView(atom.workspace)
        : document.activeElement;
    this.keyBindingsForActiveElement = atom.keymaps.findKeyBindings({ target: this.activeElement });
    const commandsForActiveElement = atom.commands
      .findCommands({ target: this.activeElement })
      .filter((command) => showHiddenCommands === !!command.hiddenInCommandPalette);
    commandsForActiveElement.sort((a, b) => a.displayName.localeCompare(b.displayName));
    await this.selectListView.update({ items: commandsForActiveElement });

    this.selectListView.show();
  }

  hide() {
    this.selectListView.hide();
  }

  async update(props) {
    if (Object.prototype.hasOwnProperty.call(props, "preserveLastSearch")) {
      this.preserveLastSearch = props.preserveLastSearch;
    }
  }

  filter = (items, query) => {
    if (query.length === 0) {
      return items;
    }

    const scoredItems = [];
    for (const item of items) {
      let score = atom.ui.fuzzyMatcher.score(item.displayName, query);
      if (item.tags) {
        score += item.tags.reduce(
          (currentScore, tag) => currentScore + atom.ui.fuzzyMatcher.score(tag, query),
          0,
        );
      }
      if (item.description) {
        score += atom.ui.fuzzyMatcher.score(item.description, query);
      }

      if (score > 0) {
        scoredItems.push({ item, score });
      }
    }
    scoredItems.sort((a, b) => b.score - a.score);
    return scoredItems.map((i) => i.item);
  };

  createDescription(description, query) {
    const descriptionEl = document.createElement("div");

    // in case of overflow, give full contents on long hover
    descriptionEl.title = description;

    Object.assign(descriptionEl.style, {
      flexGrow: 1,
      flexShrink: 1,
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
    });
    descriptionEl.appendChild(highlightMatches(description, getMatchIndices(description, query)));
    return descriptionEl;
  }

  createTag(tagText, query) {
    const tagEl = document.createElement("li");
    Object.assign(tagEl.style, {
      borderBottom: 0,
      display: "inline",
      padding: 0,
    });
    tagEl.appendChild(highlightMatches(tagText, getMatchIndices(tagText, query)));
    return tagEl;
  }

  createTags(matchingTags, query) {
    const tagsEl = document.createElement("ol");
    Object.assign(tagsEl.style, {
      display: "inline",
      marginLeft: "4px",
      flexShrink: 0,
      padding: 0,
    });

    const introEl = document.createElement("strong");
    introEl.textContent = "matching tags: ";

    tagsEl.appendChild(introEl);
    matchingTags
      .map((t) => this.createTag(t, query))
      .forEach((tagEl, i) => {
        tagsEl.appendChild(tagEl);
        if (i < matchingTags.length - 1) {
          const commaSpace = document.createElement("span");
          commaSpace.textContent = ", ";
          tagsEl.appendChild(commaSpace);
        }
      });
    return tagsEl;
  }
}
