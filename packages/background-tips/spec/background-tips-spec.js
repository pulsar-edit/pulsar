const {
  it,
  fit,
  ffit,
  afterEach,
  beforeEach,
} = require("./async-spec-helpers");

describe("BackgroundTips", () => {
  let workspaceElement;

  const activatePackage = async () => {
    const { mainModule } = await atom.packages.activatePackage(
      "background-tips"
    );
    return mainModule.backgroundTipsView;
  };

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);
    jasmine.useMockClock();
  });

  describe("when the package is activated when there is only one pane", () => {
    beforeEach(() => {
      expect(atom.workspace.getCenter().getPanes().length).toBe(1);
    });

    describe("when the pane is empty", () => {
      it("attaches the view after a delay", async () => {
        expect(atom.workspace.getActivePane().getItems().length).toBe(0);

        const backgroundTipsView = await activatePackage();
        expect(backgroundTipsView.element.parentNode).toBeFalsy();
        advanceClock(backgroundTipsView.startDelay + 1);
        expect(backgroundTipsView.element.parentNode).toBeTruthy();
      });
    });

    describe("when the pane is not empty", () => {
      it("does not attach the view", async () => {
        await atom.workspace.open();

        const backgroundTipsView = await activatePackage();
        advanceClock(backgroundTipsView.startDelay + 1);
        expect(backgroundTipsView.element.parentNode).toBeFalsy();
      });
    });

    describe("when a second pane is created", () => {
      it("detaches the view", async () => {
        const backgroundTipsView = await activatePackage();
        advanceClock(backgroundTipsView.startDelay + 1);
        expect(backgroundTipsView.element.parentNode).toBeTruthy();

        atom.workspace.getActivePane().splitRight();
        expect(backgroundTipsView.element.parentNode).toBeFalsy();
      });
    });
  });

  describe("when the package is activated when there are multiple panes", () => {
    beforeEach(() => {
      atom.workspace.getActivePane().splitRight();
      expect(atom.workspace.getCenter().getPanes().length).toBe(2);
    });

    it("does not attach the view", async () => {
      const backgroundTipsView = await activatePackage();
      advanceClock(backgroundTipsView.startDelay + 1);
      expect(backgroundTipsView.element.parentNode).toBeFalsy();
    });

    describe("when all but the last pane is destroyed", () => {
      it("attaches the view", async () => {
        const backgroundTipsView = await activatePackage();
        atom.workspace.getActivePane().destroy();
        advanceClock(backgroundTipsView.startDelay + 1);
        expect(backgroundTipsView.element.parentNode).toBeTruthy();

        atom.workspace.getActivePane().splitRight();
        expect(backgroundTipsView.element.parentNode).toBeFalsy();

        atom.workspace.getActivePane().destroy();
        expect(backgroundTipsView.element.parentNode).toBeTruthy();
      });
    });
  });

  describe("when the view is attached", () => {
    let backgroundTipsView;

    beforeEach(async () => {
      expect(atom.workspace.getCenter().getPanes().length).toBe(1);

      backgroundTipsView = await activatePackage();
      advanceClock(backgroundTipsView.startDelay);
      advanceClock(backgroundTipsView.fadeDuration);
    });

    it("has text in the message", () => {
      expect(backgroundTipsView.element.parentNode).toBeTruthy();
      expect(backgroundTipsView.message.textContent).toBeTruthy();
    });

    it("changes text in the message", async () => {
      const oldText = backgroundTipsView.message.textContent;
      advanceClock(backgroundTipsView.displayDuration);
      advanceClock(backgroundTipsView.fadeDuration);
      expect(backgroundTipsView.message.textContent).not.toEqual(oldText);
    });
  });

});
