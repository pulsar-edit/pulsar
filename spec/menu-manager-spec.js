const path = require('path');
const MenuManager = require('../src/menu-manager');

describe('MenuManager', function() {
  let menu = null;

  beforeEach(function() {
    menu = new MenuManager({
      keymapManager: atom.keymaps,
      packageManager: atom.packages,
      i18n: atom.i18n
    });
    spyOn(menu, 'sendToBrowserProcess'); // Do not modify Atom's actual menus
    menu.initialize({ resourcePath: atom.getLoadSettings().resourcePath });
  });

  describe('::add(items)', function() {
    it('can add new menus that can be removed with the returned disposable', function() {
      const disposable = menu.add([
        { label: 'A', submenu: [{ label: 'B', command: 'b' }] }
      ]);
      expect(menu.template).toEqual([
        {
          label: 'A',
          id: 'A',
          submenu: [{ label: 'B', id: 'B', command: 'b' }]
        }
      ]);
      disposable.dispose();
      expect(menu.template).toEqual([]);
    });

    it('can add submenu items to existing menus that can be removed with the returned disposable', function() {
      const disposable1 = menu.add([
        { label: 'A', submenu: [{ label: 'B', command: 'b' }] }
      ]);
      const disposable2 = menu.add([
        {
          label: 'A',
          submenu: [{ label: 'C', submenu: [{ label: 'D', command: 'd' }] }]
        }
      ]);
      const disposable3 = menu.add([
        {
          label: 'A',
          submenu: [{ label: 'C', submenu: [{ label: 'E', command: 'e' }] }]
        }
      ]);

      expect(menu.template).toEqual([
        {
          label: 'A',
          id: 'A',
          submenu: [
            { label: 'B', id: 'B', command: 'b' },
            {
              label: 'C',
              id: 'C',
              submenu: [
                { label: 'D', id: 'D', command: 'd' },
                { label: 'E', id: 'E', command: 'e' }
              ]
            }
          ]
        }
      ]);

      disposable3.dispose();
      expect(menu.template).toEqual([
        {
          label: 'A',
          id: 'A',
          submenu: [
            { label: 'B', id: 'B', command: 'b' },
            {
              label: 'C',
              id: 'C',
              submenu: [{ label: 'D', id: 'D', command: 'd' }]
            }
          ]
        }
      ]);

      disposable2.dispose();
      expect(menu.template).toEqual([
        {
          label: 'A',
          id: 'A',
          submenu: [{ label: 'B', id: 'B', command: 'b' }]
        }
      ]);

      disposable1.dispose();
      expect(menu.template).toEqual([]);
    });

    it('does not add duplicate labels to the same menu', function() {
      const originalItemCount = menu.template.length;
      menu.add([{ label: 'A', submenu: [{ label: 'B', command: 'b' }] }]);
      menu.add([{ label: 'A', submenu: [{ label: 'B', command: 'b' }] }]);
      expect(menu.template[originalItemCount]).toEqual({
        label: 'A',
        id: 'A',
        submenu: [{ label: 'B', id: 'B', command: 'b' }]
      });
    });

    it('translates LocaleLabels', function() {
      const I18n = require("../src/i18n.js");
      atom.i18n.localeFallbackList = I18n.localeNegotiation(
        "es-MX",
        [ "zh-Hant" ]
      );
      atom.i18n.addStrings({
        example: {
          stringKey: "Hello Pulsar",
          otherStringKey: "Goodbye Pulsar"
        }
      }, "en");

      const disposable = menu.add([
        { label: '%example.stringKey%', submenu: [{ label: '%example.otherStringKey%', command: 'b' }] }
      ]);
      expect(menu.template).toEqual([
        {
          label: 'Hello Pulsar',
          id: 'Hello Pulsar',
          submenu: [{ label: 'Goodbye Pulsar', id: 'Goodbye Pulsar', command: 'b' }]
        }
      ]);
      disposable.dispose();
      expect(menu.template).toEqual([]);
    });
  });

  describe('::update()', function() {
    const originalPlatform = process.platform;
    afterEach(() =>
      Object.defineProperty(process, 'platform', { value: originalPlatform })
    );

    it('sends the current menu template and associated key bindings to the browser process', function() {
      menu.add([{ label: 'A', submenu: [{ label: 'B', command: 'b' }] }]);
      atom.keymaps.add('test', { 'atom-workspace': { 'ctrl-b': 'b' } });
      menu.update();
      advanceClock(1);
      expect(menu.sendToBrowserProcess.argsForCall[0][1]['b']).toEqual([
        'ctrl-b'
      ]);
    });

    it('omits key bindings that are mapped to unset! in any context', function() {
      // it would be nice to be smarter about omitting, but that would require a much
      // more dynamic interaction between the currently focused element and the menu
      menu.add([{ label: 'A', submenu: [{ label: 'B', command: 'b' }] }]);
      atom.keymaps.add('test', { 'atom-workspace': { 'ctrl-b': 'b' } });
      atom.keymaps.add('test', { 'atom-text-editor': { 'ctrl-b': 'unset!' } });
      advanceClock(1);
      expect(menu.sendToBrowserProcess.argsForCall[0][1]['b']).toBeUndefined();
    });

    it('omits key bindings that could conflict with AltGraph characters on macOS', function() {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      menu.add([
        {
          label: 'A',
          submenu: [
            { label: 'B', command: 'b' },
            { label: 'C', command: 'c' },
            { label: 'D', command: 'd' }
          ]
        }
      ]);

      atom.keymaps.add('test', {
        'atom-workspace': {
          'alt-b': 'b',
          'alt-shift-C': 'c',
          'alt-cmd-d': 'd'
        }
      });

      advanceClock(1);
      expect(menu.sendToBrowserProcess.argsForCall[0][1]['b']).toBeUndefined();
      expect(menu.sendToBrowserProcess.argsForCall[0][1]['c']).toBeUndefined();
      expect(menu.sendToBrowserProcess.argsForCall[0][1]['d']).toEqual([
        'alt-cmd-d'
      ]);
    });

    it('omits key bindings that could conflict with AltGraph characters on Windows', function() {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      menu.add([
        {
          label: 'A',
          submenu: [
            { label: 'B', command: 'b' },
            { label: 'C', command: 'c' },
            { label: 'D', command: 'd' }
          ]
        }
      ]);

      atom.keymaps.add('test', {
        'atom-workspace': {
          'ctrl-alt-b': 'b',
          'ctrl-alt-shift-C': 'c',
          'ctrl-alt-cmd-d': 'd'
        }
      });

      advanceClock(1);
      expect(menu.sendToBrowserProcess.argsForCall[0][1]['b']).toBeUndefined();
      expect(menu.sendToBrowserProcess.argsForCall[0][1]['c']).toBeUndefined();
      expect(menu.sendToBrowserProcess.argsForCall[0][1]['d']).toEqual([
        'ctrl-alt-cmd-d'
      ]);
    });
  });

  it('updates the application menu when a keymap is reloaded', function() {
    spyOn(menu, 'update');
    const keymapPath = path.join(
      __dirname,
      'fixtures',
      'packages',
      'package-with-keymaps',
      'keymaps',
      'keymap-1.cson'
    );
    atom.keymaps.reloadKeymap(keymapPath);
    expect(menu.update).toHaveBeenCalled();
  });
});
