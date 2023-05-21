## Classes

<dl>
<dt><a href="#AtomEnvironment">AtomEnvironment</a></dt>
<dd><p>Pulsar global for dealing with packages, themes, menus, and the window.</p>
<p>An instance of this class is always available as the <code>atom</code> global.</p>
</dd>
<dt><a href="#Clipboard">Clipboard</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#etch">etch</a></dt>
<dd></dd>
<dt><a href="#css">css</a></dt>
<dd><p>This file will manage the updating of <code>autocomplete-css</code> <code>completions.json</code>.
  We will mainly utilize <code>@webref/css</code>.listAll() function that returns a full CSS
  list of all properties seperated by their spec shortname. An example
  of this format is defined below for ease of future modifications.</p>
<p>  Some important notes about the data contained here:
    - Often times the <code>value</code> within the <code>property</code> will be in the following format:
      <code>&lt;valueGroupName&gt;</code> or even <code>&lt;valueGroupName&gt; | value | value2</code> or just <code>value | value2</code>
      It will be important to build a parser that can handle this format.
      The <code>&lt;valueGroupName&gt;</code> then can be realized via that specs <code>values</code> where
      <code>values[x].name</code> will match the <code>&lt;valueGroupName&gt;</code>. Another important note about
      handling values here is that oftentimes <code>values[x].values[]</code> won&#39;t actually
      contain all possible values. And instead this must be handled by checking
      <code>values[x].value</code> which is another string of <code>&lt;valueGroupName&gt; | value</code>.
      So this should be handled by the same parser.
    - Additionally an important note is that nowhere in this data do we get any kind
      of description about the data that could lend a hand in being documentation.
      So the documentation must be gathered seperatly. Likely the best way to collect
      our documentation data is via <code>mdn/content</code>.
      Within <code>content/files/en-us/web/css</code> is a directory of folders titled
      by the name of properties.</p>
<pre><code>The last important thing to note here:
  MDN doesn&#39;t have docs on everything. And that&#39;s a good thing. But it means
  many of our items don&#39;t have any kind of description. For this situation
  we have `manual-property-desc.json` which is a list of manually updated
  descriptions for properties where there are none. This was a last resort
  intended to provide the highest quality of completions possible.
  Overtime many items on this list will likely be able to be removed just as
  new ones are added. After running the update script you&#39;ll see a warning
  saying how many properties are without completions that would then need to
  be added to the JSON file.
</code></pre>
<p>  &quot;spec-shortname&quot;: {
    &quot;spec&quot;: {
      &quot;title&quot;: &quot;&quot;,
      &quot;url&quot;: &quot;&quot;
    },
    &quot;properties&quot;: [
      {
        &quot;name&quot;: &quot;&quot;,
        &quot;value&quot;: &quot;&quot;,
        &quot;initial&quot;: &quot;&quot;,
        &quot;appliesTo&quot;: &quot;&quot;,
        &quot;percentages&quot;: &quot;&quot;,
        &quot;computedValue&quot;: &quot;&quot;,
        &quot;canonicalOrder&quot;: &quot;&quot;,
        &quot;animationType&quot;: &quot;&quot;,
        &quot;media&quot;: &quot;&quot;,
        &quot;styleDeclaration&quot;: [ &quot;&quot;, &quot;&quot;, &quot;&quot; ]
      }
    ],
    &quot;atrules&quot;: [
      {
        &quot;name&quot;: &quot;&quot;,
        &quot;descriptors&quot;: [
          {
            &quot;name&quot;: &quot;&quot;,
            &quot;for&quot;: &quot;&quot;,
            &quot;value&quot;: &quot;&quot;,
            &quot;type&quot;: &quot;&quot;
          }
        ]
      }
    ],
    &quot;selectors&quot;: [],
    &quot;values&quot;: [
      {
        &quot;name&quot;: &quot;&quot;,
        &quot;type&quot;: &quot;&quot;,
        &quot;prose&quot;: &quot;Optional description&quot;,
        &quot;value&quot;: &quot;&quot;,
        &quot;values&quot;: [
          {
            &quot;name&quot;: &quot;&quot;,
            &quot;prose&quot;: &quot;Optional Description&quot;,
            &quot;type&quot;: &quot;&quot;,
            &quot;value&quot;: &quot;&quot;
          }
        ]
      }
    ],
    &quot;warnings&quot;: []
  }</p>
</dd>
<dt><a href="#chromiumElementsShim">chromiumElementsShim</a></dt>
<dd><p>This file will manage the updating of <code>autocomplete-html</code> <code>completions.json</code>
  We will partially utilize <code>@webref/elements</code> <code>.listAll()</code> function that returns
  a full list of HTML Elements along with a defined <code>interface</code>.
  To use this <code>interface</code> in any meaningful way, we will utilize the dataset
  of Attributes that apply to each <code>interface</code> from Chromiums DevTools resource
  <code>https://github.com/ChromeDevTools/devtools-frontend</code>.
  Finally from here we will utilize <code>https://github.com/mdn/content</code> to parse
  the Markdown docs of MDN&#39;s website to retreive descriptions for each element.</p>
<p>  Now for a summary of our <code>completions.json</code> file we aim to generate.
  There are two top level elements, <code>tags</code> and <code>attributes</code>, both objects.
  Within <code>tags</code> we expect the following:
  &quot;tags&quot;: {
    &quot;a&quot;: {
      &quot;attributes&quot;: [ &quot;href&quot;, &quot;hreflang&quot;, &quot;media&quot;, &quot;rel&quot;, &quot;target&quot;, &quot;type&quot; ],
      &quot;description&quot;: &quot;.....&quot;
    }
  };</p>
<p>  When an entry contains no <code>attributes</code> there is no empty array, the element
  simply doesn&#39;t exist.</p>
<p>  The <code>attributes</code> object contains keys of different elements that themselves
  are objects that can contain several valid keys.</p>
<ul>
<li>global: Seems to be used exclusively for Global Attributes. Is a boolean
    which when false, the key does not appear.</li>
<li>type: A ?type? for the attribute. It&#39;s meaning is not immediately known.
  Nor a way to reliabley programatically collect it. Some discovered values:</li>
</ul>
<p>cssStyle: Exclusively used for <code>class</code> attribute
boolean: Attributes that only accept <code>true</code> or <code>false</code>
flag: For attributes that don&#39;t require or accept values. eg autoplay
cssId: Exclusively used for the <code>id</code> attribute
color: Exclusively used for the <code>bgcolor</code> attribute
style: Exclusively used for the <code>style</code> attribute</p>
<ul>
<li>description: A text description of the attribute</li>
<li>attribOption: A string array of valid values that can exist within the attribute.
          Such as the case with <code>rel</code> where only so many valid options exist.</li>
</ul>
<p>  Although with our data sources mentioned above, we are able to collect nearly
  all the data needed. Except the <code>type</code> that is defined within our
  <code>completions.json</code> as well as the <code>attribOption</code> within our completions.</p>
<p>  Studying these closer reveals that all attributes listing with our <code>completions.json</code>
  do not appear elsewhere, and are nearly all global attributes.</p>
<p>  In this case since there is no sane way to collect this data, we will leave this
  list as a manually maintained section of our <code>completions.json</code>.
  This does mean that <code>curated-attributes.json</code> is a static document that
  will require manual updating in the future. Or most ideally, will find a way
  to automatically generate the needed data.</p>
</dd>
<dt><a href="#update">update</a></dt>
<dd><p>This file aims to run some short simple tests against <code>update.js</code>. Focusing
 mainly on the Regex used within <code>sanitizeDescription()</code></p>
</dd>
<dt><a href="#fs">fs</a></dt>
<dd></dd>
<dt><a href="#dalek">dalek</a></dt>
<dd></dd>
<dt><a href="#assert">assert</a></dt>
<dd></dd>
<dt><a href="#path">path</a></dt>
<dd></dd>
<dt><a href="#path">path</a></dt>
<dd></dd>
<dt><a href="#path">path</a></dt>
<dd></dd>
<dt><a href="#_">_</a></dt>
<dd></dd>
<dt><a href="#path">path</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#beforeEach">beforeEach()</a></dt>
<dd></dd>
<dt><a href="#beforeEach">beforeEach()</a></dt>
<dd></dd>
<dt><a href="#conditionPromise">conditionPromise()</a></dt>
<dd></dd>
<dt><a href="#conditionPromise">conditionPromise()</a></dt>
<dd></dd>
<dt><a href="#destroy">destroy()</a></dt>
<dd></dd>
<dt><a href="#destroyChildren">destroyChildren()</a></dt>
<dd></dd>
<dt><a href="#releaseChildren">releaseChildren()</a></dt>
<dd></dd>
<dt><a href="#subscribeToRepository">subscribeToRepository()</a></dt>
<dd></dd>
<dt><a href="#updateDiffs">updateDiffs()</a></dt>
<dd></dd>
<dt><a href="#beforeEach">beforeEach()</a></dt>
<dd></dd>
<dt><a href="#beforeEach">beforeEach()</a></dt>
<dd></dd>
<dt><a href="#beforeEach">beforeEach()</a></dt>
<dd></dd>
<dt><a href="#beforeEach">beforeEach()</a></dt>
<dd></dd>
<dt><a href="#beforeEach">beforeEach()</a></dt>
<dd></dd>
<dt><a href="#beforeEach">beforeEach()</a></dt>
<dd></dd>
<dt><a href="#conditionPromise">conditionPromise()</a></dt>
<dd></dd>
<dt><a href="#beforeEach">beforeEach()</a></dt>
<dd></dd>
</dl>

<a name="AtomEnvironment"></a>

## AtomEnvironment
Pulsar global for dealing with packages, themes, menus, and the window.

An instance of this class is always available as the `atom` global.

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
Represents the clipboard used for copying and pasting in Pulsar.

An instance of this class is always available as the `atom.clipboard` global.

**Example**  
```js
// returns 'hello'
atom.clipboard.write('hello');

console.log(atom.clipboard.read());
```
<a name="etch"></a>

## etch
**Kind**: global constant  
**Jsx**: etch.dom  
<a name="css"></a>

## css
This file will manage the updating of `autocomplete-css` `completions.json`.
  We will mainly utilize `@webref/css`.listAll() function that returns a full CSS
  list of all properties seperated by their spec shortname. An example
  of this format is defined below for ease of future modifications.

  Some important notes about the data contained here:
    - Often times the `value` within the `property` will be in the following format:
      `<valueGroupName>` or even `<valueGroupName> | value | value2` or just `value | value2`
      It will be important to build a parser that can handle this format.
      The `<valueGroupName>` then can be realized via that specs `values` where
      `values[x].name` will match the `<valueGroupName>`. Another important note about
      handling values here is that oftentimes `values[x].values[]` won't actually
      contain all possible values. And instead this must be handled by checking
      `values[x].value` which is another string of `<valueGroupName> | value`.
      So this should be handled by the same parser.
    - Additionally an important note is that nowhere in this data do we get any kind
      of description about the data that could lend a hand in being documentation.
      So the documentation must be gathered seperatly. Likely the best way to collect
      our documentation data is via `mdn/content`.
      Within `content/files/en-us/web/css` is a directory of folders titled
      by the name of properties.

    The last important thing to note here:
      MDN doesn't have docs on everything. And that's a good thing. But it means
      many of our items don't have any kind of description. For this situation
      we have `manual-property-desc.json` which is a list of manually updated
      descriptions for properties where there are none. This was a last resort
      intended to provide the highest quality of completions possible.
      Overtime many items on this list will likely be able to be removed just as
      new ones are added. After running the update script you'll see a warning
      saying how many properties are without completions that would then need to
      be added to the JSON file.

  "spec-shortname": {
    "spec": {
      "title": "",
      "url": ""
    },
    "properties": [
      {
        "name": "",
        "value": "",
        "initial": "",
        "appliesTo": "",
        "percentages": "",
        "computedValue": "",
        "canonicalOrder": "",
        "animationType": "",
        "media": "",
        "styleDeclaration": [ "", "", "" ]
      }
    ],
    "atrules": [
      {
        "name": "",
        "descriptors": [
          {
            "name": "",
            "for": "",
            "value": "",
            "type": ""
          }
        ]
      }
    ],
    "selectors": [],
    "values": [
      {
        "name": "",
        "type": "",
        "prose": "Optional description",
        "value": "",
        "values": [
          {
            "name": "",
            "prose": "Optional Description",
            "type": "",
            "value": ""
          }
        ]
      }
    ],
    "warnings": []
  }

**Kind**: global constant  
<a name="chromiumElementsShim"></a>

## chromiumElementsShim
This file will manage the updating of `autocomplete-html` `completions.json`
  We will partially utilize `@webref/elements` `.listAll()` function that returns
  a full list of HTML Elements along with a defined `interface`.
  To use this `interface` in any meaningful way, we will utilize the dataset
  of Attributes that apply to each `interface` from Chromiums DevTools resource
  `https://github.com/ChromeDevTools/devtools-frontend`.
  Finally from here we will utilize `https://github.com/mdn/content` to parse
  the Markdown docs of MDN's website to retreive descriptions for each element.

  Now for a summary of our `completions.json` file we aim to generate.
  There are two top level elements, `tags` and `attributes`, both objects.
  Within `tags` we expect the following:
  "tags": {
    "a": {
      "attributes": [ "href", "hreflang", "media", "rel", "target", "type" ],
      "description": "....."
    }
  };

  When an entry contains no `attributes` there is no empty array, the element
  simply doesn't exist.

  The `attributes` object contains keys of different elements that themselves
  are objects that can contain several valid keys.
  - global: Seems to be used exclusively for Global Attributes. Is a boolean
            which when false, the key does not appear.
  - type: A ?type? for the attribute. It's meaning is not immediately known.
          Nor a way to reliabley programatically collect it. Some discovered values:
cssStyle: Exclusively used for `class` attribute
boolean: Attributes that only accept `true` or `false`
flag: For attributes that don't require or accept values. eg autoplay
cssId: Exclusively used for the `id` attribute
color: Exclusively used for the `bgcolor` attribute
style: Exclusively used for the `style` attribute
  - description: A text description of the attribute
  - attribOption: A string array of valid values that can exist within the attribute.
                  Such as the case with `rel` where only so many valid options exist.

  Although with our data sources mentioned above, we are able to collect nearly
  all the data needed. Except the `type` that is defined within our
  `completions.json` as well as the `attribOption` within our completions.

  Studying these closer reveals that all attributes listing with our `completions.json`
  do not appear elsewhere, and are nearly all global attributes.

  In this case since there is no sane way to collect this data, we will leave this
  list as a manually maintained section of our `completions.json`.
  This does mean that `curated-attributes.json` is a static document that
  will require manual updating in the future. Or most ideally, will find a way
  to automatically generate the needed data.

**Kind**: global constant  
<a name="update"></a>

## update
This file aims to run some short simple tests against `update.js`. Focusing
 mainly on the Regex used within `sanitizeDescription()`

**Kind**: global constant  
<a name="fs"></a>

## fs
**Kind**: global constant  
**Babel**:   
<a name="dalek"></a>

## dalek
**Kind**: global constant  
**Babel**:   
<a name="assert"></a>

## assert
**Kind**: global constant  
**Babel**:   
<a name="path"></a>

## path
**Kind**: global constant  
**Babel**:   
<a name="path"></a>

## path
**Kind**: global constant  
**Babel**:   
<a name="path"></a>

## path
**Kind**: global constant  
**Babel**:   
<a name="_"></a>

## \_
**Kind**: global constant  
**Babel**:   
<a name="path"></a>

## path
**Kind**: global constant  
**Babel**:   
<a name="beforeEach"></a>

## beforeEach()
**Kind**: global function  
**Babel**:   
<a name="beforeEach"></a>

## beforeEach()
**Kind**: global function  
**Babel**:   
<a name="conditionPromise"></a>

## conditionPromise()
**Kind**: global function  
**Babel**:   
<a name="conditionPromise"></a>

## conditionPromise()
**Kind**: global function  
**Babel**:   
<a name="destroy"></a>

## destroy()
**Kind**: global function  
**Describe**: Handles tear down of destructables and subscriptions.
  Does not handle release of memory. This method should only be called
  just before this object is freed, and should only tear down the main
  object components that are guarunteed to exist at all times.  
<a name="destroyChildren"></a>

## destroyChildren()
**Kind**: global function  
**Describe**: Destroys this objects children (non-freeing), it's intended
  to be an ease-of use function for maintaing this object. This method
  should only tear down objects that are selectively allocated upon
  repository discovery.

  Example: this.diffs only exists when we have a repository.  
<a name="releaseChildren"></a>

## releaseChildren()
**Kind**: global function  
**Describe**: The memory releasing complement function of `destroyChildren`.
  frees the memory allocated at all child object storage locations
  when there is no repository.  
<a name="subscribeToRepository"></a>

## subscribeToRepository()
**Kind**: global function  
**Describe**: handles all subscriptions based on the repository in focus  
<a name="updateDiffs"></a>

## updateDiffs()
**Kind**: global function  
**Describe**: Uses text markers in the target editor to visualize
  git modifications, additions, and deletions. The current algorithm
  just redraws the markers each call.  
<a name="beforeEach"></a>

## beforeEach()
**Kind**: global function  
**Babel**:   
<a name="beforeEach"></a>

## beforeEach()
**Kind**: global function  
**Babel**:   
<a name="beforeEach"></a>

## beforeEach()
**Kind**: global function  
**Babel**:   
<a name="beforeEach"></a>

## beforeEach()
**Kind**: global function  
**Babel**:   
<a name="beforeEach"></a>

## beforeEach()
**Kind**: global function  
**Babel**:   
<a name="beforeEach"></a>

## beforeEach()
**Kind**: global function  
**Babel**:   
<a name="conditionPromise"></a>

## conditionPromise()
**Kind**: global function  
**Babel**:   
<a name="beforeEach"></a>

## beforeEach()
**Kind**: global function  
**Babel**:   
