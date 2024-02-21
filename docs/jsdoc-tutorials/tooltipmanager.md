## Examples

The essence of displaying a tooltip

```js
// display it
const disposable = atom.tooltips.add(div, { title: 'This is a tooltip' });

// remove it
disposable.dispose();
```

In practice there are usually multiple tooltips. So we add them to a CompositeDisposable

```js
const { CompositeDisposable } = require('atom');
const subscriptions = new CompositeDisposable();

const div1 = document.createElement('div');
const div2 = document.createElement('div');
subscriptions.add(atom.tooltips.add(div1, { title: 'This is a tooltip' }));
subscriptions.add(atom.tooltips.add(div2, { title: 'Another tooltip' }));

// remove them all
subscriptions.dispose();
```

You can display a key binding in the tooltip as well with the `keyBindingCommand` option.

```js
disposable = atom.tooltips.add(this.caseOptionButton, {
  title: 'Match Case',
  keyBindingCommand: 'find-and-replace:toggle-case-option',
  keyBindingTarget: this.findEditor.element
});
```
