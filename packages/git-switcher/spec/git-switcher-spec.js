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
    expect(repositoryView.pinIcon.style.display).toBe("");
    atom.repositories.setActiveRepository(null);
  });

  it("hides the repository tile when only one repository is known", () => {
    const repositoryView = mainModule.repositoryStatusView;
    // The spec environment knows ambient repositories; pin the census.
    spyOn(atom.repositories, "getRepositories").andReturn([repoA.repository]);
    repositoryView.update();
    expect(repositoryView.element.style.display).toBe("none");

    atom.repositories.getRepositories.andReturn([repoA.repository, repoB.repository]);
    repositoryView.update();
    expect(repositoryView.element.style.display).toBe("");
  });

  it("switches the active repository through the repository picker", async () => {
    await mainModule.getRepositoryListView().toggle(null);
    const listView = mainModule.repositoryListView.selectListView;
    expect(listView.isVisible()).toBe(true);
    const target = listView.props.items.find((item) => item.repository === repoB.repository);
    expect(target).toBeTruthy();
    listView.props.didConfirmSelection(target);
    expect(atom.repositories.getActiveRepository()).toBe(repoB.repository);
    expect(listView.isVisible()).toBe(false);
  });

  it("checks out a branch through the branch picker", async () => {
    await repoA.repository.getOperations().checkout("feature", { createNew: true });
    await repoA.repository.getOperations().checkout("main");
    await repoA.repository.refreshRefsSnapshot();

    await mainModule.getBranchListView().toggle(null);
    const listView = mainModule.branchListView.selectListView;
    const target = listView.props.items.find((item) => item.name === "feature");
    expect(target).toBeTruthy();
    listView.props.didConfirmSelection(target);

    await new Promise((resolve) => {
      const subscription = repoA.repository.onDidChangeRefsSnapshot(() => {
        subscription.dispose();
        resolve();
      });
    });
    expect(repoA.repository.getRefsSnapshot().head.name).toBe("feature");
  });

  it("switches repository and branch together through the fuzzy switch list", async () => {
    await repoB.repository.getOperations().checkout("topic", { createNew: true });
    await repoB.repository.getOperations().checkout("main");
    await repoB.repository.refreshRefsSnapshot();

    await mainModule.getSwitchListView().toggle();
    const listView = mainModule.switchListView.selectListView;
    expect(listView.isVisible()).toBe(true);

    const items = listView.props.items;
    // The active repository's rows come first, current branch first per repo.
    expect(items[0].repository).toBe(repoA.repository);
    expect(items[0].current).toBe(true);

    const target = items.find(
      (item) => item.repository === repoB.repository && item.branch === "topic",
    );
    expect(target).toBeTruthy();
    listView.props.didConfirmSelection(target);

    expect(atom.repositories.getActiveRepository()).toBe(repoB.repository);
    await new Promise((resolve) => {
      const subscription = repoB.repository.onDidChangeRefsSnapshot(() => {
        subscription.dispose();
        resolve();
      });
    });
    expect(repoB.repository.getRefsSnapshot().head.name).toBe("topic");
  });
});
