/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const List = require('../lib/list');
const ListView = require('../lib/list-view');

describe('ListView', function() {
  let [list, view, container] = [];

  beforeEach(function() {
    list = new List('name');
    container = document.createElement('div');
    return view = new ListView(list, container, function(item) {
      const element = document.createElement('div');
      element.classList.add(item.name);
      element.textContent = `${item.name}|${item.text}`;
      return {element, destroy() { return element.remove(); }};
  });});

  it('updates the list when the items are changed', function() {
    expect(container.children.length).toBe(0);

    let items = [{name: 'one', text: 'a'}, {name: 'two', text: 'b'}];
    list.setItems(items);
    expect(container.children.length).toBe(2);
    expect(container.querySelector('.one').textContent).toBe('one|a');
    expect(container.querySelector('.two').textContent).toBe('two|b');

    items = [{name: 'three', text: 'c'}, {name: 'two', text: 'b'}];
    list.setItems(items);
    expect(container.children.length).toBe(2);
    expect(container.querySelector('.one')).not.toExist();
    expect(container.querySelector('.two').textContent).toBe('two|b');
    return expect(container.querySelector('.three').textContent).toBe('three|c');
  });

  it('filters views', function() {
    const items = [
      {name: 'one', text: '', filterText: 'x'},
      {name: 'two', text: '', filterText: 'y'},
      {name: 'three', text: '', filterText: 'x'},
      {name: 'four', text: '', filterText: 'z'}
    ];

    list.setItems(items);
    const views = view.filterViews(item => item.filterText === 'x');

    expect(views).toHaveLength(2);
    expect(views[0].element.textContent).toBe('one|');
    return expect(views[1].element.textContent).toBe('three|');
  });

  return it('filters views after an update', function() {
    let items = [
      {name: 'one', text: '', filterText: 'x'},
      {name: 'two', text: '', filterText: 'y'},
      {name: 'three', text: '', filterText: 'x'},
      {name: 'four', text: '', filterText: 'z'}
    ];
    list.setItems(items);

    items = [
      {name: 'one', text: '', filterText: 'x'},
      {name: 'two', text: '', filterText: 'y'},
      {name: 'three', text: '', filterText: 'x'},
      {name: 'four', text: '', filterText: 'z'}
    ];
    list.setItems(items);
    const views = view.filterViews(item => item.filterText === 'x');

    expect(views).toHaveLength(2);
    expect(views[0].element.textContent).toBe('one|');
    return expect(views[1].element.textContent).toBe('three|');
  });
});
