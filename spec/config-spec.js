describe('Config', () => {
  let savedSettings;

  beforeEach(() => {
    spyOn(console, 'warn');
    core.config.settingsLoaded = true;

    savedSettings = [];
    core.config.saveCallback = function(settings) {
      savedSettings.push(settings);
    };
  });

  describe('.get(keyPath, {scope, sources, excludeSources})', () => {
    it("allows a key path's value to be read", () => {
      expect(core.config.set('foo.bar.baz', 42)).toBe(true);
      expect(core.config.get('foo.bar.baz')).toBe(42);
      expect(core.config.get('foo.quux')).toBeUndefined();
    });

    it("returns a deep clone of the key path's value", () => {
      core.config.set('value', { array: [1, { b: 2 }, 3] });
      const retrievedValue = core.config.get('value');
      retrievedValue.array[0] = 4;
      retrievedValue.array[1].b = 2.1;
      expect(core.config.get('value')).toEqual({ array: [1, { b: 2 }, 3] });
    });

    it('merges defaults into the returned value if both the assigned value and the default value are objects', () => {
      core.config.setDefaults('foo.bar', { baz: 1, ok: 2 });
      core.config.set('foo.bar', { baz: 3 });
      expect(core.config.get('foo.bar')).toEqual({ baz: 3, ok: 2 });

      core.config.setDefaults('other', { baz: 1 });
      core.config.set('other', 7);
      expect(core.config.get('other')).toBe(7);

      core.config.set('bar.baz', { a: 3 });
      core.config.setDefaults('bar', { baz: 7 });
      expect(core.config.get('bar.baz')).toEqual({ a: 3 });
    });

    describe("when a 'sources' option is specified", () =>
      it('only retrieves values from the specified sources', () => {
        core.config.set('x.y', 1, { scopeSelector: '.foo', source: 'a' });
        core.config.set('x.y', 2, { scopeSelector: '.foo', source: 'b' });
        core.config.set('x.y', 3, { scopeSelector: '.foo', source: 'c' });
        core.config.setSchema('x.y', { type: 'integer', default: 4 });

        expect(
          core.config.get('x.y', { sources: ['a'], scope: ['.foo'] })
        ).toBe(1);
        expect(
          core.config.get('x.y', { sources: ['b'], scope: ['.foo'] })
        ).toBe(2);
        expect(
          core.config.get('x.y', { sources: ['c'], scope: ['.foo'] })
        ).toBe(3);
        // Schema defaults never match a specific source. We could potentially add a special "schema" source.
        expect(
          core.config.get('x.y', { sources: ['x'], scope: ['.foo'] })
        ).toBeUndefined();

        expect(
          core.config.get(null, { sources: ['a'], scope: ['.foo'] }).x.y
        ).toBe(1);
      }));

    describe("when an 'excludeSources' option is specified", () =>
      it('only retrieves values from the specified sources', () => {
        core.config.set('x.y', 0);
        core.config.set('x.y', 1, { scopeSelector: '.foo', source: 'a' });
        core.config.set('x.y', 2, { scopeSelector: '.foo', source: 'b' });
        core.config.set('x.y', 3, { scopeSelector: '.foo', source: 'c' });
        core.config.setSchema('x.y', { type: 'integer', default: 4 });

        expect(
          core.config.get('x.y', { excludeSources: ['a'], scope: ['.foo'] })
        ).toBe(3);
        expect(
          core.config.get('x.y', { excludeSources: ['c'], scope: ['.foo'] })
        ).toBe(2);
        expect(
          core.config.get('x.y', {
            excludeSources: ['b', 'c'],
            scope: ['.foo']
          })
        ).toBe(1);
        expect(
          core.config.get('x.y', {
            excludeSources: ['b', 'c', 'a'],
            scope: ['.foo']
          })
        ).toBe(0);
        expect(
          core.config.get('x.y', {
            excludeSources: ['b', 'c', 'a', core.config.getUserConfigPath()],
            scope: ['.foo']
          })
        ).toBe(4);
        expect(
          core.config.get('x.y', {
            excludeSources: [core.config.getUserConfigPath()]
          })
        ).toBe(4);
      }));

    describe("when a 'scope' option is given", () => {
      it('returns the property with the most specific scope selector', () => {
        core.config.set('foo.bar.baz', 42, {
          scopeSelector: '.source.coffee .string.quoted.double.coffee'
        });
        core.config.set('foo.bar.baz', 22, {
          scopeSelector: '.source .string.quoted.double'
        });
        core.config.set('foo.bar.baz', 11, { scopeSelector: '.source' });

        expect(
          core.config.get('foo.bar.baz', {
            scope: ['.source.coffee', '.string.quoted.double.coffee']
          })
        ).toBe(42);
        expect(
          core.config.get('foo.bar.baz', {
            scope: ['.source.js', '.string.quoted.double.js']
          })
        ).toBe(22);
        expect(
          core.config.get('foo.bar.baz', {
            scope: ['.source.js', '.variable.assignment.js']
          })
        ).toBe(11);
        expect(
          core.config.get('foo.bar.baz', { scope: ['.text'] })
        ).toBeUndefined();
      });

      it('favors the most recently added properties in the event of a specificity tie', () => {
        core.config.set('foo.bar.baz', 42, {
          scopeSelector: '.source.coffee .string.quoted.single'
        });
        core.config.set('foo.bar.baz', 22, {
          scopeSelector: '.source.coffee .string.quoted.double'
        });

        expect(
          core.config.get('foo.bar.baz', {
            scope: ['.source.coffee', '.string.quoted.single']
          })
        ).toBe(42);
        expect(
          core.config.get('foo.bar.baz', {
            scope: ['.source.coffee', '.string.quoted.single.double']
          })
        ).toBe(22);
      });

      describe('when there are global defaults', () =>
        it('falls back to the global when there is no scoped property specified', () => {
          core.config.setDefaults('foo', { hasDefault: 'ok' });
          expect(
            core.config.get('foo.hasDefault', {
              scope: ['.source.coffee', '.string.quoted.single']
            })
          ).toBe('ok');
        }));

      describe('when package settings are added after user settings', () =>
        it("returns the user's setting because the user's setting has higher priority", () => {
          core.config.set('foo.bar.baz', 100, {
            scopeSelector: '.source.coffee'
          });
          core.config.set('foo.bar.baz', 1, {
            scopeSelector: '.source.coffee',
            source: 'some-package'
          });
          expect(
            core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
          ).toBe(100);
        }));
    });
  });

  describe('.getAll(keyPath, {scope, sources, excludeSources})', () => {
    it('reads all of the values for a given key-path', () => {
      expect(core.config.set('foo', 41)).toBe(true);
      expect(core.config.set('foo', 43, { scopeSelector: '.a .b' })).toBe(true);
      expect(core.config.set('foo', 42, { scopeSelector: '.a' })).toBe(true);
      expect(core.config.set('foo', 44, { scopeSelector: '.a .b.c' })).toBe(
        true
      );

      expect(core.config.set('foo', -44, { scopeSelector: '.d' })).toBe(true);

      expect(core.config.getAll('foo', { scope: ['.a', '.b.c'] })).toEqual([
        { scopeSelector: '.a .b.c', value: 44 },
        { scopeSelector: '.a .b', value: 43 },
        { scopeSelector: '.a', value: 42 },
        { scopeSelector: '*', value: 41 }
      ]);
    });

    it("includes the schema's default value", () => {
      core.config.setSchema('foo', { type: 'number', default: 40 });
      expect(core.config.set('foo', 43, { scopeSelector: '.a .b' })).toBe(true);
      expect(core.config.getAll('foo', { scope: ['.a', '.b.c'] })).toEqual([
        { scopeSelector: '.a .b', value: 43 },
        { scopeSelector: '*', value: 40 }
      ]);
    });
  });

  describe('.set(keyPath, value, {source, scopeSelector})', () => {
    it("allows a key path's value to be written", () => {
      expect(core.config.set('foo.bar.baz', 42)).toBe(true);
      expect(core.config.get('foo.bar.baz')).toBe(42);
    });

    it("saves the user's config to disk after it stops changing", () => {
      core.config.set('foo.bar.baz', 42);
      expect(savedSettings.length).toBe(0);
      core.config.set('foo.bar.baz', 43);
      expect(savedSettings.length).toBe(0);
      core.config.set('foo.bar.baz', 44);
      advanceClock(10);
      expect(savedSettings.length).toBe(1);
    });

    it("does not save when a non-default 'source' is given", () => {
      core.config.set('foo.bar.baz', 42, {
        source: 'some-other-source',
        scopeSelector: '.a'
      });
      advanceClock(500);
      expect(savedSettings.length).toBe(0);
    });

    it("does not allow a 'source' option without a 'scopeSelector'", () => {
      expect(() =>
        core.config.set('foo', 1, { source: ['.source.ruby'] })
      ).toThrow();
    });

    describe('when the key-path is null', () =>
      it('sets the root object', () => {
        expect(core.config.set(null, { editor: { tabLength: 6 } })).toBe(true);
        expect(core.config.get('editor.tabLength')).toBe(6);
        expect(
          core.config.set(null, {
            editor: { tabLength: 8, scopeSelector: ['.source.js'] }
          })
        ).toBe(true);
        expect(
          core.config.get('editor.tabLength', { scope: ['.source.js'] })
        ).toBe(8);
      }));

    describe('when the value equals the default value', () =>
      it("does not store the value in the user's config", () => {
        core.config.setSchema('foo', {
          type: 'object',
          properties: {
            same: {
              type: 'number',
              default: 1
            },
            changes: {
              type: 'number',
              default: 1
            },
            sameArray: {
              type: 'array',
              default: [1, 2, 3]
            },
            sameObject: {
              type: 'object',
              default: { a: 1, b: 2 }
            },
            null: {
              type: '*',
              default: null
            },
            undefined: {
              type: '*',
              default: undefined
            }
          }
        });
        expect(core.config.settings.foo).toBeUndefined();

        core.config.set('foo.same', 1);
        core.config.set('foo.changes', 2);
        core.config.set('foo.sameArray', [1, 2, 3]);
        core.config.set('foo.null', undefined);
        core.config.set('foo.undefined', null);
        core.config.set('foo.sameObject', { b: 2, a: 1 });

        const userConfigPath = core.config.getUserConfigPath();

        expect(
          core.config.get('foo.same', { sources: [userConfigPath] })
        ).toBeUndefined();

        expect(core.config.get('foo.changes')).toBe(2);
        expect(
          core.config.get('foo.changes', { sources: [userConfigPath] })
        ).toBe(2);

        core.config.set('foo.changes', 1);
        expect(
          core.config.get('foo.changes', { sources: [userConfigPath] })
        ).toBeUndefined();
      }));

    describe("when a 'scopeSelector' is given", () =>
      it('sets the value and overrides the others', () => {
        core.config.set('foo.bar.baz', 42, {
          scopeSelector: '.source.coffee .string.quoted.double.coffee'
        });
        core.config.set('foo.bar.baz', 22, {
          scopeSelector: '.source .string.quoted.double'
        });
        core.config.set('foo.bar.baz', 11, { scopeSelector: '.source' });

        expect(
          core.config.get('foo.bar.baz', {
            scope: ['.source.coffee', '.string.quoted.double.coffee']
          })
        ).toBe(42);

        expect(
          core.config.set('foo.bar.baz', 100, {
            scopeSelector: '.source.coffee .string.quoted.double.coffee'
          })
        ).toBe(true);
        expect(
          core.config.get('foo.bar.baz', {
            scope: ['.source.coffee', '.string.quoted.double.coffee']
          })
        ).toBe(100);
      }));
  });

  describe('.unset(keyPath, {source, scopeSelector})', () => {
    beforeEach(() =>
      core.config.setSchema('foo', {
        type: 'object',
        properties: {
          bar: {
            type: 'object',
            properties: {
              baz: {
                type: 'integer',
                default: 0
              },
              ok: {
                type: 'integer',
                default: 0
              }
            }
          },
          quux: {
            type: 'integer',
            default: 0
          }
        }
      })
    );

    it('sets the value of the key path to its default', () => {
      core.config.setDefaults('a', { b: 3 });
      core.config.set('a.b', 4);
      expect(core.config.get('a.b')).toBe(4);
      core.config.unset('a.b');
      expect(core.config.get('a.b')).toBe(3);

      core.config.set('a.c', 5);
      expect(core.config.get('a.c')).toBe(5);
      core.config.unset('a.c');
      expect(core.config.get('a.c')).toBeUndefined();
    });

    it('calls ::save()', () => {
      core.config.setDefaults('a', { b: 3 });
      core.config.set('a.b', 4);
      savedSettings.length = 0;

      core.config.unset('a.c');
      advanceClock(500);
      expect(savedSettings.length).toBe(1);
    });

    describe("when no 'scopeSelector' is given", () => {
      describe("when a 'source' but no key-path is given", () =>
        it('removes all scoped settings with the given source', () => {
          core.config.set('foo.bar.baz', 1, {
            scopeSelector: '.a',
            source: 'source-a'
          });
          core.config.set('foo.bar.quux', 2, {
            scopeSelector: '.b',
            source: 'source-a'
          });
          expect(core.config.get('foo.bar', { scope: ['.a.b'] })).toEqual({
            baz: 1,
            quux: 2
          });

          core.config.unset(null, { source: 'source-a' });
          expect(core.config.get('foo.bar', { scope: ['.a'] })).toEqual({
            baz: 0,
            ok: 0
          });
        }));

      describe("when a 'source' and a key-path is given", () =>
        it('removes all scoped settings with the given source and key-path', () => {
          core.config.set('foo.bar.baz', 1);
          core.config.set('foo.bar.baz', 2, {
            scopeSelector: '.a',
            source: 'source-a'
          });
          core.config.set('foo.bar.baz', 3, {
            scopeSelector: '.a.b',
            source: 'source-b'
          });
          expect(core.config.get('foo.bar.baz', { scope: ['.a.b'] })).toEqual(
            3
          );

          core.config.unset('foo.bar.baz', { source: 'source-b' });
          expect(core.config.get('foo.bar.baz', { scope: ['.a.b'] })).toEqual(
            2
          );
          expect(core.config.get('foo.bar.baz')).toEqual(1);
        }));

      describe("when no 'source' is given", () =>
        it('removes all scoped and unscoped properties for that key-path', () => {
          core.config.setDefaults('foo.bar', { baz: 100 });

          core.config.set(
            'foo.bar',
            { baz: 1, ok: 2 },
            { scopeSelector: '.a' }
          );
          core.config.set(
            'foo.bar',
            { baz: 11, ok: 12 },
            { scopeSelector: '.b' }
          );
          core.config.set('foo.bar', { baz: 21, ok: 22 });

          core.config.unset('foo.bar.baz');

          expect(core.config.get('foo.bar.baz', { scope: ['.a'] })).toBe(100);
          expect(core.config.get('foo.bar.baz', { scope: ['.b'] })).toBe(100);
          expect(core.config.get('foo.bar.baz')).toBe(100);

          expect(core.config.get('foo.bar.ok', { scope: ['.a'] })).toBe(2);
          expect(core.config.get('foo.bar.ok', { scope: ['.b'] })).toBe(12);
          expect(core.config.get('foo.bar.ok')).toBe(22);
        }));
    });

    describe("when a 'scopeSelector' is given", () => {
      it('restores the global default when no scoped default set', () => {
        core.config.setDefaults('foo', { bar: { baz: 10 } });
        core.config.set('foo.bar.baz', 55, { scopeSelector: '.source.coffee' });
        expect(
          core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
        ).toBe(55);

        core.config.unset('foo.bar.baz', { scopeSelector: '.source.coffee' });
        expect(
          core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
        ).toBe(10);
      });

      it('restores the scoped default when a scoped default is set', () => {
        core.config.setDefaults('foo', { bar: { baz: 10 } });
        core.config.set('foo.bar.baz', 42, {
          scopeSelector: '.source.coffee',
          source: 'some-source'
        });
        core.config.set('foo.bar.baz', 55, { scopeSelector: '.source.coffee' });
        core.config.set('foo.bar.ok', 100, { scopeSelector: '.source.coffee' });
        expect(
          core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
        ).toBe(55);

        core.config.unset('foo.bar.baz', { scopeSelector: '.source.coffee' });
        expect(
          core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
        ).toBe(42);
        expect(
          core.config.get('foo.bar.ok', { scope: ['.source.coffee'] })
        ).toBe(100);
      });

      it('calls ::save()', () => {
        core.config.setDefaults('foo', { bar: { baz: 10 } });
        core.config.set('foo.bar.baz', 55, { scopeSelector: '.source.coffee' });
        savedSettings.length = 0;

        core.config.unset('foo.bar.baz', { scopeSelector: '.source.coffee' });
        advanceClock(150);
        expect(savedSettings.length).toBe(1);
      });

      it('allows removing settings for a specific source and scope selector', () => {
        core.config.set('foo.bar.baz', 55, {
          scopeSelector: '.source.coffee',
          source: 'source-a'
        });
        core.config.set('foo.bar.baz', 65, {
          scopeSelector: '.source.coffee',
          source: 'source-b'
        });
        expect(
          core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
        ).toBe(65);

        core.config.unset('foo.bar.baz', {
          source: 'source-b',
          scopeSelector: '.source.coffee'
        });
        expect(
          core.config.get('foo.bar.baz', {
            scope: ['.source.coffee', '.string']
          })
        ).toBe(55);
      });

      it('allows removing all settings for a specific source', () => {
        core.config.set('foo.bar.baz', 55, {
          scopeSelector: '.source.coffee',
          source: 'source-a'
        });
        core.config.set('foo.bar.baz', 65, {
          scopeSelector: '.source.coffee',
          source: 'source-b'
        });
        core.config.set('foo.bar.ok', 65, {
          scopeSelector: '.source.coffee',
          source: 'source-b'
        });
        expect(
          core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
        ).toBe(65);

        core.config.unset(null, {
          source: 'source-b',
          scopeSelector: '.source.coffee'
        });
        expect(
          core.config.get('foo.bar.baz', {
            scope: ['.source.coffee', '.string']
          })
        ).toBe(55);
        expect(
          core.config.get('foo.bar.ok', {
            scope: ['.source.coffee', '.string']
          })
        ).toBe(0);
      });

      it('does not call ::save or add a scoped property when no value has been set', () => {
        // see https://github.com/atom/atom/issues/4175
        core.config.setDefaults('foo', { bar: { baz: 10 } });
        core.config.unset('foo.bar.baz', { scopeSelector: '.source.coffee' });
        expect(
          core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
        ).toBe(10);

        expect(savedSettings.length).toBe(0);

        const scopedProperties = core.config.scopedSettingsStore.propertiesForSource(
          'user-config'
        );
        expect(scopedProperties['.coffee.source']).toBeUndefined();
      });

      it('removes the scoped value when it was the only set value on the object', () => {
        core.config.setDefaults('foo', { bar: { baz: 10 } });
        core.config.set('foo.bar.baz', 55, { scopeSelector: '.source.coffee' });
        core.config.set('foo.bar.ok', 20, { scopeSelector: '.source.coffee' });
        expect(
          core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
        ).toBe(55);

        advanceClock(150);
        
        savedSettings.length = 0;

        core.config.unset('foo.bar.baz', { scopeSelector: '.source.coffee' });
        expect(
          core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
        ).toBe(10);
        expect(
          core.config.get('foo.bar.ok', { scope: ['.source.coffee'] })
        ).toBe(20);

        advanceClock(150);

        expect(savedSettings[0]['.coffee.source']).toEqual({
          foo: {
            bar: {
              ok: 20
            }
          }
        });

        core.config.unset('foo.bar.ok', { scopeSelector: '.source.coffee' });

        advanceClock(150);

        expect(savedSettings.length).toBe(2);
        expect(savedSettings[1]['.coffee.source']).toBeUndefined();
      });

      it('does not call ::save when the value is already at the default', () => {
        core.config.setDefaults('foo', { bar: { baz: 10 } });
        core.config.set('foo.bar.baz', 55);
        advanceClock(150);
        savedSettings.length = 0;

        core.config.unset('foo.bar.ok', { scopeSelector: '.source.coffee' });
        advanceClock(150);
        expect(savedSettings.length).toBe(0);
        expect(
          core.config.get('foo.bar.baz', { scope: ['.source.coffee'] })
        ).toBe(55);
      });
    });
  });

  describe('.onDidChange(keyPath, {scope})', () => {
    let observeHandler = [];

    describe('when a keyPath is specified', () => {
      beforeEach(() => {
        observeHandler = jasmine.createSpy('observeHandler');
        core.config.set('foo.bar.baz', 'value 1');
        core.config.onDidChange('foo.bar.baz', observeHandler);
      });

      it('does not fire the given callback with the current value at the keypath', () =>
        expect(observeHandler).not.toHaveBeenCalled());

      it('fires the callback every time the observed value changes', () => {
        core.config.set('foo.bar.baz', 'value 2');
        expect(observeHandler).toHaveBeenCalledWith({
          newValue: 'value 2',
          oldValue: 'value 1'
        });
        observeHandler.reset();
        observeHandler.andCallFake(() => {
          throw new Error('oops');
        });
        expect(() => core.config.set('foo.bar.baz', 'value 1')).toThrow('oops');
        expect(observeHandler).toHaveBeenCalledWith({
          newValue: 'value 1',
          oldValue: 'value 2'
        });
        observeHandler.reset();

        // Regression: exception in earlier handler shouldn't put observer
        // into a bad state.
        core.config.set('something.else', 'new value');
        expect(observeHandler).not.toHaveBeenCalled();
      });
    });

    describe('when a keyPath is not specified', () => {
      beforeEach(() => {
        observeHandler = jasmine.createSpy('observeHandler');
        core.config.set('foo.bar.baz', 'value 1');
        core.config.onDidChange(observeHandler);
      });

      it('does not fire the given callback initially', () =>
        expect(observeHandler).not.toHaveBeenCalled());

      it('fires the callback every time any value changes', () => {
        observeHandler.reset(); // clear the initial call
        core.config.set('foo.bar.baz', 'value 2');
        expect(observeHandler).toHaveBeenCalled();
        expect(observeHandler.mostRecentCall.args[0].newValue.foo.bar.baz).toBe(
          'value 2'
        );
        expect(observeHandler.mostRecentCall.args[0].oldValue.foo.bar.baz).toBe(
          'value 1'
        );

        observeHandler.reset();
        core.config.set('foo.bar.baz', 'value 1');
        expect(observeHandler).toHaveBeenCalled();
        expect(observeHandler.mostRecentCall.args[0].newValue.foo.bar.baz).toBe(
          'value 1'
        );
        expect(observeHandler.mostRecentCall.args[0].oldValue.foo.bar.baz).toBe(
          'value 2'
        );

        observeHandler.reset();
        core.config.set('foo.bar.int', 1);
        expect(observeHandler).toHaveBeenCalled();
        expect(observeHandler.mostRecentCall.args[0].newValue.foo.bar.int).toBe(
          1
        );
        expect(observeHandler.mostRecentCall.args[0].oldValue.foo.bar.int).toBe(
          undefined
        );
      });
    });

    describe("when a 'scope' is given", () =>
      it('calls the supplied callback when the value at the descriptor/keypath changes', () => {
        const changeSpy = jasmine.createSpy('onDidChange callback');
        core.config.onDidChange(
          'foo.bar.baz',
          { scope: ['.source.coffee', '.string.quoted.double.coffee'] },
          changeSpy
        );

        core.config.set('foo.bar.baz', 12);
        expect(changeSpy).toHaveBeenCalledWith({
          oldValue: undefined,
          newValue: 12
        });
        changeSpy.reset();

        core.config.set('foo.bar.baz', 22, {
          scopeSelector: '.source .string.quoted.double',
          source: 'a'
        });
        expect(changeSpy).toHaveBeenCalledWith({ oldValue: 12, newValue: 22 });
        changeSpy.reset();

        core.config.set('foo.bar.baz', 42, {
          scopeSelector: '.source.coffee .string.quoted.double.coffee',
          source: 'b'
        });
        expect(changeSpy).toHaveBeenCalledWith({ oldValue: 22, newValue: 42 });
        changeSpy.reset();

        core.config.unset(null, {
          scopeSelector: '.source.coffee .string.quoted.double.coffee',
          source: 'b'
        });
        expect(changeSpy).toHaveBeenCalledWith({ oldValue: 42, newValue: 22 });
        changeSpy.reset();

        core.config.unset(null, {
          scopeSelector: '.source .string.quoted.double',
          source: 'a'
        });
        expect(changeSpy).toHaveBeenCalledWith({ oldValue: 22, newValue: 12 });
        changeSpy.reset();

        core.config.set('foo.bar.baz', undefined);
        expect(changeSpy).toHaveBeenCalledWith({
          oldValue: 12,
          newValue: undefined
        });
        changeSpy.reset();
      }));
  });

  describe('.observe(keyPath, {scope})', () => {
    let [observeHandler, observeSubscription] = [];

    beforeEach(() => {
      observeHandler = jasmine.createSpy('observeHandler');
      core.config.set('foo.bar.baz', 'value 1');
      observeSubscription = core.config.observe('foo.bar.baz', observeHandler);
    });

    it('fires the given callback with the current value at the keypath', () =>
      expect(observeHandler).toHaveBeenCalledWith('value 1'));

    it('fires the callback every time the observed value changes', () => {
      observeHandler.reset(); // clear the initial call
      core.config.set('foo.bar.baz', 'value 2');
      expect(observeHandler).toHaveBeenCalledWith('value 2');

      observeHandler.reset();
      core.config.set('foo.bar.baz', 'value 1');
      expect(observeHandler).toHaveBeenCalledWith('value 1');
      advanceClock(100); // complete pending save that was requested in ::set

      observeHandler.reset();
      core.config.resetUserSettings({ foo: {} });
      expect(observeHandler).toHaveBeenCalledWith(undefined);
    });

    it('fires the callback when the observed value is deleted', () => {
      observeHandler.reset(); // clear the initial call
      core.config.set('foo.bar.baz', undefined);
      expect(observeHandler).toHaveBeenCalledWith(undefined);
    });

    it('fires the callback when the full key path goes into and out of existence', () => {
      observeHandler.reset(); // clear the initial call
      core.config.set('foo.bar', undefined);
      expect(observeHandler).toHaveBeenCalledWith(undefined);

      observeHandler.reset();
      core.config.set('foo.bar.baz', "i'm back");
      expect(observeHandler).toHaveBeenCalledWith("i'm back");
    });

    it('does not fire the callback once the subscription is disposed', () => {
      observeHandler.reset(); // clear the initial call
      observeSubscription.dispose();
      core.config.set('foo.bar.baz', 'value 2');
      expect(observeHandler).not.toHaveBeenCalled();
    });

    it('does not fire the callback for a similarly named keyPath', () => {
      const bazCatHandler = jasmine.createSpy('bazCatHandler');
      observeSubscription = core.config.observe(
        'foo.bar.bazCat',
        bazCatHandler
      );

      bazCatHandler.reset();
      core.config.set('foo.bar.baz', 'value 10');
      expect(bazCatHandler).not.toHaveBeenCalled();
    });

    describe("when a 'scope' is given", () => {
      let otherHandler = null;

      beforeEach(() => {
        observeSubscription.dispose();
        otherHandler = jasmine.createSpy('otherHandler');
      });

      it('allows settings to be observed in a specific scope', () => {
        core.config.observe(
          'foo.bar.baz',
          { scope: ['.some.scope'] },
          observeHandler
        );
        core.config.observe(
          'foo.bar.baz',
          { scope: ['.another.scope'] },
          otherHandler
        );

        core.config.set('foo.bar.baz', 'value 2', { scopeSelector: '.some' });
        expect(observeHandler).toHaveBeenCalledWith('value 2');
        expect(otherHandler).not.toHaveBeenCalledWith('value 2');
      });

      it('calls the callback when properties with more specific selectors are removed', () => {
        const changeSpy = jasmine.createSpy();
        core.config.observe(
          'foo.bar.baz',
          { scope: ['.source.coffee', '.string.quoted.double.coffee'] },
          changeSpy
        );
        expect(changeSpy).toHaveBeenCalledWith('value 1');
        changeSpy.reset();

        core.config.set('foo.bar.baz', 12);
        expect(changeSpy).toHaveBeenCalledWith(12);
        changeSpy.reset();

        core.config.set('foo.bar.baz', 22, {
          scopeSelector: '.source .string.quoted.double',
          source: 'a'
        });
        expect(changeSpy).toHaveBeenCalledWith(22);
        changeSpy.reset();

        core.config.set('foo.bar.baz', 42, {
          scopeSelector: '.source.coffee .string.quoted.double.coffee',
          source: 'b'
        });
        expect(changeSpy).toHaveBeenCalledWith(42);
        changeSpy.reset();

        core.config.unset(null, {
          scopeSelector: '.source.coffee .string.quoted.double.coffee',
          source: 'b'
        });
        expect(changeSpy).toHaveBeenCalledWith(22);
        changeSpy.reset();

        core.config.unset(null, {
          scopeSelector: '.source .string.quoted.double',
          source: 'a'
        });
        expect(changeSpy).toHaveBeenCalledWith(12);
        changeSpy.reset();

        core.config.set('foo.bar.baz', undefined);
        expect(changeSpy).toHaveBeenCalledWith(undefined);
        changeSpy.reset();
      });
    });
  });

  describe('.transact(callback)', () => {
    let changeSpy = null;

    beforeEach(() => {
      changeSpy = jasmine.createSpy('onDidChange callback');
      core.config.onDidChange('foo.bar.baz', changeSpy);
    });

    it('allows only one change event for the duration of the given callback', () => {
      core.config.transact(() => {
        core.config.set('foo.bar.baz', 1);
        core.config.set('foo.bar.baz', 2);
        core.config.set('foo.bar.baz', 3);
      });

      expect(changeSpy.callCount).toBe(1);
      expect(changeSpy.argsForCall[0][0]).toEqual({
        newValue: 3,
        oldValue: undefined
      });
    });

    it('does not emit an event if no changes occur while paused', () => {
      core.config.transact(() => {});
      expect(changeSpy).not.toHaveBeenCalled();
    });
  });

  describe('.transactAsync(callback)', () => {
    let changeSpy = null;

    beforeEach(() => {
      changeSpy = jasmine.createSpy('onDidChange callback');
      core.config.onDidChange('foo.bar.baz', changeSpy);
    });

    it('allows only one change event for the duration of the given promise if it gets resolved', () => {
      let promiseResult = null;
      const transactionPromise = core.config.transactAsync(() => {
        core.config.set('foo.bar.baz', 1);
        core.config.set('foo.bar.baz', 2);
        core.config.set('foo.bar.baz', 3);
        return Promise.resolve('a result');
      });

      waitsForPromise(() =>
        transactionPromise.then(result => {
          promiseResult = result;
        })
      );

      runs(() => {
        expect(promiseResult).toBe('a result');
        expect(changeSpy.callCount).toBe(1);
        expect(changeSpy.argsForCall[0][0]).toEqual({
          newValue: 3,
          oldValue: undefined
        });
      });
    });

    it('allows only one change event for the duration of the given promise if it gets rejected', () => {
      let promiseError = null;
      const transactionPromise = core.config.transactAsync(() => {
        core.config.set('foo.bar.baz', 1);
        core.config.set('foo.bar.baz', 2);
        core.config.set('foo.bar.baz', 3);
        return Promise.reject(new Error('an error'));
      });

      waitsForPromise(() =>
        transactionPromise.catch(error => {
          promiseError = error;
        })
      );

      runs(() => {
        expect(promiseError.message).toBe('an error');
        expect(changeSpy.callCount).toBe(1);
        expect(changeSpy.argsForCall[0][0]).toEqual({
          newValue: 3,
          oldValue: undefined
        });
      });
    });

    it('allows only one change event even when the given callback throws', () => {
      const error = new Error('Oops!');
      let promiseError = null;
      const transactionPromise = core.config.transactAsync(() => {
        core.config.set('foo.bar.baz', 1);
        core.config.set('foo.bar.baz', 2);
        core.config.set('foo.bar.baz', 3);
        throw error;
      });

      waitsForPromise(() =>
        transactionPromise.catch(e => {
          promiseError = e;
        })
      );

      runs(() => {
        expect(promiseError).toBe(error);
        expect(changeSpy.callCount).toBe(1);
        expect(changeSpy.argsForCall[0][0]).toEqual({
          newValue: 3,
          oldValue: undefined
        });
      });
    });
  });

  describe('.getSources()', () => {
    it("returns an array of all of the config's source names", () => {
      expect(core.config.getSources()).toEqual([]);

      core.config.set('a.b', 1, { scopeSelector: '.x1', source: 'source-1' });
      core.config.set('a.c', 1, { scopeSelector: '.x1', source: 'source-1' });
      core.config.set('a.b', 2, { scopeSelector: '.x2', source: 'source-2' });
      core.config.set('a.b', 1, { scopeSelector: '.x3', source: 'source-3' });

      expect(core.config.getSources()).toEqual([
        'source-1',
        'source-2',
        'source-3'
      ]);
    });
  });

  describe('.save()', () => {
    it('calls the save callback with any non-default properties', () => {
      core.config.set('a.b.c', 1);
      core.config.set('a.b.d', 2);
      core.config.set('x.y.z', 3);
      core.config.setDefaults('a.b', { e: 4, f: 5 });

      core.config.save();
      expect(savedSettings).toEqual([{ '*': core.config.settings }]);
    });

    it('serializes properties in alphabetical order', () => {
      core.config.set('foo', 1);
      core.config.set('bar', 2);
      core.config.set('baz.foo', 3);
      core.config.set('baz.bar', 4);

      savedSettings.length = 0;
      core.config.save();

      const writtenConfig = savedSettings[0];
      expect(writtenConfig).toEqual({ '*': core.config.settings });

      let expectedKeys = ['bar', 'baz', 'foo'];
      let foundKeys = [];
      for (const key in writtenConfig['*']) {
        if (expectedKeys.includes(key)) {
          foundKeys.push(key);
        }
      }
      expect(foundKeys).toEqual(expectedKeys);
      expectedKeys = ['bar', 'foo'];
      foundKeys = [];
      for (const key in writtenConfig['*']['baz']) {
        if (expectedKeys.includes(key)) {
          foundKeys.push(key);
        }
      }
      expect(foundKeys).toEqual(expectedKeys);
    });

    describe('when scoped settings are defined', () => {
      it('serializes any explicitly set config settings', () => {
        core.config.set('foo.bar', 'ruby', { scopeSelector: '.source.ruby' });
        core.config.set('foo.omg', 'wow', { scopeSelector: '.source.ruby' });
        core.config.set('foo.bar', 'coffee', {
          scopeSelector: '.source.coffee'
        });

        savedSettings.length = 0;
        core.config.save();

        const writtenConfig = savedSettings[0];
        expect(writtenConfig).toEqualJson({
          '*': core.config.settings,
          '.ruby.source': {
            foo: {
              bar: 'ruby',
              omg: 'wow'
            }
          },
          '.coffee.source': {
            foo: {
              bar: 'coffee'
            }
          }
        });
      });
    });
  });

  describe('.resetUserSettings()', () => {
    beforeEach(() => {
      core.config.setSchema('foo', {
        type: 'object',
        properties: {
          bar: {
            type: 'string',
            default: 'def'
          },
          int: {
            type: 'integer',
            default: 12
          }
        }
      });
    });

    describe('when the config file contains scoped settings', () => {
      it('updates the config data based on the file contents', () => {
        core.config.resetUserSettings({
          '*': {
            foo: {
              bar: 'baz'
            }
          },

          '.source.ruby': {
            foo: {
              bar: 'more-specific'
            }
          }
        });
        expect(core.config.get('foo.bar')).toBe('baz');
        expect(core.config.get('foo.bar', { scope: ['.source.ruby'] })).toBe(
          'more-specific'
        );
      });
    });

    describe('when the config file does not conform to the schema', () => {
      it('validates and does not load the incorrect values', () => {
        core.config.resetUserSettings({
          '*': {
            foo: {
              bar: 'omg',
              int: 'baz'
            }
          },
          '.source.ruby': {
            foo: {
              bar: 'scoped',
              int: 'nope'
            }
          }
        });
        expect(core.config.get('foo.int')).toBe(12);
        expect(core.config.get('foo.bar')).toBe('omg');
        expect(core.config.get('foo.int', { scope: ['.source.ruby'] })).toBe(
          12
        );
        expect(core.config.get('foo.bar', { scope: ['.source.ruby'] })).toBe(
          'scoped'
        );
      });
    });

    it('updates the config data based on the file contents', () => {
      core.config.resetUserSettings({ foo: { bar: 'baz' } });
      expect(core.config.get('foo.bar')).toBe('baz');
    });

    it('notifies observers for updated keypaths on load', () => {
      const observeHandler = jasmine.createSpy('observeHandler');
      core.config.observe('foo.bar', observeHandler);
      core.config.resetUserSettings({ foo: { bar: 'baz' } });
      expect(observeHandler).toHaveBeenCalledWith('baz');
    });

    describe('when the config file contains values that do not adhere to the schema', () => {
      it('updates the only the settings that have values matching the schema', () => {
        core.config.resetUserSettings({
          foo: {
            bar: 'baz',
            int: 'bad value'
          }
        });
        expect(core.config.get('foo.bar')).toBe('baz');
        expect(core.config.get('foo.int')).toBe(12);
        expect(console.warn).toHaveBeenCalled();
        expect(console.warn.mostRecentCall.args[0]).toContain('foo.int');
      });
    });

    it('does not fire a change event for paths that did not change', () => {
      core.config.resetUserSettings({
        foo: { bar: 'baz', int: 3 }
      });

      const noChangeSpy = jasmine.createSpy('unchanged');
      core.config.onDidChange('foo.bar', noChangeSpy);

      core.config.resetUserSettings({
        foo: { bar: 'baz', int: 4 }
      });

      expect(noChangeSpy).not.toHaveBeenCalled();
      expect(core.config.get('foo.bar')).toBe('baz');
      expect(core.config.get('foo.int')).toBe(4);
    });

    it('does not fire a change event for paths whose non-primitive values did not change', () => {
      core.config.setSchema('foo.bar', {
        type: 'array',
        items: {
          type: 'string'
        }
      });

      core.config.resetUserSettings({
        foo: { bar: ['baz', 'quux'], int: 2 }
      });

      const noChangeSpy = jasmine.createSpy('unchanged');
      core.config.onDidChange('foo.bar', noChangeSpy);

      core.config.resetUserSettings({
        foo: { bar: ['baz', 'quux'], int: 2 }
      });

      expect(noChangeSpy).not.toHaveBeenCalled();
      expect(core.config.get('foo.bar')).toEqual(['baz', 'quux']);
    });

    describe('when a setting with a default is removed', () => {
      it('resets the setting back to the default', () => {
        core.config.resetUserSettings({
          foo: { bar: ['baz', 'quux'], int: 2 }
        });

        const events = [];
        core.config.onDidChange('foo.int', event => events.push(event));

        core.config.resetUserSettings({
          foo: { bar: ['baz', 'quux'] }
        });

        expect(events.length).toBe(1);
        expect(events[0]).toEqual({ oldValue: 2, newValue: 12 });
      });
    });

    it('keeps all the global scope settings after overriding one', () => {
      core.config.resetUserSettings({
        '*': {
          foo: {
            bar: 'baz',
            int: 99
          }
        }
      });

      core.config.set('foo.int', 50, { scopeSelector: '*' });

      advanceClock(100);

      expect(savedSettings[0]['*'].foo).toEqual({
        bar: 'baz',
        int: 50
      });
      expect(core.config.get('foo.int', { scope: ['*'] })).toEqual(50);
      expect(core.config.get('foo.bar', { scope: ['*'] })).toEqual('baz');
      expect(core.config.get('foo.int')).toEqual(50);
    });
  });

  describe('.pushAtKeyPath(keyPath, value)', () => {
    it('pushes the given value to the array at the key path and updates observers', () => {
      core.config.set('foo.bar.baz', ['a']);
      const observeHandler = jasmine.createSpy('observeHandler');
      core.config.observe('foo.bar.baz', observeHandler);
      observeHandler.reset();

      expect(core.config.pushAtKeyPath('foo.bar.baz', 'b')).toBe(2);
      expect(core.config.get('foo.bar.baz')).toEqual(['a', 'b']);
      expect(observeHandler).toHaveBeenCalledWith(
        core.config.get('foo.bar.baz')
      );
    });
  });

  describe('.unshiftAtKeyPath(keyPath, value)', () => {
    it('unshifts the given value to the array at the key path and updates observers', () => {
      core.config.set('foo.bar.baz', ['b']);
      const observeHandler = jasmine.createSpy('observeHandler');
      core.config.observe('foo.bar.baz', observeHandler);
      observeHandler.reset();

      expect(core.config.unshiftAtKeyPath('foo.bar.baz', 'a')).toBe(2);
      expect(core.config.get('foo.bar.baz')).toEqual(['a', 'b']);
      expect(observeHandler).toHaveBeenCalledWith(
        core.config.get('foo.bar.baz')
      );
    });
  });

  describe('.removeAtKeyPath(keyPath, value)', () => {
    it('removes the given value from the array at the key path and updates observers', () => {
      core.config.set('foo.bar.baz', ['a', 'b', 'c']);
      const observeHandler = jasmine.createSpy('observeHandler');
      core.config.observe('foo.bar.baz', observeHandler);
      observeHandler.reset();

      expect(core.config.removeAtKeyPath('foo.bar.baz', 'b')).toEqual([
        'a',
        'c'
      ]);
      expect(core.config.get('foo.bar.baz')).toEqual(['a', 'c']);
      expect(observeHandler).toHaveBeenCalledWith(
        core.config.get('foo.bar.baz')
      );
    });
  });

  describe('.setDefaults(keyPath, defaults)', () => {
    it('assigns any previously-unassigned keys to the object at the key path', () => {
      core.config.set('foo.bar.baz', { a: 1 });
      core.config.setDefaults('foo.bar.baz', { a: 2, b: 3, c: 4 });
      expect(core.config.get('foo.bar.baz.a')).toBe(1);
      expect(core.config.get('foo.bar.baz.b')).toBe(3);
      expect(core.config.get('foo.bar.baz.c')).toBe(4);

      core.config.setDefaults('foo.quux', { x: 0, y: 1 });
      expect(core.config.get('foo.quux.x')).toBe(0);
      expect(core.config.get('foo.quux.y')).toBe(1);
    });

    it('emits an updated event', () => {
      const updatedCallback = jasmine.createSpy('updated');
      core.config.onDidChange('foo.bar.baz.a', updatedCallback);
      expect(updatedCallback.callCount).toBe(0);
      core.config.setDefaults('foo.bar.baz', { a: 2 });
      expect(updatedCallback.callCount).toBe(1);
    });
  });

  describe('.setSchema(keyPath, schema)', () => {
    it('creates a properly nested schema', () => {
      const schema = {
        type: 'object',
        properties: {
          anInt: {
            type: 'integer',
            default: 12
          }
        }
      };

      core.config.setSchema('foo.bar', schema);

      expect(core.config.getSchema('foo')).toEqual({
        type: 'object',
        properties: {
          bar: {
            type: 'object',
            properties: {
              anInt: {
                type: 'integer',
                default: 12
              }
            }
          }
        }
      });
    });

    it('sets defaults specified by the schema', () => {
      const schema = {
        type: 'object',
        properties: {
          anInt: {
            type: 'integer',
            default: 12
          },
          anObject: {
            type: 'object',
            properties: {
              nestedInt: {
                type: 'integer',
                default: 24
              },
              nestedObject: {
                type: 'object',
                properties: {
                  superNestedInt: {
                    type: 'integer',
                    default: 36
                  }
                }
              }
            }
          }
        }
      };

      core.config.setSchema('foo.bar', schema);
      expect(core.config.get('foo.bar.anInt')).toBe(12);
      expect(core.config.get('foo.bar.anObject')).toEqual({
        nestedInt: 24,
        nestedObject: {
          superNestedInt: 36
        }
      });

      expect(core.config.get('foo')).toEqual({
        bar: {
          anInt: 12,
          anObject: {
            nestedInt: 24,
            nestedObject: {
              superNestedInt: 36
            }
          }
        }
      });
      core.config.set('foo.bar.anObject.nestedObject.superNestedInt', 37);
      expect(core.config.get('foo')).toEqual({
        bar: {
          anInt: 12,
          anObject: {
            nestedInt: 24,
            nestedObject: {
              superNestedInt: 37
            }
          }
        }
      });
    });

    it('can set a non-object schema', () => {
      const schema = {
        type: 'integer',
        default: 12
      };

      core.config.setSchema('foo.bar.anInt', schema);
      expect(core.config.get('foo.bar.anInt')).toBe(12);
      expect(core.config.getSchema('foo.bar.anInt')).toEqual({
        type: 'integer',
        default: 12
      });
    });

    it('allows the schema to be retrieved via ::getSchema', () => {
      const schema = {
        type: 'object',
        properties: {
          anInt: {
            type: 'integer',
            default: 12
          }
        }
      };

      core.config.setSchema('foo.bar', schema);

      expect(core.config.getSchema('foo.bar')).toEqual({
        type: 'object',
        properties: {
          anInt: {
            type: 'integer',
            default: 12
          }
        }
      });

      expect(core.config.getSchema('foo.bar.anInt')).toEqual({
        type: 'integer',
        default: 12
      });

      expect(core.config.getSchema('foo.baz')).toEqual({ type: 'any' });
      expect(core.config.getSchema('foo.bar.anInt.baz')).toBe(null);
    });

    it('respects the schema for scoped settings', () => {
      const schema = {
        type: 'string',
        default: 'ok',
        scopes: {
          '.source.js': {
            default: 'omg'
          }
        }
      };
      core.config.setSchema('foo.bar.str', schema);

      expect(core.config.get('foo.bar.str')).toBe('ok');
      expect(core.config.get('foo.bar.str', { scope: ['.source.js'] })).toBe(
        'omg'
      );
      expect(
        core.config.get('foo.bar.str', { scope: ['.source.coffee'] })
      ).toBe('ok');
    });

    describe('when a schema is added after config values have been set', () => {
      let schema = null;
      beforeEach(() => {
        schema = {
          type: 'object',
          properties: {
            int: {
              type: 'integer',
              default: 2
            },
            str: {
              type: 'string',
              default: 'def'
            }
          }
        };
      });

      it('respects the new schema when values are set', () => {
        expect(core.config.set('foo.bar.str', 'global')).toBe(true);
        expect(
          core.config.set('foo.bar.str', 'scoped', {
            scopeSelector: '.source.js'
          })
        ).toBe(true);
        expect(core.config.get('foo.bar.str')).toBe('global');
        expect(core.config.get('foo.bar.str', { scope: ['.source.js'] })).toBe(
          'scoped'
        );

        expect(core.config.set('foo.bar.noschema', 'nsGlobal')).toBe(true);
        expect(
          core.config.set('foo.bar.noschema', 'nsScoped', {
            scopeSelector: '.source.js'
          })
        ).toBe(true);
        expect(core.config.get('foo.bar.noschema')).toBe('nsGlobal');
        expect(
          core.config.get('foo.bar.noschema', { scope: ['.source.js'] })
        ).toBe('nsScoped');

        expect(core.config.set('foo.bar.int', 'nope')).toBe(true);
        expect(
          core.config.set('foo.bar.int', 'notanint', {
            scopeSelector: '.source.js'
          })
        ).toBe(true);
        expect(
          core.config.set('foo.bar.int', 23, {
            scopeSelector: '.source.coffee'
          })
        ).toBe(true);
        expect(core.config.get('foo.bar.int')).toBe('nope');
        expect(core.config.get('foo.bar.int', { scope: ['.source.js'] })).toBe(
          'notanint'
        );
        expect(
          core.config.get('foo.bar.int', { scope: ['.source.coffee'] })
        ).toBe(23);

        core.config.setSchema('foo.bar', schema);

        expect(core.config.get('foo.bar.str')).toBe('global');
        expect(core.config.get('foo.bar.str', { scope: ['.source.js'] })).toBe(
          'scoped'
        );
        expect(core.config.get('foo.bar.noschema')).toBe('nsGlobal');
        expect(
          core.config.get('foo.bar.noschema', { scope: ['.source.js'] })
        ).toBe('nsScoped');

        expect(core.config.get('foo.bar.int')).toBe(2);
        expect(core.config.get('foo.bar.int', { scope: ['.source.js'] })).toBe(
          2
        );
        expect(
          core.config.get('foo.bar.int', { scope: ['.source.coffee'] })
        ).toBe(23);
      });

      it('sets all values that adhere to the schema', () => {
        expect(core.config.set('foo.bar.int', 10)).toBe(true);
        expect(
          core.config.set('foo.bar.int', 15, { scopeSelector: '.source.js' })
        ).toBe(true);
        expect(
          core.config.set('foo.bar.int', 23, {
            scopeSelector: '.source.coffee'
          })
        ).toBe(true);
        expect(core.config.get('foo.bar.int')).toBe(10);
        expect(core.config.get('foo.bar.int', { scope: ['.source.js'] })).toBe(
          15
        );
        expect(
          core.config.get('foo.bar.int', { scope: ['.source.coffee'] })
        ).toBe(23);

        core.config.setSchema('foo.bar', schema);

        expect(core.config.get('foo.bar.int')).toBe(10);
        expect(core.config.get('foo.bar.int', { scope: ['.source.js'] })).toBe(
          15
        );
        expect(
          core.config.get('foo.bar.int', { scope: ['.source.coffee'] })
        ).toBe(23);
      });
    });

    describe('when the value has an "integer" type', () => {
      beforeEach(() => {
        const schema = {
          type: 'integer',
          default: 12
        };
        core.config.setSchema('foo.bar.anInt', schema);
      });

      it('coerces a string to an int', () => {
        core.config.set('foo.bar.anInt', '123');
        expect(core.config.get('foo.bar.anInt')).toBe(123);
      });

      it('does not allow infinity', () => {
        core.config.set('foo.bar.anInt', Infinity);
        expect(core.config.get('foo.bar.anInt')).toBe(12);
      });

      it('coerces a float to an int', () => {
        core.config.set('foo.bar.anInt', 12.3);
        expect(core.config.get('foo.bar.anInt')).toBe(12);
      });

      it('will not set non-integers', () => {
        core.config.set('foo.bar.anInt', null);
        expect(core.config.get('foo.bar.anInt')).toBe(12);

        core.config.set('foo.bar.anInt', 'nope');
        expect(core.config.get('foo.bar.anInt')).toBe(12);
      });

      describe('when the minimum and maximum keys are used', () => {
        beforeEach(() => {
          const schema = {
            type: 'integer',
            minimum: 10,
            maximum: 20,
            default: 12
          };
          core.config.setSchema('foo.bar.anInt', schema);
        });

        it('keeps the specified value within the specified range', () => {
          core.config.set('foo.bar.anInt', '123');
          expect(core.config.get('foo.bar.anInt')).toBe(20);

          core.config.set('foo.bar.anInt', '1');
          expect(core.config.get('foo.bar.anInt')).toBe(10);
        });
      });
    });

    describe('when the value has an "integer" and "string" type', () => {
      beforeEach(() => {
        const schema = {
          type: ['integer', 'string'],
          default: 12
        };
        core.config.setSchema('foo.bar.anInt', schema);
      });

      it('can coerce an int, and fallback to a string', () => {
        core.config.set('foo.bar.anInt', '123');
        expect(core.config.get('foo.bar.anInt')).toBe(123);

        core.config.set('foo.bar.anInt', 'cats');
        expect(core.config.get('foo.bar.anInt')).toBe('cats');
      });
    });

    describe('when the value has an "string" and "boolean" type', () => {
      beforeEach(() => {
        const schema = {
          type: ['string', 'boolean'],
          default: 'def'
        };
        core.config.setSchema('foo.bar', schema);
      });

      it('can set a string, a boolean, and revert back to the default', () => {
        core.config.set('foo.bar', 'ok');
        expect(core.config.get('foo.bar')).toBe('ok');

        core.config.set('foo.bar', false);
        expect(core.config.get('foo.bar')).toBe(false);

        core.config.set('foo.bar', undefined);
        expect(core.config.get('foo.bar')).toBe('def');
      });
    });

    describe('when the value has a "number" type', () => {
      beforeEach(() => {
        const schema = {
          type: 'number',
          default: 12.1
        };
        core.config.setSchema('foo.bar.aFloat', schema);
      });

      it('coerces a string to a float', () => {
        core.config.set('foo.bar.aFloat', '12.23');
        expect(core.config.get('foo.bar.aFloat')).toBe(12.23);
      });

      it('will not set non-numbers', () => {
        core.config.set('foo.bar.aFloat', null);
        expect(core.config.get('foo.bar.aFloat')).toBe(12.1);

        core.config.set('foo.bar.aFloat', 'nope');
        expect(core.config.get('foo.bar.aFloat')).toBe(12.1);
      });

      describe('when the minimum and maximum keys are used', () => {
        beforeEach(() => {
          const schema = {
            type: 'number',
            minimum: 11.2,
            maximum: 25.4,
            default: 12.1
          };
          core.config.setSchema('foo.bar.aFloat', schema);
        });

        it('keeps the specified value within the specified range', () => {
          core.config.set('foo.bar.aFloat', '123.2');
          expect(core.config.get('foo.bar.aFloat')).toBe(25.4);

          core.config.set('foo.bar.aFloat', '1.0');
          expect(core.config.get('foo.bar.aFloat')).toBe(11.2);
        });
      });
    });

    describe('when the value has a "boolean" type', () => {
      beforeEach(() => {
        const schema = {
          type: 'boolean',
          default: true
        };
        core.config.setSchema('foo.bar.aBool', schema);
      });

      it('coerces various types to a boolean', () => {
        core.config.set('foo.bar.aBool', 'true');
        expect(core.config.get('foo.bar.aBool')).toBe(true);
        core.config.set('foo.bar.aBool', 'false');
        expect(core.config.get('foo.bar.aBool')).toBe(false);
        core.config.set('foo.bar.aBool', 'TRUE');
        expect(core.config.get('foo.bar.aBool')).toBe(true);
        core.config.set('foo.bar.aBool', 'FALSE');
        expect(core.config.get('foo.bar.aBool')).toBe(false);
        core.config.set('foo.bar.aBool', 1);
        expect(core.config.get('foo.bar.aBool')).toBe(false);
        core.config.set('foo.bar.aBool', 0);
        expect(core.config.get('foo.bar.aBool')).toBe(false);
        core.config.set('foo.bar.aBool', {});
        expect(core.config.get('foo.bar.aBool')).toBe(false);
        core.config.set('foo.bar.aBool', null);
        expect(core.config.get('foo.bar.aBool')).toBe(false);
      });

      it('reverts back to the default value when undefined is passed to set', () => {
        core.config.set('foo.bar.aBool', 'false');
        expect(core.config.get('foo.bar.aBool')).toBe(false);

        core.config.set('foo.bar.aBool', undefined);
        expect(core.config.get('foo.bar.aBool')).toBe(true);
      });
    });

    describe('when the value has an "string" type', () => {
      beforeEach(() => {
        const schema = {
          type: 'string',
          default: 'ok'
        };
        core.config.setSchema('foo.bar.aString', schema);
      });

      it('allows strings', () => {
        core.config.set('foo.bar.aString', 'yep');
        expect(core.config.get('foo.bar.aString')).toBe('yep');
      });

      it('will only set strings', () => {
        expect(core.config.set('foo.bar.aString', 123)).toBe(false);
        expect(core.config.get('foo.bar.aString')).toBe('ok');

        expect(core.config.set('foo.bar.aString', true)).toBe(false);
        expect(core.config.get('foo.bar.aString')).toBe('ok');

        expect(core.config.set('foo.bar.aString', null)).toBe(false);
        expect(core.config.get('foo.bar.aString')).toBe('ok');

        expect(core.config.set('foo.bar.aString', [])).toBe(false);
        expect(core.config.get('foo.bar.aString')).toBe('ok');

        expect(core.config.set('foo.bar.aString', { nope: 'nope' })).toBe(
          false
        );
        expect(core.config.get('foo.bar.aString')).toBe('ok');
      });

      it('does not allow setting children of that key-path', () => {
        expect(core.config.set('foo.bar.aString.something', 123)).toBe(false);
        expect(core.config.get('foo.bar.aString')).toBe('ok');
      });

      describe('when the schema has a "maximumLength" key', () =>
        it('trims the string to be no longer than the specified maximum', () => {
          const schema = {
            type: 'string',
            default: 'ok',
            maximumLength: 3
          };
          core.config.setSchema('foo.bar.aString', schema);
          core.config.set('foo.bar.aString', 'abcdefg');
          expect(core.config.get('foo.bar.aString')).toBe('abc');
        }));
    });

    describe('when the value has an "object" type', () => {
      beforeEach(() => {
        const schema = {
          type: 'object',
          properties: {
            anInt: {
              type: 'integer',
              default: 12
            },
            nestedObject: {
              type: 'object',
              properties: {
                nestedBool: {
                  type: 'boolean',
                  default: false
                }
              }
            }
          }
        };
        core.config.setSchema('foo.bar', schema);
      });

      it('converts and validates all the children', () => {
        core.config.set('foo.bar', {
          anInt: '23',
          nestedObject: {
            nestedBool: 'true'
          }
        });
        expect(core.config.get('foo.bar')).toEqual({
          anInt: 23,
          nestedObject: {
            nestedBool: true
          }
        });
      });

      it('will set only the values that adhere to the schema', () => {
        expect(
          core.config.set('foo.bar', {
            anInt: 'nope',
            nestedObject: {
              nestedBool: true
            }
          })
        ).toBe(true);
        expect(core.config.get('foo.bar.anInt')).toEqual(12);
        expect(core.config.get('foo.bar.nestedObject.nestedBool')).toEqual(
          true
        );
      });

      describe('when the value has additionalProperties set to false', () =>
        it('does not allow other properties to be set on the object', () => {
          core.config.setSchema('foo.bar', {
            type: 'object',
            properties: {
              anInt: {
                type: 'integer',
                default: 12
              }
            },
            additionalProperties: false
          });

          expect(
            core.config.set('foo.bar', { anInt: 5, somethingElse: 'ok' })
          ).toBe(true);
          expect(core.config.get('foo.bar.anInt')).toBe(5);
          expect(core.config.get('foo.bar.somethingElse')).toBeUndefined();

          expect(core.config.set('foo.bar.somethingElse', { anInt: 5 })).toBe(
            false
          );
          expect(core.config.get('foo.bar.somethingElse')).toBeUndefined();
        }));

      describe('when the value has an additionalProperties schema', () =>
        it('validates properties of the object against that schema', () => {
          core.config.setSchema('foo.bar', {
            type: 'object',
            properties: {
              anInt: {
                type: 'integer',
                default: 12
              }
            },
            additionalProperties: {
              type: 'string'
            }
          });

          expect(
            core.config.set('foo.bar', { anInt: 5, somethingElse: 'ok' })
          ).toBe(true);
          expect(core.config.get('foo.bar.anInt')).toBe(5);
          expect(core.config.get('foo.bar.somethingElse')).toBe('ok');

          expect(core.config.set('foo.bar.somethingElse', 7)).toBe(false);
          expect(core.config.get('foo.bar.somethingElse')).toBe('ok');

          expect(
            core.config.set('foo.bar', { anInt: 6, somethingElse: 7 })
          ).toBe(true);
          expect(core.config.get('foo.bar.anInt')).toBe(6);
          expect(core.config.get('foo.bar.somethingElse')).toBe(undefined);
        }));
    });

    describe('when the value has an "array" type', () => {
      beforeEach(() => {
        const schema = {
          type: 'array',
          default: [1, 2, 3],
          items: {
            type: 'integer'
          }
        };
        core.config.setSchema('foo.bar', schema);
      });

      it('converts an array of strings to an array of ints', () => {
        core.config.set('foo.bar', ['2', '3', '4']);
        expect(core.config.get('foo.bar')).toEqual([2, 3, 4]);
      });

      it('does not allow setting children of that key-path', () => {
        expect(core.config.set('foo.bar.child', 123)).toBe(false);
        expect(core.config.set('foo.bar.child.grandchild', 123)).toBe(false);
        expect(core.config.get('foo.bar')).toEqual([1, 2, 3]);
      });
    });

    describe('when the value has a "color" type', () => {
      beforeEach(() => {
        const schema = {
          type: 'color',
          default: 'white'
        };
        core.config.setSchema('foo.bar.aColor', schema);
      });

      it('returns a Color object', () => {
        let color = core.config.get('foo.bar.aColor');
        expect(color.toHexString()).toBe('#ffffff');
        expect(color.toRGBAString()).toBe('rgba(255, 255, 255, 1)');

        color.red = 0;
        color.green = 0;
        color.blue = 0;
        color.alpha = 0;
        core.config.set('foo.bar.aColor', color);

        color = core.config.get('foo.bar.aColor');
        expect(color.toHexString()).toBe('#000000');
        expect(color.toRGBAString()).toBe('rgba(0, 0, 0, 0)');

        color.red = 300;
        color.green = -200;
        color.blue = -1;
        color.alpha = 'not see through';
        core.config.set('foo.bar.aColor', color);

        color = core.config.get('foo.bar.aColor');
        expect(color.toHexString()).toBe('#ff0000');
        expect(color.toRGBAString()).toBe('rgba(255, 0, 0, 1)');

        color.red = 11;
        color.green = 11;
        color.blue = 124;
        color.alpha = 1;
        core.config.set('foo.bar.aColor', color);

        color = core.config.get('foo.bar.aColor');
        expect(color.toHexString()).toBe('#0b0b7c');
        expect(color.toRGBAString()).toBe('rgba(11, 11, 124, 1)');
      });

      it('coerces various types to a color object', () => {
        core.config.set('foo.bar.aColor', 'red');
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 255,
          green: 0,
          blue: 0,
          alpha: 1
        });
        core.config.set('foo.bar.aColor', '#020');
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 0,
          green: 34,
          blue: 0,
          alpha: 1
        });
        core.config.set('foo.bar.aColor', '#abcdef');
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 171,
          green: 205,
          blue: 239,
          alpha: 1
        });
        core.config.set('foo.bar.aColor', 'rgb(1,2,3)');
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 1,
          green: 2,
          blue: 3,
          alpha: 1
        });
        core.config.set('foo.bar.aColor', 'rgba(4,5,6,.7)');
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 4,
          green: 5,
          blue: 6,
          alpha: 0.7
        });
        core.config.set('foo.bar.aColor', 'hsl(120,100%,50%)');
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 0,
          green: 255,
          blue: 0,
          alpha: 1
        });
        core.config.set('foo.bar.aColor', 'hsla(120,100%,50%,0.3)');
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 0,
          green: 255,
          blue: 0,
          alpha: 0.3
        });
        core.config.set('foo.bar.aColor', {
          red: 100,
          green: 255,
          blue: 2,
          alpha: 0.5
        });
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 100,
          green: 255,
          blue: 2,
          alpha: 0.5
        });
        core.config.set('foo.bar.aColor', { red: 255 });
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 255,
          green: 0,
          blue: 0,
          alpha: 1
        });
        core.config.set('foo.bar.aColor', { red: 1000 });
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 255,
          green: 0,
          blue: 0,
          alpha: 1
        });
        core.config.set('foo.bar.aColor', { red: 'dark' });
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 0,
          green: 0,
          blue: 0,
          alpha: 1
        });
      });

      it('reverts back to the default value when undefined is passed to set', () => {
        core.config.set('foo.bar.aColor', undefined);
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 255,
          green: 255,
          blue: 255,
          alpha: 1
        });
      });

      it('will not set non-colors', () => {
        core.config.set('foo.bar.aColor', null);
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 255,
          green: 255,
          blue: 255,
          alpha: 1
        });

        core.config.set('foo.bar.aColor', 'nope');
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 255,
          green: 255,
          blue: 255,
          alpha: 1
        });

        core.config.set('foo.bar.aColor', 30);
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 255,
          green: 255,
          blue: 255,
          alpha: 1
        });

        core.config.set('foo.bar.aColor', false);
        expect(core.config.get('foo.bar.aColor')).toEqual({
          red: 255,
          green: 255,
          blue: 255,
          alpha: 1
        });
      });

      it('returns a clone of the Color when returned in a parent object', () => {
        const color1 = core.config.get('foo.bar').aColor;
        const color2 = core.config.get('foo.bar').aColor;
        expect(color1.toRGBAString()).toBe('rgba(255, 255, 255, 1)');
        expect(color2.toRGBAString()).toBe('rgba(255, 255, 255, 1)');
        expect(color1).not.toBe(color2);
        expect(color1).toEqual(color2);
      });
    });

    describe('when the `enum` key is used', () => {
      beforeEach(() => {
        const schema = {
          type: 'object',
          properties: {
            str: {
              type: 'string',
              default: 'ok',
              enum: ['ok', 'one', 'two']
            },
            int: {
              type: 'integer',
              default: 2,
              enum: [2, 3, 5]
            },
            arr: {
              type: 'array',
              default: ['one', 'two'],
              items: {
                type: 'string',
                enum: ['one', 'two', 'three']
              }
            },
            str_options: {
              type: 'string',
              default: 'one',
              enum: [
                { value: 'one', description: 'One' },
                'two',
                { value: 'three', description: 'Three' }
              ]
            }
          }
        };

        core.config.setSchema('foo.bar', schema);
      });

      it('will only set a string when the string is in the enum values', () => {
        expect(core.config.set('foo.bar.str', 'nope')).toBe(false);
        expect(core.config.get('foo.bar.str')).toBe('ok');

        expect(core.config.set('foo.bar.str', 'one')).toBe(true);
        expect(core.config.get('foo.bar.str')).toBe('one');
      });

      it('will only set an integer when the integer is in the enum values', () => {
        expect(core.config.set('foo.bar.int', '400')).toBe(false);
        expect(core.config.get('foo.bar.int')).toBe(2);

        expect(core.config.set('foo.bar.int', '3')).toBe(true);
        expect(core.config.get('foo.bar.int')).toBe(3);
      });

      it('will only set an array when the array values are in the enum values', () => {
        expect(core.config.set('foo.bar.arr', ['one', 'five'])).toBe(true);
        expect(core.config.get('foo.bar.arr')).toEqual(['one']);

        expect(core.config.set('foo.bar.arr', ['two', 'three'])).toBe(true);
        expect(core.config.get('foo.bar.arr')).toEqual(['two', 'three']);
      });

      it('will honor the enum when specified as an array', () => {
        expect(core.config.set('foo.bar.str_options', 'one')).toBe(true);
        expect(core.config.get('foo.bar.str_options')).toEqual('one');

        expect(core.config.set('foo.bar.str_options', 'two')).toBe(true);
        expect(core.config.get('foo.bar.str_options')).toEqual('two');

        expect(core.config.set('foo.bar.str_options', 'One')).toBe(false);
        expect(core.config.get('foo.bar.str_options')).toEqual('two');
      });
    });
  });

  describe('when .set/.unset is called prior to .resetUserSettings', () => {
    beforeEach(() => {
      core.config.settingsLoaded = false;
    });

    it('ensures that early set and unset calls are replayed after the config is loaded from disk', () => {
      core.config.unset('foo.bar');
      core.config.set('foo.qux', 'boo');

      expect(core.config.get('foo.bar')).toBeUndefined();
      expect(core.config.get('foo.qux')).toBe('boo');
      expect(core.config.get('do.ray')).toBeUndefined();

      advanceClock(100);
      expect(savedSettings.length).toBe(0);

      core.config.resetUserSettings({
        '*': {
          foo: {
            bar: 'baz'
          },
          do: {
            ray: 'me'
          }
        }
      });

      advanceClock(100);
      expect(savedSettings.length).toBe(1);
      expect(core.config.get('foo.bar')).toBeUndefined();
      expect(core.config.get('foo.qux')).toBe('boo');
      expect(core.config.get('do.ray')).toBe('me');
    });
  });

  describe('project specific settings', () => {
    describe('config.resetProjectSettings', () => {
      it('gracefully handles invalid config objects', () => {
        core.config.resetProjectSettings({});
        expect(core.config.get('foo.bar')).toBeUndefined();
      });
    });

    describe('config.get', () => {
      const dummyPath = '/Users/dummy/path.json';
      describe('project settings', () => {
        it('returns a deep clone of the property value', () => {
          core.config.resetProjectSettings(
            { '*': { value: { array: [1, { b: 2 }, 3] } } },
            dummyPath
          );
          const retrievedValue = core.config.get('value');
          retrievedValue.array[0] = 4;
          retrievedValue.array[1].b = 2.1;
          expect(core.config.get('value')).toEqual({ array: [1, { b: 2 }, 3] });
        });

        it('properly gets project settings', () => {
          core.config.resetProjectSettings({ '*': { foo: 'wei' } }, dummyPath);
          expect(core.config.get('foo')).toBe('wei');
          core.config.resetProjectSettings(
            { '*': { foo: { bar: 'baz' } } },
            dummyPath
          );
          expect(core.config.get('foo.bar')).toBe('baz');
        });

        it('gets project settings with higher priority than regular settings', () => {
          core.config.set('foo', 'bar');
          core.config.resetProjectSettings({ '*': { foo: 'baz' } }, dummyPath);
          expect(core.config.get('foo')).toBe('baz');
        });

        it('correctly gets nested and scoped properties for project settings', () => {
          expect(core.config.set('foo.bar.str', 'global')).toBe(true);
          expect(
            core.config.set('foo.bar.str', 'scoped', {
              scopeSelector: '.source.js'
            })
          ).toBe(true);
          expect(core.config.get('foo.bar.str')).toBe('global');
          expect(
            core.config.get('foo.bar.str', { scope: ['.source.js'] })
          ).toBe('scoped');
        });

        it('returns a deep clone of the property value', () => {
          core.config.set('value', { array: [1, { b: 2 }, 3] });
          const retrievedValue = core.config.get('value');
          retrievedValue.array[0] = 4;
          retrievedValue.array[1].b = 2.1;
          expect(core.config.get('value')).toEqual({ array: [1, { b: 2 }, 3] });
        });

        it('gets scoped values correctly', () => {
          core.config.set('foo', 'bam', { scope: ['second'] });
          expect(core.config.get('foo', { scopeSelector: 'second' })).toBe(
            'bam'
          );
          core.config.resetProjectSettings(
            { '*': { foo: 'baz' }, second: { foo: 'bar' } },
            dummyPath
          );
          expect(core.config.get('foo', { scopeSelector: 'second' })).toBe(
            'baz'
          );
          core.config.clearProjectSettings();
          expect(core.config.get('foo', { scopeSelector: 'second' })).toBe(
            'bam'
          );
        });

        it('clears project settings correctly', () => {
          core.config.set('foo', 'bar');
          expect(core.config.get('foo')).toBe('bar');
          core.config.resetProjectSettings(
            { '*': { foo: 'baz' }, second: { foo: 'bar' } },
            dummyPath
          );
          expect(core.config.get('foo')).toBe('baz');
          expect(core.config.getSources().length).toBe(1);
          core.config.clearProjectSettings();
          expect(core.config.get('foo')).toBe('bar');
          expect(core.config.getSources().length).toBe(0);
        });
      });
    });

    describe('config.getAll', () => {
      const dummyPath = '/Users/dummy/path.json';
      it('gets settings in the same way .get would return them', () => {
        core.config.resetProjectSettings({ '*': { a: 'b' } }, dummyPath);
        core.config.set('a', 'f');
        expect(core.config.getAll('a')).toEqual([
          {
            scopeSelector: '*',
            value: 'b'
          }
        ]);
      });
    });
  });
});
