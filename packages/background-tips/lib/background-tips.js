const { Disposable } = require("atom");
const BackgroundTipsView = require("./background-tips-view");

module.exports = {
  activate() {
    this.defaultTips = require("./tips");
    this.addedTips = new Set();
    this.backgroundTipsView = new BackgroundTipsView(this);
  },

  deactivate() {
    this.backgroundTipsView.destroy();
    this.addedTips.clear();
  },

  getTips() {
    let all = [...this.defaultTips];
    for (const tips of this.addedTips) {
      all = all.concat(tips);
    }
    return all;
  },

  provideBackgroundTips() {
    return {
      addTips: (tips) => {
        this.addedTips.add(tips);
        this.backgroundTipsView.tipsChanged();
        return new Disposable(() => {
          this.addedTips.delete(tips);
          this.backgroundTipsView.tipsChanged();
        });
      },
    };
  },
};
