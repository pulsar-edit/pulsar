const { CompositeDisposable } = require("atom");
const BackgroundTipsView = require("./background-tips-view");

module.exports = {
  activate() {
    this.backgroundTipsView = new BackgroundTipsView();
    this.disposables = new CompositeDisposable();
    for (let pkg of atom.packages.getLoadedPackages()) {
      this.backgroundTipsView.addPackageTips(pkg);
    }
    this.disposables.add(
      atom.packages.onDidLoadPackage((pkg) => {
        this.backgroundTipsView.addPackageTips(pkg);
      }),
      atom.packages.onDidUnloadPackage((pkg) => {
        this.backgroundTipsView.removePackageTips(pkg);
      }),
    );
  },

  deactivate() {
    this.disposables.dispose();
    this.backgroundTipsView.destroy();
  },
};
