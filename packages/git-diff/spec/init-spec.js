const path = require('path');
const fs = require('fs-plus');
const temp = require('temp').track();

const commands = [
  'git-diff:toggle-diff-list',
  'git-diff:move-to-next-diff',
  'git-diff:move-to-previous-diff'
];

describe('git-diff', () => {
  let editor, element;

  beforeEach(() => {
    const projectPath = temp.mkdirSync('git-diff-spec-');
    fs.copySync(path.join(__dirname, 'fixtures', 'working-dir'), projectPath);
    fs.moveSync(
      path.join(projectPath, 'git.git'),
      path.join(projectPath, '.git')
    );
    core.project.setPaths([projectPath]);

    jasmine.attachToDOM(core.workspace.getElement());

    waitsForPromise(() => core.workspace.open('sample.js'));

    runs(() => {
      editor = core.workspace.getActiveTextEditor();
      element = core.views.getView(editor);
    });
  });

  describe('When the module is deactivated', () => {
    it('removes all registered command hooks after deactivation.', () => {
      waitsForPromise(() => core.packages.activatePackage('git-diff'));
      waitsForPromise(() => core.packages.deactivatePackage('git-diff'));
      runs(() => {
        // NOTE: don't use enable and disable from the Public API.
        expect(core.packages.isPackageActive('git-diff')).toBe(false);

        core.commands
          .findCommands({ target: element })
          .filter(({ name }) => commands.includes(name))
          .forEach(command => expect(commands).not.toContain(command.name));
      });
    });
  });
});
