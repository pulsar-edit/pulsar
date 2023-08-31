
const SettingsPanel = require('../lib/settings-panel');
const _ = require('underscore-plus');

describe("SettingsPanel", () => {
  let settingsPanel = null;

  describe("sorted settings", () => {
    beforeEach(() => {
      const config = {
        type: 'object',
        properties: {
          bar: {
            title: 'Bar',
            description: 'The bar setting',
            type: 'boolean',
            default: true
          },
          haz: {
            title: 'Haz',
            description: 'The haz setting',
            type: 'string',
            default: 'haz'
          },
          zing: {
            title: 'Zing',
            description: 'The zing setting',
            type: 'string',
            default: 'zing',
            order: 1
          },
          zang: {
            title: 'Zang',
            description: 'The baz setting',
            type: 'string',
            default: 'zang',
            order: 100
          },
          enum: {
            title: 'An enum',
            type: 'string',
            default: 'one',
            enum: [
              {value: 'one', description: 'One'},
              'Two'
            ]
          },
          radio: {
            title: 'An enum with radio buttons',
            radio: true,
            type: 'string',
            default: 'Two',
            enum: [
              {value: 'one', description: 'One'},
              'Two'
            ]
          }
        }
      };
      atom.config.setSchema("foo", config);
      atom.config.setDefaults("foo", {gong: 'gong'});
      expect(_.size(atom.config.get('foo'))).toBe(7);
      settingsPanel = new SettingsPanel({namespace: "foo", includeTitle: false});
    });

    it("sorts settings by order and then alphabetically by the key", () => {
      const settings = atom.config.get('foo');
      expect(_.size(settings)).toBe(7);
      const sortedSettings = settingsPanel.sortSettings("foo", settings);
      expect(sortedSettings[0]).toBe('zing');
      expect(sortedSettings[1]).toBe('zang');
      expect(sortedSettings[2]).toBe('bar');
      expect(sortedSettings[3]).toBe('enum');
      expect(sortedSettings[4]).toBe('gong');
      expect(sortedSettings[5]).toBe('haz');
      expect(sortedSettings[6]).toBe('radio');
    });

    it("gracefully deals with a null settings object", () => {
      const sortedSettings = settingsPanel.sortSettings("foo", null);
      expect(sortedSettings).not.toBeNull;
      expect(_.size(sortedSettings)).toBe(0);
    });

    it("presents enum options with their descriptions", () => {
      const select = settingsPanel.element.querySelector('#foo\\.enum');
      const pairs = (Array.from(select.children).map((opt) => [opt.value, opt.innerText]));
      expect(pairs).toEqual([['one', 'One'], ['Two', 'Two']]);
    });

    it("presents radio options with their descriptions", () => {
      const radio = settingsPanel.element.querySelector('#foo\\.radio');
      const options = (() => {
        const result = [];
        for (let label of Array.from(radio.querySelectorAll('label'))) {
          const button = label.querySelector('input[type=radio][name="foo.radio"]');
          result.push([button.id, button.value, label.innerText]);
        }
        return result;
      })();
      expect(options).toEqual([['foo.radio[one]', 'one', 'One'], ['foo.radio[Two]', 'Two', 'Two']]);
    });
  });

  describe('default settings', () => {
    beforeEach(() => {
      const config = {
        type: 'object',
        properties: {
          haz: {
            name: 'haz',
            title: 'Haz',
            description: 'The haz setting',
            type: 'string',
            default: 'haz'
          },
          qux: {
            name: 'qux',
            title: 'Qux',
            description: 'The qux setting',
            type: 'string',
            default: 'a',
            enum: [
              {value: 'a', description: 'Alice'},
              {value: 'b', description: 'Bob'}
            ]
          },
          testZero: {
            name: 'testZero',
            title: 'Test Zero',
            description: 'Setting for testing zero as a default',
            type: 'integer',
            default: 0
          },
          radio: {
            title: 'An enum with radio buttons',
            radio: true,
            type: 'string',
            default: 'Two',
            enum: [
              {value: 'one', description: 'One'},
              'Two',
              'Three'
            ]
          }
        }
      };
      atom.config.setSchema("foo", config);
      atom.config.setDefaults("foo", {gong: 'gong'});
      expect(_.size(atom.config.get('foo'))).toBe(5);
      settingsPanel = new SettingsPanel({namespace: "foo", includeTitle: false});
    });

    it('ensures default stays default', () => {
      expect(settingsPanel.getDefault('foo.haz')).toBe('haz');
      expect(settingsPanel.isDefault('foo.haz')).toBe(true);
      settingsPanel.set('foo.haz', 'haz');
      expect(settingsPanel.isDefault('foo.haz')).toBe(true);
    });

    it('can be overwritten', () => {
      expect(settingsPanel.getDefault('foo.haz')).toBe('haz');
      expect(settingsPanel.isDefault('foo.haz')).toBe(true);
      settingsPanel.set('foo.haz', 'newhaz');
      expect(settingsPanel.isDefault('foo.haz')).toBe(false);
      expect(atom.config.get('foo.haz')).toBe('newhaz');
    });

    it("ignores project-specific overrides", () => {
      atom.project.replace({
        originPath: 'TEST',
        config: {
          foo: {
            haz: 'newhaz'
          }
        }
      });
      expect(settingsPanel.isDefault('foo.haz')).toBe(true);
      expect(atom.config.get('foo.haz')).toBe('newhaz');
    });

    it('has a tooltip showing the default value', () => {
      const hazEditor = settingsPanel.element.querySelector('[id="foo.haz"]');
      const tooltips = atom.tooltips.findTooltips(hazEditor);
      expect(tooltips).toHaveLength(1);
      const {
        title
      } = tooltips[0].options;
      expect(title).toBe("Default: haz");
    });

    it('has a tooltip showing the description of the default value', () => {
      const quxEditor = settingsPanel.element.querySelector('[id="foo.qux"]');
      const tooltips = atom.tooltips.findTooltips(quxEditor);
      expect(tooltips).toHaveLength(1);
      const {
        title
      } = tooltips[0].options;
      expect(title).toBe("Default: Alice");
    });

    // Regression test for #783
    it('allows 0 to be a default', () => {
      const zeroEditor = settingsPanel.element.querySelector('[id="foo.testZero"]');
      expect(zeroEditor.getModel().getText()).toBe('');
      expect(zeroEditor.getModel().getPlaceholderText()).toBe('Default: 0');

      expect(settingsPanel.getDefault('foo.testZero')).toBe(0);
      expect(settingsPanel.isDefault('foo.testZero')).toBe(true);

      settingsPanel.set('foo.testZero', 15);
      expect(settingsPanel.isDefault('foo.testZero')).toBe(false);

      settingsPanel.set('foo.testZero', 0);
      expect(settingsPanel.isDefault('foo.testZero')).toBe(true);
    });

    it("selects the default choice for radio options", () => {
      expect(settingsPanel.getDefault('foo.radio')).toBe('Two');
      settingsPanel.set('foo.radio', 'Two');
      expect(settingsPanel.element.querySelector('#foo\\.radio\\[Two\\]')).toBeChecked();
    });

    describe('scoped settings', () => {
      beforeEach(() => {
        const schema = {
          scopes: {
            '.source.python': {
              default: 4
            }
          }
        };

        atom.config.setScopedDefaultsFromSchema('editor.tabLength', schema);
        expect(atom.config.get('editor.tabLength')).toBe(2);
      });

      it('displays the scoped default', () => {
        settingsPanel = new SettingsPanel({namespace: "editor", includeTitle: false, scopeName: '.source.python'});
        const tabLengthEditor = settingsPanel.element.querySelector('[id="editor.tabLength"]');
        expect(tabLengthEditor.getModel().getText()).toBe('');
        expect(tabLengthEditor.getModel().getPlaceholderText()).toBe('Default: 4');
      });

      it('allows the scoped setting to be changed to its normal default if the unscoped value is different', () => {
        atom.config.set('editor.tabLength', 8);

        settingsPanel = new SettingsPanel({namespace: "editor", includeTitle: false, scopeName: '.source.js'});
        const tabLengthEditor = settingsPanel.element.querySelector('[id="editor.tabLength"]');
        expect(tabLengthEditor.getModel().getText()).toBe('');
        expect(tabLengthEditor.getModel().getPlaceholderText()).toBe('Default: 8');

        // This is the unscoped default, but it differs from the current unscoped value
        settingsPanel.set('editor.tabLength', 2);
        expect(tabLengthEditor.getModel().getText()).toBe('2');
        expect(atom.config.get('editor.tabLength', {scope: ['source.js']})).toBe(2);
      });

      it('allows the scoped setting to be changed to the unscoped default if it is different', () => {
        settingsPanel = new SettingsPanel({namespace: "editor", includeTitle: false, scopeName: '.source.python'});
        const tabLengthEditor = settingsPanel.element.querySelector('[id="editor.tabLength"]');
        expect(tabLengthEditor.getModel().getText()).toBe('');
        expect(tabLengthEditor.getModel().getPlaceholderText()).toBe('Default: 4');

        // This is the unscoped default, but it differs from the scoped default
        settingsPanel.set('editor.tabLength', 2);
        expect(tabLengthEditor.getModel().getText()).toBe('2');
        expect(atom.config.get('editor.tabLength', {scope: ['source.python']})).toBe(2);
      });
    });
  });

  describe('grouped settings', () => {
    beforeEach(() => {
      const config = {
        type: 'object',
        properties: {
          barGroup: {
            type: 'object',
            title: 'Bar group',
            description: 'description of bar group',
            properties: {
              bar: {
                title: 'Bar',
                description: 'The bar setting',
                type: 'boolean',
                default: false
              }
            }
          },
          bazGroup: {
            type: 'object',
            collapsed: true,
            properties: {
              baz: {
                title: 'Baz',
                description: 'The baz setting',
                type: 'boolean',
                default: false
              }
            }
          },
          zing: {
            type: 'string',
            default: ''
          }
        }
      };
      atom.config.setSchema('foo', config);
      expect(_.size(atom.config.get('foo'))).toBe(3);
      settingsPanel = new SettingsPanel({namespace: 'foo', includeTitle: false});
    });

    it('ensures that only grouped settings have a group title', () => {
      expect(settingsPanel.element.querySelectorAll('.section-container > .section-body')).toHaveLength(1);
      const controlGroups = settingsPanel.element.querySelectorAll('.section-body > .control-group');
      expect(controlGroups).toHaveLength(3);
      expect(controlGroups[0].querySelectorAll('.sub-section .sub-section-heading')).toHaveLength(1);
      expect(controlGroups[0].querySelector('.sub-section .sub-section-heading').textContent).toBe('Bar group');
      expect(controlGroups[0].querySelectorAll('.sub-section .sub-section-body')).toHaveLength(1);
      let subsectionBody = controlGroups[0].querySelector('.sub-section .sub-section-body');
      expect(subsectionBody.querySelectorAll('.control-group')).toHaveLength(1);
      expect(controlGroups[1].querySelectorAll('.sub-section .sub-section-heading')).toHaveLength(1);
      expect(controlGroups[1].querySelector('.sub-section .sub-section-heading').textContent).toBe('Baz Group');
      expect(controlGroups[1].querySelectorAll('.sub-section .sub-section-body')).toHaveLength(1);
      subsectionBody = controlGroups[1].querySelector('.sub-section .sub-section-body');
      expect(subsectionBody.querySelectorAll('.control-group')).toHaveLength(1);
      expect(controlGroups[2].querySelectorAll('.sub-section')).toHaveLength(0);
      expect(controlGroups[2].querySelectorAll('.sub-section-heading')).toHaveLength(0);
    });

    it('ensures grouped settings are collapsable', () => {
      expect(settingsPanel.element.querySelectorAll('.section-container > .section-body')).toHaveLength(1);
      const controlGroups = settingsPanel.element.querySelectorAll('.section-body > .control-group');
      expect(controlGroups).toHaveLength(3);
      // Bar group
      expect(controlGroups[0].querySelectorAll('.sub-section .sub-section-heading')).toHaveLength(1);
      expect(controlGroups[0].querySelector('.sub-section .sub-section-heading').classList.contains('has-items')).toBe(true);
      // Baz Group
      expect(controlGroups[1].querySelectorAll('.sub-section .sub-section-heading')).toHaveLength(1);
      expect(controlGroups[1].querySelector('.sub-section .sub-section-heading').classList.contains('has-items')).toBe(true);
      // Should be already collapsed
      expect(controlGroups[1].querySelector('.sub-section .sub-section-heading').parentElement.classList.contains('collapsed')).toBe(true);
    });

    it('ensures grouped settings can have a description', () => {
      expect(settingsPanel.element.querySelectorAll('.section-container > .section-body')).toHaveLength(1);
      const controlGroups = settingsPanel.element.querySelectorAll('.section-body > .control-group');
      expect(controlGroups).toHaveLength(3);
      expect(controlGroups[0].querySelectorAll('.sub-section > .setting-description')).toHaveLength(1);
      expect(controlGroups[0].querySelector('.sub-section > .setting-description').textContent).toBe('description of bar group');
    });
  });

  describe('settings validation', () => {
    beforeEach(() => {
      const config = {
        type: 'object',
        properties: {
          minMax: {
            name: 'minMax',
            title: 'Min max',
            description: 'The minMax setting',
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          },
          commaValueArray: {
            name: 'commaValueArray',
            title: 'Comma value in array',
            description: 'An array with a comma value',
            type: 'array',
            default: []
          }
        }
      };

      atom.config.setSchema('foo', config);
      settingsPanel = new SettingsPanel({namespace: 'foo', includeTitle: false});
    });

    it('prevents setting a value below the minimum', () => {
      const minMaxEditor = settingsPanel.element.querySelector('[id="foo.minMax"]');
      minMaxEditor.getModel().setText('0');
      advanceClock(minMaxEditor.getModel().getBuffer().getStoppedChangingDelay());
      expect(minMaxEditor.getModel().getText()).toBe('1');

      minMaxEditor.getModel().setText('-5');
      advanceClock(minMaxEditor.getModel().getBuffer().getStoppedChangingDelay());
      expect(minMaxEditor.getModel().getText()).toBe('1');
    });

    it('prevents setting a value above the maximum', () => {
      const minMaxEditor = settingsPanel.element.querySelector('[id="foo.minMax"]');
      minMaxEditor.getModel().setText('1000');
      advanceClock(minMaxEditor.getModel().getBuffer().getStoppedChangingDelay());
      expect(minMaxEditor.getModel().getText()).toBe('100');

      minMaxEditor.getModel().setText('10000');
      advanceClock(minMaxEditor.getModel().getBuffer().getStoppedChangingDelay());
      expect(minMaxEditor.getModel().getText()).toBe('100');
    });

    it('prevents setting a value that cannot be coerced to the correct type', () => {
      const minMaxEditor = settingsPanel.element.querySelector('[id="foo.minMax"]');
      minMaxEditor.getModel().setText('"abcde"');
      advanceClock(minMaxEditor.getModel().getBuffer().getStoppedChangingDelay());
      expect(minMaxEditor.getModel().getText()).toBe(''); // aka default

      minMaxEditor.getModel().setText('15');
      advanceClock(minMaxEditor.getModel().getBuffer().getStoppedChangingDelay());
      expect(minMaxEditor.getModel().getText()).toBe('15');

      minMaxEditor.getModel().setText('"abcde"');
      advanceClock(minMaxEditor.getModel().getBuffer().getStoppedChangingDelay());
      expect(minMaxEditor.getModel().getText()).toBe('15');
    });

    it('allows setting a valid scoped value', () => {
      settingsPanel = new SettingsPanel({namespace: 'foo', includeTitle: false, scopeName: 'source.js'});
      const minMaxEditor = settingsPanel.element.querySelector('atom-text-editor');
      minMaxEditor.getModel().setText('15');
      advanceClock(minMaxEditor.getModel().getBuffer().getStoppedChangingDelay());
      expect(minMaxEditor.getModel().getText()).toBe('15');
    });

    describe('commaValueArray', () => {
      it('comma in value is escaped', () => {
        const commaValueArrayEditor = settingsPanel.element.querySelector('[id="foo.commaValueArray"]');
        commaValueArrayEditor.getModel().setText('1, \\,, 2');
        advanceClock(commaValueArrayEditor.getModel().getBuffer().getStoppedChangingDelay());
        expect(atom.config.get("foo.commaValueArray")).toEqual(['1', ',', '2']);

        commaValueArrayEditor.getModel().setText('1\\, 2');
        advanceClock(commaValueArrayEditor.getModel().getBuffer().getStoppedChangingDelay());
        expect(atom.config.get('foo.commaValueArray')).toEqual(['1, 2']);

        commaValueArrayEditor.getModel().setText('1\\,');
        advanceClock(commaValueArrayEditor.getModel().getBuffer().getStoppedChangingDelay());
        expect(atom.config.get('foo.commaValueArray')).toEqual(['1,']);

        commaValueArrayEditor.getModel().setText('\\, 2');
        advanceClock(commaValueArrayEditor.getModel().getBuffer().getStoppedChangingDelay());
        expect(atom.config.get('foo.commaValueArray')).toEqual([', 2']);
    });

      it('renders an escaped comma', () => {
        const commaValueArrayEditor = settingsPanel.element.querySelector('[id="foo.commaValueArray"]');
        atom.config.set('foo.commaValueArray', ['3', ',', '4']);
        advanceClock(1000);
        expect(commaValueArrayEditor.getModel().getText()).toBe('3, \\,, 4');

        atom.config.set('foo.commaValueArray', ['3, 4']);
        advanceClock(1000);
        expect(commaValueArrayEditor.getModel().getText()).toBe('3\\, 4');

        atom.config.set('foo.commaValueArray', ['3,']);
        advanceClock(1000);
        expect(commaValueArrayEditor.getModel().getText()).toBe('3\\,');

        atom.config.set('foo.commaValueArray', [', 4']);
        advanceClock(1000);
        expect(commaValueArrayEditor.getModel().getText()).toBe('\\, 4');
      });
    });
  });
});
