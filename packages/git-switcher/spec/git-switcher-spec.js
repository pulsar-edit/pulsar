const fs = require("fs");
const os = require("os");
const path = require("path");

function makeWorkdir(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

async function initializeRepository(prefix) {
  const workingDirectory = makeWorkdir(prefix);
  const repository = await atom.repositories.initialize(workingDirectory, {
    initialBranch: "main",
  });
  const operations = repository.getOperations();
  await operations.setConfig("user.name", "Git Switcher Specs");
  await operations.setConfig("user.email", "specs@lumine.invalid");
  fs.writeFileSync(path.join(workingDirectory, "file.txt"), "content\n");
  await operations.stageFiles(["file.txt"]);
  await operations.commit("Initial commit");
  return { workingDirectory, repository };
}

describe("git-switcher", () => {
  let mainModule;
  let repoA;
  let repoB;

  beforeEach(async () => {
    await atom.packages.activatePackage("status-bar");
    mainModule = (await atom.packages.activatePackage("git-switcher")).mainModule;

    repoA = await initializeRepository("git-switcher-a-");
    repoB = await initializeRepository("git-switcher-b-");
    atom.repositories.setActiveRepository(repoA.repository);
    await repoA.repository.refreshStatusSnapshot();
    await repoB.repository.refreshStatusSnapshot();
  });

  afterEach(async () => {
    atom.repositories.setActiveRepository(null);
    atom.repositories.forget(repoA.repository);
    atom.repositories.forget(repoB.repository);
    await atom.packages.deactivatePackage("git-switcher");
    await atom.packages.deactivatePackage("status-bar");
  });

  it("shows the active repository and branch in the status bar", () => {
    const repositoryView = mainModule.repositoryStatusView;
    const branchView = mainModule.branchStatusView;
    repositoryView.update();
    branchView.update();

    expect(repositoryView.element.style.display).toBe("");
    expect(repositoryView.nameLabel.textContent).toBe(path.basename(repoA.workingDirectory));
    expect(branchView.branchLabel.textContent).toBe("main");

    atom.repositories.setActiveRepository(repoB.repository);
    expect(repositoryView.nameLabel.textContent).toBe(path.basename(repoB.workingDirectory));

    atom.repositories.setActiveRepository(repoB.repository, { pin: true });
    expect(repositoryView.icon.classList.contains("icon-lock")).toBe(true);
    expect(repositoryView.icon.classList.contains("icon-repo")).toBe(false);
    atom.repositories.setActiveRepository(null);
  });

  it("stays visible and reflects a context without a repository", () => {
    const repositoryView = mainModule.repositoryStatusView;
    const branchView = mainModule.branchStatusView;
    const outsideDir = makeWorkdir("git-switcher-outside-");
    spyOn(atom.repositories, "getActiveRepository").andReturn(null);
    spyOn(atom.repositories, "getActiveRepositoryContext").andReturn({
      repository: null,
      workingDirectory: outsideDir,
      pinned: false,
    });

    repositoryView.update();
    branchView.update();

    expect(repositoryView.element.style.display).toBe("");
    expect(repositoryView.element.classList.contains("no-repository")).toBe(true);
    expect(repositoryView.nameLabel.textContent).toBe(path.basename(outsideDir));
    expect(branchView.element.style.display).toBe("");
    expect(branchView.element.classList.contains("no-repository")).toBe(true);
    expect(branchView.branchLabel.textContent).toBe("No repository");

    // Returning to a repository clears the no-repo state.
    atom.repositories.getActiveRepository.andReturn(repoA.repository);
    atom.repositories.getActiveRepositoryContext.andReturn({
      repository: repoA.repository,
      workingDirectory: repoA.workingDirectory,
      pinned: false,
    });
    repositoryView.update();
    branchView.update();
    expect(repositoryView.element.classList.contains("no-repository")).toBe(false);
    expect(repositoryView.nameLabel.textContent).toBe(path.basename(repoA.workingDirectory));
    expect(branchView.element.classList.contains("no-repository")).toBe(false);
    expect(branchView.branchLabel.textContent).toBe("main");
  });

  it("cycles repositories with the mouse wheel and toggles the pin with middle click", () => {
    const repositoryView = mainModule.repositoryStatusView;
    const repositories = [repoA.repository, repoB.repository];
    spyOn(atom.repositories, "getRepositories").andReturn(repositories);

    const wheel = (deltaY) =>
      repositoryView.element.dispatchEvent(new WheelEvent("wheel", { deltaY, cancelable: true }));

    wheel(120);
    const second = atom.repositories.getActiveRepository();
    expect(repositories).toContain(second);
    expect(second).not.toBe(repoA.repository);

    wheel(120);
    expect(atom.repositories.getActiveRepository()).toBe(repoA.repository);

    wheel(-120);
    expect(atom.repositories.getActiveRepository()).toBe(second);

    // Small trackpad deltas accumulate instead of switching per event.
    wheel(20);
    expect(atom.repositories.getActiveRepository()).toBe(second);

    const middleClick = () =>
      repositoryView.element.dispatchEvent(
        new MouseEvent("auxclick", { button: 1, cancelable: true }),
      );
    expect(atom.repositories.isActiveRepositoryPinned()).toBe(false);
    middleClick();
    expect(atom.repositories.isActiveRepositoryPinned()).toBe(true);
    expect(atom.repositories.getActiveRepository()).toBe(second);
    middleClick();
    expect(atom.repositories.isActiveRepositoryPinned()).toBe(false);
  });

  it("switches the active repository through the repository picker", async () => {
    await mainModule.getRepositoryListView().toggle();
    const listView = mainModule.repositoryListView.selectListView;
    expect(listView.isVisible()).toBe(true);

    const items = listView.props.items;
    expect(items[0].auto).toBe(true);
    expect(items[0].repoName).toBe("Auto");
    const autoElement = listView.element.querySelector(".list-group li");
    expect(autoElement.querySelector(".secondary-line").textContent).toBe(
      "The active repository is updated based on the active editor.",
    );
    expect(items.slice(1).every((item) => item.current)).toBe(true);
    const target = items.find((item) => item.repository === repoB.repository);
    expect(target).toBeTruthy();
    listView.props.didConfirmSelection(target);

    expect(atom.repositories.getActiveRepository()).toBe(repoB.repository);
    expect(atom.repositories.isActiveRepositoryPinned()).toBe(true);
    expect(listView.isVisible()).toBe(false);

    await mainModule.getRepositoryListView().toggle();
    const auto = listView.props.items.find((item) => item.auto);
    listView.props.didConfirmSelection(auto);
    expect(atom.repositories.isActiveRepositoryPinned()).toBe(false);
  });

  it("checks out a branch through the branch picker", async () => {
    await repoA.repository.getOperations().checkout("feature", { createNew: true });
    await repoA.repository.getOperations().checkout("main");
    await repoA.repository.refreshRefsSnapshot();

    await mainModule.getBranchListView().toggle();
    const listView = mainModule.branchListView.selectListView;
    expect(listView.isVisible()).toBe(true);

    const items = listView.props.items;
    expect(items.slice(0, 3).map((item) => item.branch)).toEqual([
      "Create new branch...",
      "Create new branch from...",
      "Checkout detached...",
    ]);
    expect(
      items.filter((item) => !item.action).every((item) => item.repository === repoA.repository),
    ).toBe(true);
    const target = items.find((item) => item.branch === "feature");
    expect(target).toBeTruthy();
    const didChangeRefs = new Promise((resolve) => {
      const subscription = repoA.repository.onDidChangeRefsSnapshot(() => {
        subscription.dispose();
        resolve();
      });
    });
    listView.props.didConfirmSelection(target);
    await didChangeRefs;
    expect(repoA.repository.getRefsSnapshot().head.name).toBe("feature");
  });

  it("creates branches from HEAD or another ref and checks out detached", async () => {
    const branchListView = mainModule.getBranchListView();
    const operations = repoA.repository.getOperations();
    spyOn(operations, "checkout").andReturn(Promise.resolve());

    branchListView.performAction("create");
    const nameInputDialogView = branchListView.branchNameDialog.inputDialogView;
    expect(nameInputDialogView.props.infoMessage).toBe("Please provide a new branch name");
    expect(nameInputDialogView.refs.queryEditor.getPlaceholderText()).toBe("Branch name");
    nameInputDialogView.refs.queryEditor.setText("new-branch");
    await nameInputDialogView.props.didConfirm();
    expect(operations.checkout).toHaveBeenCalledWith("new-branch", { createNew: true });

    await branchListView.showReferenceList("create-from", repoA.repository);
    const main = branchListView.referenceListView.props.items.find(
      (item) => item.reference === "main",
    );
    branchListView.confirmReference(main);
    nameInputDialogView.refs.queryEditor.setText("from-main");
    await nameInputDialogView.props.didConfirm();
    expect(operations.checkout).toHaveBeenCalledWith("from-main", {
      createNew: true,
      startPoint: "main",
    });

    await branchListView.showReferenceList("detach", repoA.repository);
    branchListView.confirmReference(
      branchListView.referenceListView.props.items.find((item) => item.reference === "main"),
    );
    expect(operations.checkout).toHaveBeenCalledWith("main", { detach: true });
  });
});
