require("./utils.js");

class Submenu extends Array {
  getSelected() {
    return this.find((o) => o.isSelected()) || null;
  }

  getSelectable() {
    return this.filter((o) => o.isEnabled() && o.isVisible() && !o.isSeparator());
  }

  selectFirstItem() {
    const selectable = this.getSelectable();
    if (selectable.length < 1) {
      return;
    }
    this.getSelected()?.setSelected(false);
    const item = selectable[0];
    item.setSelected(true);
    this.scrollItemIntoView(item);
  }

  selectLastItem() {
    const selectable = this.getSelectable();
    if (selectable.length < 1) {
      return;
    }
    this.getSelected()?.setSelected(false);
    const item = selectable[selectable.length - 1];
    item.setSelected(true);
    this.scrollItemIntoView(item);
  }

  selectNextItem(wrap = false) {
    const selectable = this.getSelectable();
    if (selectable.length < 1) {
      return;
    }

    const selected = this.getSelected();
    if (selected) {
      let i = selectable.indexOf(selected);
      // If at the last item
      if (i >= selectable.length - 1) {
        if (wrap) {
          // Wrap to first item (for sublists)
          selected.setSelected(false);
          const item = selectable[0];
          item.setSelected(true);
          this.scrollItemIntoView(item);
        } else {
          // Unselect for main lists
          selected.setSelected(false);
        }
        return;
      }
      selected.setSelected(false);
      const item = selectable[i + 1];
      item.setSelected(true);
      this.scrollItemIntoView(item);
    }
  }

  selectPreviousItem(wrap = false) {
    const selectable = this.getSelectable();
    if (selectable.length < 1) {
      return;
    }

    const selected = this.getSelected();
    if (selected) {
      let i = selectable.indexOf(selected);
      // If at the first item
      if (i <= 0) {
        if (wrap) {
          // Wrap to last item (for sublists)
          selected.setSelected(false);
          const item = selectable[selectable.length - 1];
          item.setSelected(true);
          this.scrollItemIntoView(item);
        } else {
          // Unselect for main lists
          selected.setSelected(false);
        }
        return;
      }
      selected.setSelected(false);
      const item = selectable[i - 1];
      item.setSelected(true);
      this.scrollItemIntoView(item);
    }
  }

  scrollItemIntoView(item) {
    item.getElement().scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }
}

module.exports = { Submenu };
