## Classes

<dl>
<dt><a href="#AtomEnvironment">AtomEnvironment</a></dt>
<dd><p>Pulsar global for dealing with packages, themes, menus, and the window.</p>
<p>An instance of this class is always available as the <code>atom</code> global.</p>
</dd>
<dt><a href="#Clipboard">Clipboard</a></dt>
<dd></dd>
</dl>

<a name="AtomEnvironment"></a>

## AtomEnvironment
Pulsar global for dealing with packages, themes, menus, and the window.An instance of this class is always available as the `atom` global.

**Kind**: global class  

* [AtomEnvironment](#AtomEnvironment)
    * _instance_
        * [.clipboard](#AtomEnvironment+clipboard) : [<code>Clipboard</code>](#Clipboard)
        * [.deserializers](#AtomEnvironment+deserializers) : <code>DeserializerManager</code>
        * [.views](#AtomEnvironment+views) : <code>ViewRegistry</code>
        * [.notifications](#AtomEnvironment+notifications) : <code>NotificationManager</code>
        * [.config](#AtomEnvironment+config) : <code>Config</code>
        * [.keymaps](#AtomEnvironment+keymaps) : <code>KeymapManager</code>
        * [.tooltips](#AtomEnvironment+tooltips) : <code>TooltipManager</code>
        * [.commands](#AtomEnvironment+commands) : <code>CommandRegistry</code>
        * [.grammars](#AtomEnvironment+grammars) : <code>GrammarRegistry</code>
        * [.styles](#AtomEnvironment+styles) : <code>StyleManager</code>
        * [.packages](#AtomEnvironment+packages) : <code>PackageManager</code>
        * [.themes](#AtomEnvironment+themes) : <code>ThemeManager</code>
        * [.menu](#AtomEnvironment+menu) : <code>MenuManager</code>
        * [.contextMenu](#AtomEnvironment+contextMenu) : <code>ContextMenuManager</code>
        * [.project](#AtomEnvironment+project) : <code>Project</code>
        * [.textEditors](#AtomEnvironment+textEditors) : <code>TextEditorRegistry</code>
        * [.workspace](#AtomEnvironment+workspace) : <code>Workspace</code>
        * [.history](#AtomEnvironment+history) : <code>HistoryManager</code>
        * _Messaging the User_
            * [.beep()](#AtomEnvironment+beep)
    * _static_
        * [.preloadPackages](#AtomEnvironment.preloadPackages) ℗
        * _Event Subscription_
            * [.onDidBeep(callback)](#AtomEnvironment.onDidBeep) ⇒ <code>Disposable</code>

<a name="AtomEnvironment+clipboard"></a>

### atomEnvironment.clipboard : [<code>Clipboard</code>](#Clipboard)
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+deserializers"></a>

### atomEnvironment.deserializers : <code>DeserializerManager</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+views"></a>

### atomEnvironment.views : <code>ViewRegistry</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+notifications"></a>

### atomEnvironment.notifications : <code>NotificationManager</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+config"></a>

### atomEnvironment.config : <code>Config</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+keymaps"></a>

### atomEnvironment.keymaps : <code>KeymapManager</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+tooltips"></a>

### atomEnvironment.tooltips : <code>TooltipManager</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+commands"></a>

### atomEnvironment.commands : <code>CommandRegistry</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+grammars"></a>

### atomEnvironment.grammars : <code>GrammarRegistry</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+styles"></a>

### atomEnvironment.styles : <code>StyleManager</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+packages"></a>

### atomEnvironment.packages : <code>PackageManager</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+themes"></a>

### atomEnvironment.themes : <code>ThemeManager</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+menu"></a>

### atomEnvironment.menu : <code>MenuManager</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+contextMenu"></a>

### atomEnvironment.contextMenu : <code>ContextMenuManager</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+project"></a>

### atomEnvironment.project : <code>Project</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+textEditors"></a>

### atomEnvironment.textEditors : <code>TextEditorRegistry</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+workspace"></a>

### atomEnvironment.workspace : <code>Workspace</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+history"></a>

### atomEnvironment.history : <code>HistoryManager</code>
**Kind**: instance property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
<a name="AtomEnvironment+beep"></a>

### atomEnvironment.beep()
Visually and audibly trigger a beep.

**Kind**: instance method of [<code>AtomEnvironment</code>](#AtomEnvironment)  
**Category**: Messaging the User  
**Emits**: <code>event:beep</code>  
<a name="AtomEnvironment.preloadPackages"></a>

### AtomEnvironment.preloadPackages ℗
Returns output of `preloadPackages()` for this Classes Instance of `Packages`.

**Kind**: static property of [<code>AtomEnvironment</code>](#AtomEnvironment)  
**Access**: private  
<a name="AtomEnvironment.onDidBeep"></a>

### AtomEnvironment.onDidBeep(callback) ⇒ <code>Disposable</code>
Invoke the given callback whenever [::beep](::beep) is called.

**Kind**: static method of [<code>AtomEnvironment</code>](#AtomEnvironment)  
**Returns**: <code>Disposable</code> - on which `.dispose()` can be called to unsubscribe.  
**Category**: Event Subscription  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Function to be called whenever [::beep](::beep) is called. |

<a name="Clipboard"></a>

## Clipboard
**Kind**: global class  
<a name="new_Clipboard_new"></a>

### new Clipboard()
Represents the clipboard used for copying and pasting in Pulsar.An instance of this class is always available as the `atom.clipboard` global.

**Example**  
```js
// returns 'hello'atom.clipboard.write('hello');console.log(atom.clipboard.read());
```
