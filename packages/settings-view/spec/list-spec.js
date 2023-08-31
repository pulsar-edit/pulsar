
const List = require('../lib/list');

describe('List', () => {
  let list = null;

  beforeEach(() => list = new List('name'));

  it('emits add and remove events when setting items', () => {
    const addHandler = jasmine.createSpy();
    const removeHandler = jasmine.createSpy();
    list.onDidAddItem(addHandler);
    list.onDidRemoveItem(removeHandler);

    let items = [{name: 'one', text: 'a'}, {name: 'two', text: 'b'}];
    list.setItems(items);
    expect(addHandler.callCount).toBe(2);
    expect(removeHandler.callCount).toBe(0);

    addHandler.reset();
    removeHandler.reset();

    items = [{name: 'three', text: 'c'}, {name: 'two', text: 'b'}];
    list.setItems(items);
    expect(addHandler.callCount).toBe(1);
    expect(removeHandler.callCount).toBe(1);
    expect(addHandler.mostRecentCall.args[0]).toEqual({name: 'three', text: 'c'});
    expect(removeHandler.mostRecentCall.args[0]).toEqual({name: 'one', text: 'a'});
    expect(list.getItems()).toEqual(items);

    addHandler.reset();
    removeHandler.reset();
    items.push({name: 'four'});
    list.setItems(items);
    expect(addHandler.callCount).toBe(1);
  });
});
