let BrowserWindow = null; // Defer require until actually used
const {ipcRenderer} = require('electron');

const {CompositeDisposable} = require('atom');
const TabView = require('./tab-view.js');

class TabBarView {
  constructor(pane, location) {
    this.pane = pane;
    this.location = location;
    this.element = document.createElement("ul");
    this.element.classList.add("list-inline");
    this.element.classList.add("tab-bar");
    this.element.classList.add("inset-panel");
    this.element.setAttribute("is", "atom-tabs");
    this.element.setAttribute("tabindex", -1);
    this.element.setAttribute("location", this.location);

    this.tabs = [];
    this.tabsByElement = new WeakMap;
    this.subscriptions = new CompositeDisposable;

    this.paneElement = this.pane.getElement();

    this.subscriptions.add(atom.commands.add(this.paneElement, {
      "tabs:keep-pending-tab": () => this.terminatePendingStates(),
      "tabs:close-tab": () => this.closeTab(this.getActiveTab()),
      "tabs:close-other-tabs": () => this.closeOtherTabs(this.getActiveTab()),
      "tabs:close-tabs-to-right": () => this.closeTabsToRight(this.getActiveTab()),
      "tabs:close-tabs-to-left": () => this.closeTabsToLeft(this.getActiveTab()),
      "tabs:close-saved-tabs": () => this.closeSavedTabs(),
      "tabs:close-all-tabs": event => {
        event.stopPropagation();
        return this.closeAllTabs();
      },
      "tabs:open-in-new-window": () => this.openInNewWindow()
    }));

    const addElementCommands = commands => {
      const commandsWithPropagationStopped = {};
      Object.keys(commands).forEach(name => commandsWithPropagationStopped[name] = function(event) {
        event.stopPropagation();
        return commands[name]();
      });

      return this.subscriptions.add(atom.commands.add(this.element, commandsWithPropagationStopped));
    };

    addElementCommands({
      "tabs:close-tab": () => this.closeTab(),
      "tabs:close-other-tabs": () => this.closeOtherTabs(),
      "tabs:close-tabs-to-right": () => this.closeTabsToRight(),
      "tabs:close-tabs-to-left": () => this.closeTabsToLeft(),
      "tabs:close-saved-tabs": () => this.closeSavedTabs(),
      "tabs:close-all-tabs": () => this.closeAllTabs(),
      "tabs:split-up": () => this.splitTab("splitUp"),
      "tabs:split-down": () => this.splitTab("splitDown"),
      "tabs:split-left": () => this.splitTab("splitLeft"),
      "tabs:split-right": () => this.splitTab("splitRight")
    });

    this.element.addEventListener("mouseenter", this.onMouseEnter.bind(this));
    this.element.addEventListener("mouseleave", this.onMouseLeave.bind(this));
    this.element.addEventListener("mousewheel", this.onMouseWheel.bind(this));
    this.element.addEventListener("dragstart", this.onDragStart.bind(this));
    this.element.addEventListener("dragend", this.onDragEnd.bind(this));
    this.element.addEventListener("dragleave", this.onDragLeave.bind(this));
    this.element.addEventListener("dragover", this.onDragOver.bind(this));
    this.element.addEventListener("drop", this.onDrop.bind(this));

    // Toggle the tab bar when a tab is dragged over the pane with alwaysShowTabBar = false
    this.paneElement.addEventListener('dragenter', this.onPaneDragEnter.bind(this));
    this.paneElement.addEventListener('dragleave', this.onPaneDragLeave.bind(this));

    this.paneContainer = this.pane.getContainer();
    for (let item of Array.from(this.pane.getItems())) { this.addTabForItem(item); }

    this.subscriptions.add(this.pane.onDidDestroy(() => {
      return this.destroy();
    }));

    this.subscriptions.add(this.pane.onDidAddItem(({item, index}) => {
      return this.addTabForItem(item, index);
    }));

    this.subscriptions.add(this.pane.onDidMoveItem(({item, newIndex}) => {
      return this.moveItemTabToIndex(item, newIndex);
    }));

    this.subscriptions.add(this.pane.onDidRemoveItem(({item}) => {
      return this.removeTabForItem(item);
    }));

    this.subscriptions.add(this.pane.onDidChangeActiveItem(item => {
      return this.updateActiveTab();
    }));

    this.subscriptions.add(atom.config.observe('tabs.tabScrolling', value => this.updateTabScrolling(value)));
    this.subscriptions.add(atom.config.observe('tabs.tabScrollingThreshold', value => this.updateTabScrollingThreshold(value)));
    this.subscriptions.add(atom.config.observe('tabs.alwaysShowTabBar', () => this.updateTabBarVisibility()));

    this.updateActiveTab();

    this.element.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.element.addEventListener("click", this.onClick.bind(this));
    this.element.addEventListener("auxclick", this.onClick.bind(this));
    this.element.addEventListener("dblclick", this.onDoubleClick.bind(this));

    this.onDropOnOtherWindow = this.onDropOnOtherWindow.bind(this);
    ipcRenderer.on('tab:dropped', this.onDropOnOtherWindow);

  }

  destroy() {
    ipcRenderer.removeListener('tab:dropped', this.onDropOnOtherWindow);
    this.subscriptions.dispose();
    return this.element.remove();
  }

  terminatePendingStates() {
    for (let tab of this.getTabs()) {
      if (typeof tab.terminatePendingState === "function") {
        tab.terminatePendingState();
      }
    }
  }

  addTabForItem(item, index) {
    let tabView = new TabView({
      item,
      pane: this.pane,
      tabs: this.tabs,
      didClickCloseIcon: () => {
        this.closeTab(tabView);
      },
      location: this.location
    });
    if (this.isItemMovingBetweenPanes) {
      tabView.terminatePendingState();
    }

    this.tabsByElement.set(tabView.element, tabView);
    this.insertTabAtIndex(tabView, index);

    if (atom.config.get('tabs.addNewTabsAtEnd')) {
      if (!this.isItemMovingBetweenPanes) {
        return this.pane.moveItem(item, this.pane.getItems().length - 1);
      }
    }
  }

  moveItemTabToIndex(item, index) {
    const tabIndex = this.tabs.findIndex(t => t.item === item);
    if (tabIndex !== -1) {
      const tab = this.tabs[tabIndex];
      tab.element.remove();
      this.tabs.splice(tabIndex, 1);
      return this.insertTabAtIndex(tab, index);
    }
  }

  insertTabAtIndex(tab, index) {
    let followingTab;
    if (index != null) {
      followingTab = this.tabs[index];
    }
    if (followingTab) {
      this.element.insertBefore(tab.element, followingTab.element);
      this.tabs.splice(index, 0, tab);
    } else {
      this.element.appendChild(tab.element);
      this.tabs.push(tab);
    }

    tab.updateTitle();
    return this.updateTabBarVisibility();
  }

  removeTabForItem(item) {
    let tab;
    const tabIndex = this.tabs.findIndex(t => t.item === item);
    if (tabIndex !== -1) {
      tab = this.tabs[tabIndex];
      this.tabs.splice(tabIndex, 1);
      this.tabsByElement.delete(tab);
      tab.destroy();
    }
    for (tab of this.getTabs()) {
      tab.updateTitle();
    }

    return this.updateTabBarVisibility();
  }

  updateTabBarVisibility() {
    // Show tab bar if the setting is true or there is more than one tab
    if (atom.config.get('tabs.alwaysShowTabBar') || (this.pane.getItems().length > 1)) {
      return this.element.classList.remove('hidden');
    } else {
      return this.element.classList.add('hidden');
    }
  }

  getTabs() {
    return this.tabs.slice();
  }

  tabAtIndex(index) {
    return this.tabs[index];
  }

  tabForItem(item) {
    return this.tabs.find(t => t.item === item);
  }

  setActiveTab(tabView) {
    if ((tabView != null) && (tabView !== this.activeTab)) {
      if (this.activeTab != null) {
        this.activeTab.element.classList.remove('active');
      }
      this.activeTab = tabView;
      this.activeTab.element.classList.add('active');
      return this.activeTab.element.scrollIntoView(false);
    }
  }

  getActiveTab() {
    return this.tabForItem(this.pane.getActiveItem());
  }

  updateActiveTab() {
    return this.setActiveTab(this.tabForItem(this.pane.getActiveItem()));
  }

  closeTab(tab) {
    if (tab == null) { tab = this.rightClickedTab; }
    if (tab != null) { return this.pane.destroyItem(tab.item); }
  }

  openInNewWindow(tab) {
    let itemURI;
    if (tab == null) { tab = this.rightClickedTab; }
    const item = tab != null ? tab.item : undefined;
    if (item == null) { return; }
    if (typeof item.getURI === 'function') {
      itemURI = item.getURI();
    } else if (typeof item.getPath === 'function') {
      itemURI = item.getPath();
    } else if (typeof item.getUri === 'function') {
      itemURI = item.getUri();
    }
    if (itemURI == null) { return; }
    this.closeTab(tab);
    for (tab of this.getTabs()) { tab.element.style.maxWidth = ''; }
    const pathsToOpen = [atom.project.getPaths(), itemURI].reduce(((a, b) => a.concat(b)), []);
    return atom.open({pathsToOpen, newWindow: true, devMode: atom.devMode, safeMode: atom.safeMode});
  }

  splitTab(fn) {
    let item;
    if (item = this.rightClickedTab != null ? this.rightClickedTab.item : undefined) {
      let copiedItem;
      if (copiedItem = typeof item.copy === 'function' ? item.copy() : undefined) {
        return this.pane[fn]({items: [copiedItem]});
      }
    }
  }

  closeOtherTabs(active) {
    const tabs = this.getTabs();
    if (active == null) { active = this.rightClickedTab; }
    if (active == null) { return; }
    return tabs.filter((tab) => tab !== active).map((tab) => this.closeTab(tab));
  }

  closeTabsToRight(active) {
    const tabs = this.getTabs();
    if (active == null) { active = this.rightClickedTab; }
    const index = tabs.indexOf(active);
    if (index === -1) { return; }
    return (() => {
      const result = [];
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (i > index) {
          result.push(this.closeTab(tab));
        }
      }
      return result;
    })();
  }

  closeTabsToLeft(active) {
    const tabs = this.getTabs();
    if (active == null) { active = this.rightClickedTab; }
    const index = tabs.indexOf(active);
    if (index === -1) { return; }
    return (() => {
      const result = [];
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (i < index) {
          result.push(this.closeTab(tab));
        }
      }
      return result;
    })();
  }

  closeSavedTabs() {
    return (() => {
      const result = [];
      for (let tab of this.getTabs()) {
        if (!(typeof tab.item.isModified === 'function' ? tab.item.isModified() : undefined)) { result.push(this.closeTab(tab)); } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  closeAllTabs() {
    return this.getTabs().map((tab) => this.closeTab(tab));
  }

  getWindowId() {
    return this.windowId != null ? this.windowId : (this.windowId = atom.getCurrentWindow().id);
  }

  onDragStart(event) {
    let itemURI;
    this.draggedTab = this.tabForElement(event.target);
    if (!this.draggedTab) { return; }
    this.lastDropTargetIndex = null;

    event.dataTransfer.setData('atom-tab-event', 'true');

    this.draggedTab.element.classList.add('is-dragging');
    this.draggedTab.destroyTooltip();

    const tabIndex = this.tabs.indexOf(this.draggedTab);
    event.dataTransfer.setData('sortable-index', tabIndex);

    const paneIndex = this.paneContainer.getPanes().indexOf(this.pane);
    event.dataTransfer.setData('from-pane-index', paneIndex);
    event.dataTransfer.setData('from-pane-id', this.pane.id);
    event.dataTransfer.setData('from-window-id', this.getWindowId());

    const item = this.pane.getItems()[this.tabs.indexOf(this.draggedTab)];
    if (item == null) { return; }

    if (typeof item.getURI === 'function') {
      let left;
      itemURI = (left = item.getURI()) != null ? left : '';
    } else if (typeof item.getPath === 'function') {
      let left1;
      itemURI = (left1 = item.getPath()) != null ? left1 : '';
    } else if (typeof item.getUri === 'function') {
      let left2;
      itemURI = (left2 = item.getUri()) != null ? left2 : '';
    }

    if (typeof item.getAllowedLocations === 'function') {
      for (let location of item.getAllowedLocations()) {
        event.dataTransfer.setData(`allowed-location-${location}`, 'true');
      }
    } else {
      event.dataTransfer.setData('allow-all-locations', 'true');
    }

    if (itemURI != null) {
      event.dataTransfer.setData('text/plain', itemURI);

      if (process.platform === 'darwin') { // see #69
        if (!this.uriHasProtocol(itemURI)) { itemURI = `file://${itemURI}`; }
        event.dataTransfer.setData('text/uri-list', itemURI);
      }

      if ((typeof item.isModified === 'function' ? item.isModified() : undefined) && (item.getText != null)) {
        event.dataTransfer.setData('has-unsaved-changes', 'true');
        return event.dataTransfer.setData('modified-text', item.getText());
      }
    }
  }

  uriHasProtocol(uri) {
    try {
      return (require('url').parse(uri).protocol != null);
    } catch (error) {
      return false;
    }
  }

  onDragLeave(event) {
    // Do not do anything unless the drag goes outside the tab bar
    if (!event.currentTarget.contains(event.relatedTarget)) {
      this.removePlaceholder();
      this.lastDropTargetIndex = null;
      return this.getTabs().map((tab) => (tab.element.style.maxWidth = ''));
    }
  }

  onDragEnd(event) {
    if (!this.tabForElement(event.target)) { return; }

    return this.clearDropTarget();
  }

  onDragOver(event) {
    let tab;
    if (!this.isAtomTabEvent(event)) { return; }
    if (!this.itemIsAllowed(event, this.location)) { return; }

    event.preventDefault();
    event.stopPropagation();

    const newDropTargetIndex = this.getDropTargetIndex(event);
    if (newDropTargetIndex == null) { return; }
    if (this.lastDropTargetIndex === newDropTargetIndex) { return; }
    this.lastDropTargetIndex = newDropTargetIndex;

    this.removeDropTargetClasses();

    const tabs = this.getTabs();
    const placeholder = this.getPlaceholder();
    if (placeholder == null) { return; }

    if (newDropTargetIndex < tabs.length) {
      tab = tabs[newDropTargetIndex];
      tab.element.classList.add('is-drop-target');
      return tab.element.parentElement.insertBefore(placeholder, tab.element);
    } else {
      if (tab = tabs[newDropTargetIndex - 1]) {
        let sibling;
        tab.element.classList.add('drop-target-is-after');
        if ((sibling = tab.element.nextSibling)) {
          return tab.element.parentElement.insertBefore(placeholder, sibling);
        } else {
          return tab.element.parentElement.appendChild(placeholder);
        }
      }
    }
  }

  onDropOnOtherWindow(event, fromPaneId, fromItemIndex) {
    if (this.pane.id === fromPaneId) {
      let itemToRemove;
      if (itemToRemove = this.pane.getItems()[fromItemIndex]) {
        this.pane.destroyItem(itemToRemove);
      }
    }

    return this.clearDropTarget();
  }

  clearDropTarget() {
    if (this.draggedTab != null) {
      this.draggedTab.element.classList.remove('is-dragging');
    }
    if (this.draggedTab != null) {
      this.draggedTab.updateTooltip();
    }
    this.draggedTab = null;
    this.removeDropTargetClasses();
    return this.removePlaceholder();
  }

  onDrop(event) {
    if (!this.isAtomTabEvent(event)) {
      return;
    }

    event.preventDefault();

    const fromWindowId  = parseInt(event.dataTransfer.getData('from-window-id'));
    const fromPaneId    = parseInt(event.dataTransfer.getData('from-pane-id'));
    const fromIndex     = parseInt(event.dataTransfer.getData('sortable-index'));
    const fromPaneIndex = parseInt(event.dataTransfer.getData('from-pane-index'));

    const hasUnsavedChanges = event.dataTransfer.getData('has-unsaved-changes') === 'true';
    const modifiedText = event.dataTransfer.getData('modified-text');

    const toIndex = this.getDropTargetIndex(event);
    const toPane = this.pane;

    this.clearDropTarget();

    if (!this.itemIsAllowed(event, this.location)) { return; }

    if (fromWindowId === this.getWindowId()) {
      let fromPane = this.paneContainer.getPanes()[fromPaneIndex];
      if ((fromPane != null ? fromPane.id : undefined) !== fromPaneId) {
        // If dragging from a different pane container, we have to be more
        // exhaustive in our search.
        fromPane = Array.from(document.querySelectorAll('atom-pane'))
          .map(paneEl => paneEl.model)
          .find(pane => pane.id === fromPaneId);
      }
      const item = fromPane.getItems()[fromIndex];
      if (item != null) { return this.moveItemBetweenPanes(fromPane, fromIndex, toPane, toIndex, item); }
    } else {
      const droppedURI = event.dataTransfer.getData('text/plain');
      atom.workspace.open(droppedURI).then(item => {
        // Move the item from the pane it was opened on to the target pane
        // where it was dropped onto
        const activePane = atom.workspace.getActivePane();
        const activeItemIndex = activePane.getItems().indexOf(item);
        this.moveItemBetweenPanes(activePane, activeItemIndex, toPane, toIndex, item);
        if (hasUnsavedChanges) { if (typeof item.setText === 'function') {
          item.setText(modifiedText);
        } }

        if (!isNaN(fromWindowId)) {
          // Let the window where the drag started know that the tab was dropped
          const browserWindow = this.browserWindowForId(fromWindowId);
          return (browserWindow != null ? browserWindow.webContents.send('tab:dropped', fromPaneId, fromIndex) : undefined);
        }
      });

      return atom.focus();
    }
  }

  // Show the tab bar when a tab is being dragged in this pane when alwaysShowTabBar = false
  onPaneDragEnter(event) {
    if (!this.isAtomTabEvent(event)) {
      return;
    }
    if (!this.itemIsAllowed(event, this.location)) {
      return;
    }
    if ((this.pane.getItems().length > 1) || atom.config.get('tabs.alwaysShowTabBar')) {
      return;
    }
    if (this.paneElement.contains(event.relatedTarget)) {
      return this.element.classList.remove('hidden');
    }
  }

  // Hide the tab bar when the dragged tab leaves this pane when alwaysShowTabBar = false
  onPaneDragLeave(event) {
    if (!this.isAtomTabEvent(event)) {
      return;
    }
    if (!this.itemIsAllowed(event, this.location)) {
      return;
    }
    if ((this.pane.getItems().length > 1) || atom.config.get('tabs.alwaysShowTabBar')) {
      return;
    }
    if (!this.paneElement.contains(event.relatedTarget)) {
      return this.element.classList.add('hidden');
    }
  }

  onMouseWheel(event) {
    if (event.shiftKey || !this.tabScrolling) { return; }

    if (this.wheelDelta == null) { this.wheelDelta = 0; }
    this.wheelDelta += event.wheelDeltaY;

    if (this.wheelDelta <= -this.tabScrollingThreshold) {
      this.wheelDelta = 0;
      return this.pane.activateNextItem();
    } else if (this.wheelDelta >= this.tabScrollingThreshold) {
      this.wheelDelta = 0;
      return this.pane.activatePreviousItem();
    }
  }

  onMouseDown(event) {
    if (!this.pane.isDestroyed()) { this.pane.activate(); }

    const tab = this.tabForElement(event.target);
    if (!tab) { return; }

    if ((event.button === 2) || ((event.button === 0) && (event.ctrlKey === true))) {
      if (this.rightClickedTab) {
        this.rightClickedTab.element.classList.remove('right-clicked');
      }
      this.rightClickedTab = tab;
      this.rightClickedTab.element.classList.add('right-clicked');
      return event.preventDefault();
    } else if (event.button === 1) {
      // This prevents Chromium from activating "scroll mode" when
      // middle-clicking while some tabs are off-screen.
      return event.preventDefault();
    }
  }

  onClick(event) {
    const tab = this.tabForElement(event.target);
    if (!tab) {
      return;
    }

    event.preventDefault();
    if ((event.button === 2) || ((event.button === 0) && (event.ctrlKey === true))) {
      // Bail out early when receiving this event, because we have already
      // handled it in the mousedown handler.
      return;
    } else if ((event.button === 0) && !event.target.classList.contains('close-icon')) {
      return this.pane.activateItem(tab.item);
    } else if (event.button === 1) {
      return this.pane.destroyItem(tab.item);
    }
  }

  onDoubleClick(event) {
    let tab = this.tabForElement(event.target);
    if (tab) {
      return (typeof tab.item.terminatePendingState === 'function' ? tab.item.terminatePendingState() : undefined);
    } else if (event.target === this.element) {
      atom.commands.dispatch(this.element, 'application:new-file');
      return event.preventDefault();
    }
  }

  updateTabScrollingThreshold(value) {
    return this.tabScrollingThreshold = value;
  }

  updateTabScrolling(value) {
    if (value === 'platform') {
      return this.tabScrolling = (process.platform === 'linux');
    } else {
      return this.tabScrolling = value;
    }
  }

  browserWindowForId(id) {
    if (BrowserWindow == null) { ({
      BrowserWindow
    } = require('electron').remote); }

    return BrowserWindow.fromId(id);
  }

  moveItemBetweenPanes(fromPane, fromIndex, toPane, toIndex, item) {
    try {
      if (toPane === fromPane) {
        if (fromIndex < toIndex) { toIndex--; }
        toPane.moveItem(item, toIndex);
      } else {
        this.isItemMovingBetweenPanes = true;
        fromPane.moveItemToPane(item, toPane, toIndex--);
      }
      toPane.activateItem(item);
      return toPane.activate();
    } finally {
      this.isItemMovingBetweenPanes = false;
    }
  }

  removeDropTargetClasses() {
    let dropTarget;
    const workspaceElement = atom.workspace.getElement();
    for (dropTarget of workspaceElement.querySelectorAll('.tab-bar .is-drop-target')) {
      dropTarget.classList.remove('is-drop-target');
    }

    return (() => {
      const result = [];
      for (dropTarget of workspaceElement.querySelectorAll('.tab-bar .drop-target-is-after')) {
        result.push(dropTarget.classList.remove('drop-target-is-after'));
      }
      return result;
    })();
  }

  getDropTargetIndex(event) {
    const { target } = event;

    if (this.isPlaceholder(target)) {
      return;
    }

    const tabs = this.getTabs();
    let tab = this.tabForElement(target);
    if (tab == null) {
      tab = tabs[tabs.length - 1];
    }

    if (tab == null) {
      return 0;
    }

    const { left, width } = tab.element.getBoundingClientRect();
    const elementCenter = left + (width / 2);
    const elementIndex = tabs.indexOf(tab);

    if (event.pageX < elementCenter) {
      return elementIndex;
    } else {
      return elementIndex + 1;
    }
  }

  getPlaceholder() {
    if (this.placeholderEl != null) {
      return this.placeholderEl;
    }

    this.placeholderEl = document.createElement("li");
    this.placeholderEl.classList.add("placeholder");
    return this.placeholderEl;
  }

  removePlaceholder() {
    if (this.placeholderEl != null) {
      this.placeholderEl.remove();
    }
    return this.placeholderEl = null;
  }

  isPlaceholder(element) {
    return element.classList.contains('placeholder');
  }

  onMouseEnter() {
    for (let tab of this.getTabs()) {
      const { width } = tab.element.getBoundingClientRect();
      tab.element.style.maxWidth = width.toFixed(2) + 'px';
    }
  }

  onMouseLeave() {
    for (let tab of this.getTabs()) {
      tab.element.style.maxWidth = '';
    }
  }

  tabForElement(element) {
    let currentElement = element;
    while (currentElement != null) {
      if (this.tabsByElement.get(currentElement)) {
        return this.tabsByElement.get(currentElement);
      } else {
        currentElement = currentElement.parentElement;
      }
    }
  }

  isAtomTabEvent(event) {
    for (let item of event.dataTransfer.items) {
      if (item.type === 'atom-tab-event') {
        return true;
      }
    }

    return false;
  }

  itemIsAllowed(event, location) {
    for (let item of event.dataTransfer.items) {
      if ((item.type === 'allow-all-locations') || (item.type === `allowed-location-${location}`)) {
        return true;
      }
    }

    return false;
  }

}

module.exports = TabBarView;
