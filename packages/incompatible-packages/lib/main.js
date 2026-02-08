const { Disposable, CompositeDisposable } = require('atom');
const VIEW_URI = require('./view-uri');

let disposables = null;

function activate() {
  disposables = new CompositeDisposable();

  disposables.add(
    atom.workspace.addOpener(uri => {
      if (uri === VIEW_URI) {
        return deserializeIncompatiblePackagesComponent();
      }
    })
  );

  disposables.add(
    atom.commands.add('atom-workspace', {
      'incompatible-packages:view': () => {
        atom.workspace.open(VIEW_URI);
      }
    })
  );
}

function deactivate() {
  disposables.dispose();
}

function consumeStatusBar(statusBar) {
  let incompatibleCount = 0;
  for (let pack of atom.packages.getLoadedPackages()) {
    if (!pack.isCompatible()) incompatibleCount++;
  }

  if (incompatibleCount > 0) {
    let icon = createIcon(incompatibleCount);
    let tile = statusBar.addRightTile({ item: icon, priority: 200 });
    icon.element.addEventListener('click', () => {
      atom.commands.dispatch(icon.element, 'incompatible-packages:view');
    });
    disposables.add(new Disposable(() => tile.destroy()));
  }
}

function deserializeIncompatiblePackagesComponent() {
  const IncompatiblePackagesComponent = require('./incompatible-packages-component');
  return new IncompatiblePackagesComponent(atom.packages);
}

function createIcon(count) {
  const StatusIconComponent = require('./status-icon-component');
  return new StatusIconComponent({ count });
}

module.exports = { activate, deactivate, consumeStatusBar, deserializeIncompatiblePackagesComponent };
