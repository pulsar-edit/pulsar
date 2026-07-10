# tabs

Display a selectable tab for each open item in a pane.

## Features

- **Per-pane tabs**: shows a tab bar with a tab for every open editor and item in each pane.
- **Tab management**: close a single tab, other tabs, saved tabs, or every tab at once.
- **Split from a tab**: split the active tab up, down, left, or right into a new pane.
- **File icons**: shows a file-type icon on each tab when an icon service is available.
- **MRU switching**: cycle tabs in most-recently-used order with an optional overlay list.
- **VCS coloring**: optionally color tab file names based on their version control status.

## Commands

Commands available in `atom-workspace`:

- `tabs:close-all-tabs`: close every tab in every pane.

Commands available in `atom-pane`:

- `tabs:keep-pending-tab`: keep the active pending tab open,
- `tabs:close-tab`: close the active tab,
- `tabs:close-other-tabs`: close all tabs except the active one,
- `tabs:close-tabs-to-right`: close all tabs to the right of the active tab,
- `tabs:close-tabs-to-left`: close all tabs to the left of the active tab,
- `tabs:close-saved-tabs`: close all tabs with no unsaved changes,
- `tabs:close-all-tabs`: close every tab in the pane,
- `tabs:open-in-new-window`: open the active tab's item in a new window.

Commands available in `.tab-bar`:

- `tabs:close-tab`: close the target tab,
- `tabs:close-other-tabs`: close all tabs except the target one,
- `tabs:close-tabs-to-right`: close all tabs to the right of the target tab,
- `tabs:close-tabs-to-left`: close all tabs to the left of the target tab,
- `tabs:close-saved-tabs`: close all tabs with no unsaved changes,
- `tabs:close-all-tabs`: close every tab in the pane,
- `tabs:split-up`: split the target tab into a pane above,
- `tabs:split-down`: split the target tab into a pane below,
- `tabs:split-left`: split the target tab into a pane to the left,
- `tabs:split-right`: split the target tab into a pane to the right.

## Services

- **atom.file-icons** (`1.0.0`): consumed to supply the file-type icon shown on each tab.
- **file-icons.element-icons** (`1.0.0`): consumed to supply element-based file icons for tabs.

## Customization

Restyle the tabs by adding CSS to your `styles.less`. For example, to enlarge the labels and give the active tab a coloured underline:

```less
.tab-bar .tab {
  font-size: 13px;

  &.active {
    border-bottom: 2px solid #4c9aff;
  }
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
