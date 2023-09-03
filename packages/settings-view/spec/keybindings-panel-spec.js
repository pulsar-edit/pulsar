
const path = require('path');
const KeybindingsPanel = require('../lib/keybindings-panel');

describe("KeybindingsPanel", function() {
  let [keyBindings, panel] = [];

  beforeEach(function() {
    expect(atom.keymaps).toBeDefined();
    const keySource = `${atom.getLoadSettings().resourcePath}${path.sep}keymaps`;
    keyBindings = [
      {
        source: keySource,
        keystrokes: 'ctrl-a',
        command: 'core:select-all',
        selector: '.editor, .platform-test'
      },
      {
        source: keySource,
        keystrokes: 'ctrl-u',
        command: 'core:undo',
        selector: ".platform-test"
      },
      {
        source: keySource,
        keystrokes: 'ctrl-u',
        command: 'core:undo',
        selector: ".platform-a, .platform-b"
      },
      {
        source: keySource,
        keystrokes: 'shift-\\ \\',
        command: 'core:undo',
        selector: '.editor'
      },
      {
        source: keySource,
        keystrokes: 'ctrl-z\'',
        command: 'core:toggle',
        selector: 'atom-text-editor[data-grammar~=\'css\']'
      }
    ];
    spyOn(atom.keymaps, 'getKeyBindings').andReturn(keyBindings);
    return panel = new KeybindingsPanel;
  });

  it("loads and displays core key bindings", function() {
    expect(panel.refs.keybindingRows.children.length).toBe(3);

    const row = panel.refs.keybindingRows.children[0];
    expect(row.querySelector('.keystroke').textContent).toBe('ctrl-a');
    expect(row.querySelector('.command').textContent).toBe('core:select-all');
    expect(row.querySelector('.source').textContent).toBe('Core');
    expect(row.querySelector('.selector').textContent).toBe('.editor, .platform-test');
  });

  describe("when a keybinding is copied", function() {
    describe("when the keybinding file ends in .cson", () => it("writes a CSON snippet to the clipboard", function() {
      spyOn(atom.keymaps, 'getUserKeymapPath').andReturn('keymap.cson');
      panel.element.querySelector('.copy-icon').click();
      expect(atom.clipboard.read()).toBe(`\
'.editor, .platform-test':
  'ctrl-a': 'core:select-all'\
`
      );
    }));

    describe("when the keybinding file ends in .json", () => it("writes a JSON snippet to the clipboard", function() {
      spyOn(atom.keymaps, 'getUserKeymapPath').andReturn('keymap.json');
      panel.element.querySelector('.copy-icon').click();
      expect(atom.clipboard.read()).toBe(`\
".editor, .platform-test": {
  "ctrl-a": "core:select-all"
}\
`
      );
    }));

    describe("when the keybinding contains special characters", function() {
      it("escapes the backslashes before copying", function() {
        spyOn(atom.keymaps, 'getUserKeymapPath').andReturn('keymap.cson');
        panel.element.querySelectorAll('.copy-icon')[2].click();
        expect(atom.clipboard.read()).toBe(`\
'.editor':
  'shift-\\\\ \\\\': 'core:undo'\
`
        );
      });

      it("escapes the single quotes before copying", function() {
        spyOn(atom.keymaps, 'getUserKeymapPath').andReturn('keymap.cson');
        panel.element.querySelectorAll('.copy-icon')[1].click();
        expect(atom.clipboard.read()).toBe(`\
'atom-text-editor[data-grammar~=\\'css\\']':
  'ctrl-z\\'': 'core:toggle'\
`
        );
      });
    });
  });

  describe("when the key bindings change", () => it("reloads the key bindings", function() {
    keyBindings.push({
      source: atom.keymaps.getUserKeymapPath(), keystrokes: 'ctrl-b', command: 'core:undo', selector: '.editor'});
    atom.keymaps.emitter.emit('did-reload-keymap');

    waitsFor("the new keybinding to show up in the keybinding panel", () => panel.refs.keybindingRows.children.length === 4);

    runs(function() {
      const row = panel.refs.keybindingRows.children[1];
      expect(row.querySelector('.keystroke').textContent).toBe('ctrl-b');
      expect(row.querySelector('.command').textContent).toBe('core:undo');
      expect(row.querySelector('.source').textContent).toBe('User');
      expect(row.querySelector('.selector').textContent).toBe('.editor');
    });
  }));

  describe("when searching key bindings", function() {
    it("find case-insensitive results", function() {
      keyBindings.push({
        source: `${atom.getLoadSettings().resourcePath}${path.sep}keymaps`, keystrokes: 'F11', command: 'window:toggle-full-screen', selector: 'body'});
      atom.keymaps.emitter.emit('did-reload-keymap');

      panel.filterKeyBindings(keyBindings, 'f11');

      expect(panel.refs.keybindingRows.children.length).toBe(1);

      const row = panel.refs.keybindingRows.children[0];
      expect(row.querySelector('.keystroke').textContent).toBe('F11');
      expect(row.querySelector('.command').textContent).toBe('window:toggle-full-screen');
      expect(row.querySelector('.source').textContent).toBe('Core');
      expect(row.querySelector('.selector').textContent).toBe('body');
    });

    it("perform a fuzzy match for each keyword", function() {
      panel.filterKeyBindings(keyBindings, 'core ctrl-a');

      expect(panel.refs.keybindingRows.children.length).toBe(1);

      const row = panel.refs.keybindingRows.children[0];
      expect(row.querySelector('.keystroke').textContent).toBe('ctrl-a');
      expect(row.querySelector('.command').textContent).toBe('core:select-all');
      expect(row.querySelector('.source').textContent).toBe('Core');
      expect(row.querySelector('.selector').textContent).toBe('.editor, .platform-test');
    });
  });
});
