const path = require('path');
const fs = require('fs-plus');
const temp = require('temp').track();

describe('git-diff:toggle-diff-list', () => {
  let diffListView, editor;

  beforeEach(() => {
    const projectPath = temp.mkdirSync('git-diff-spec-');
    fs.copySync(path.join(__dirname, 'fixtures', 'working-dir'), projectPath);
    fs.moveSync(
      path.join(projectPath, 'git.git'),
      path.join(projectPath, '.git')
    );
    core.project.setPaths([projectPath]);

    jasmine.attachToDOM(core.workspace.getElement());

    waitsForPromise(() => core.packages.activatePackage('git-diff'));

    waitsForPromise(() => core.workspace.open('sample.js'));

    runs(() => {
      editor = core.workspace.getActiveTextEditor();
      editor.setCursorBufferPosition([8, 30]);
      editor.insertText('a');
      core.commands.dispatch(editor.getElement(), 'git-diff:toggle-diff-list');
    });

    waitsFor(() => {
      diffListView = document.querySelector('.diff-list-view');
      return diffListView && diffListView.querySelectorAll('li').length > 0;
    });
  });

  it('shows a list of all diff hunks', () => {
    diffListView = document.querySelector('.diff-list-view ol');
    expect(diffListView.textContent).toBe(
      'while (items.length > 0) {a-9,1 +9,1'
    );
  });

  it('moves the cursor to the selected hunk', () => {
    editor.setCursorBufferPosition([0, 0]);
    core.commands.dispatch(
      document.querySelector('.diff-list-view'),
      'core:confirm'
    );
    expect(editor.getCursorBufferPosition()).toEqual([8, 4]);
  });
});
