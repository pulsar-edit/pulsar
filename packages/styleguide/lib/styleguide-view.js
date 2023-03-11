/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import dedent from 'dedent'
import CodeBlock from './code-block'
import StyleguideSection from './styleguide-section'
import ExampleSelectListView from './example-select-list-view'

export default class StyleguideView {
  constructor (props) {
    this.uri = props.uri
    this.collapsedSections = props.collapsedSections ? new Set(props.collapsedSections) : new Set()
    this.sections = []
    etch.initialize(this)
    for (const section of this.sections) {
      if (this.collapsedSections.has(section.name)) {
        section.collapse()
      } else {
        section.expand()
      }
    }
  }

  destroy () {
    this.sections = null
  }

  serialize () {
    return {
      deserializer: this.constructor.name,
      collapsedSections: this.sections.filter((s) => s.collapsed).map((s) => s.name),
      uri: this.uri
    }
  }

  update () {
    // intentionally empty.
  }

  getURI () {
    return this.uri
  }

  getTitle () {
    return 'Styleguide'
  }

  getIconName () {
    return 'paintcan'
  }

  expandAll () {
    for (const section of this.sections) {
      section.expand()
    }
  }

  collapseAll () {
    for (const section of this.sections) {
      section.collapse()
    }
  }

  render () {
    return (
      <div className='styleguide pane-item native-key-bindings' tabIndex='-1'>
        <header className='styleguide-header'>
          <h1>Styleguide</h1>
          <p>This exercises all UI components and acts as a styleguide.</p>

          <div className='styleguide-controls btn-group'>
            <button className='btn' onclick={() => this.collapseAll()}>Collapse All</button>
            <button className='btn' onclick={() => this.expandAll()}>Expand All</button>
          </div>
        </header>

        <main className='styleguide-sections'>
          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='variables' title='Variables'>
            <p>Use these UI variables in your package's stylesheets. They are set by UI themes and therefore your package will match the overall look. Make sure to @import 'ui-variables' in your stylesheets to use these variables.</p>
            <h2>Text colors</h2>
            {this.renderExampleHTML(dedent`
              <div class="is-color text-color">@text-color</div>
              <div class="is-color text-color-subtle">@text-color-subtle</div>
              <div class="is-color text-color-highlight">@text-color-highlight</div>
              <div class="is-color text-color-selected">@text-color-selected</div>
              <div class="is-color"></div>
              <div class="is-color text-color-info">@text-color-info</div>
              <div class="is-color text-color-success">@text-color-success</div>
              <div class="is-color text-color-warning">@text-color-warning</div>
              <div class="is-color text-color-error">@text-color-error</div>
            `)}

            <h2>Background colors</h2>
            {this.renderExampleHTML(dedent`
              <div class="is-color background-color-info">@background-color-info</div>
              <div class="is-color background-color-success">@background-color-success</div>
              <div class="is-color background-color-warning">@background-color-warning</div>
              <div class="is-color background-color-error">@background-color-error</div>
              <div class="is-color"></div>
              <div class="is-color background-color-highlight">@background-color-highlight</div>
              <div class="is-color background-color-selected">@background-color-selected</div>
              <div class="is-color app-background-color">@app-background-color</div>
            `)}

            <h2>Base colors</h2>
            {this.renderExampleHTML(dedent`
              <div class="is-color base-background-color">@base-background-color</div>
              <div class="is-color base-border-color">@base-border-color</div>
            `)}

            <h2>Component colors</h2>
            {this.renderExampleHTML(dedent`
              <div class="is-color pane-item-background-color">@pane-item-background-color</div>
              <div class="is-color pane-item-border-color">@pane-item-border-color</div>
              <div class="is-color"></div>
              <div class="is-color input-background-color">@input-background-color</div>
              <div class="is-color input-border-color">@input-border-color</div>
              <div class="is-color"></div>
              <div class="is-color tool-panel-background-color">@tool-panel-background-color</div>
              <div class="is-color tool-panel-border-color">@tool-panel-border-color</div>
              <div class="is-color inset-panel-background-color">@inset-panel-background-color</div>
              <div class="is-color inset-panel-border-color">@inset-panel-border-color</div>
              <div class="is-color panel-heading-background-color">@panel-heading-background-color</div>
              <div class="is-color panel-heading-border-color">@panel-heading-border-color</div>
              <div class="is-color overlay-background-color">@overlay-background-color</div>
              <div class="is-color overlay-border-color">@overlay-border-color</div>
              <div class="is-color"></div>
              <div class="is-color button-background-color">@button-background-color</div>
              <div class="is-color button-background-color-hover">@button-background-color-hover</div>
              <div class="is-color button-background-color-selected">@button-background-color-selected</div>
              <div class="is-color button-border-color">@button-border-color</div>
              <div class="color"></div>
              <div class="is-color tab-bar-background-color">@tab-bar-background-color</div>
              <div class="is-color tab-bar-border-color">@tab-bar-border-color</div>
              <div class="is-color tab-background-color">@tab-background-color</div>
              <div class="is-color tab-background-color-active">@tab-background-color-active</div>
              <div class="is-color tab-border-color">@tab-border-color</div>
              <div class="is-color"></div>
              <div class="is-color tree-view-background-color">@tree-view-background-color</div>
              <div class="is-color tree-view-border-color">@tree-view-border-color</div>
            `)}

            <h2>Site colors</h2>
            {this.renderExampleHTML(dedent`
              <div class="is-color ui-site-color-1">@ui-site-color-1</div>
              <div class="is-color ui-site-color-2">@ui-site-color-2</div>
              <div class="is-color ui-site-color-3">@ui-site-color-3</div>
              <div class="is-color ui-site-color-4">@ui-site-color-4</div>
              <div class="is-color ui-site-color-5">@ui-site-color-5</div>
            `)}

            <h2>Sizes</h2>
            {this.renderExampleHTML(dedent`
              <div class="is-size disclosure-arrow-size">@disclosure-arrow-size</div>
              <div class="is-size component-padding">@component-padding</div>
              <div class="is-size component-icon-padding">@component-icon-padding</div>
              <div class="is-size component-icon-size">@component-icon-size</div>
              <div class="is-size component-line-height">@component-line-height</div>
              <div class="is-size tab-height">@tab-height</div>
              <div class="is-size font-size">@font-size</div>
            `)}

            <h2>Misc</h2>
            {this.renderExampleHTML(dedent`
              <div class="is-radius component-border-radius">@component-border-radius</div>
              <div class="is-font font-family">@font-family</div>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='icons' title='Icons'>
            <p>Atom comes bundled with the Octicons. It lets you easily add icons to your packages.</p>
            <p>Currently version <code>4.4.0</code> is available. In addition some older icons from version <code>2.1.2</code> are still kept for backwards compatibility. Make sure to use the <code>icon icon-</code> prefix in front of an icon name. See the <a href='http://flight-manual.atom.io/hacking-atom/sections/iconography/'>documentation</a> for more details.</p>

            <h2>Octicons</h2>
            {this.renderExampleHTML(dedent`
              <span class='icon icon-alert native-key-bindings'>alert</span>
              <span class='icon icon-alignment-align'>alignment-align</span>
              <span class='icon icon-alignment-aligned-to'>alignment-aligned-to</span>
              <span class='icon icon-alignment-unalign'>alignment-unalign</span>
              <span class='icon icon-arrow-down'>arrow-down</span>
              <span class='icon icon-arrow-left'>arrow-left</span>
              <span class='icon icon-arrow-right'>arrow-right</span>
              <span class='icon icon-arrow-small-down'>arrow-small-down</span>
              <span class='icon icon-arrow-small-left'>arrow-small-left</span>
              <span class='icon icon-arrow-small-right'>arrow-small-right</span>
              <span class='icon icon-arrow-small-up'>arrow-small-up</span>
              <span class='icon icon-arrow-up'>arrow-up</span>
              <span class='icon icon-beaker'>beaker</span>
              <span class='icon icon-beer'>beer</span>
              <span class='icon icon-bell'>bell</span>
              <span class='icon icon-bold'>bold</span>
              <span class='icon icon-book'>book</span>
              <span class='icon icon-bookmark'>bookmark</span>
              <span class='icon icon-briefcase'>briefcase</span>
              <span class='icon icon-broadcast'>broadcast</span>
              <span class='icon icon-browser'>browser</span>
              <span class='icon icon-bug'>bug</span>
              <span class='icon icon-calendar'>calendar</span>
              <span class='icon icon-check'>check</span>
              <span class='icon icon-checklist'>checklist</span>
              <span class='icon icon-chevron-down'>chevron-down</span>
              <span class='icon icon-chevron-left'>chevron-left</span>
              <span class='icon icon-chevron-right'>chevron-right</span>
              <span class='icon icon-chevron-up'>chevron-up</span>
              <span class='icon icon-circle-slash'>circle-slash</span>
              <span class='icon icon-circuit-board'>circuit-board</span>
              <span class='icon icon-clippy'>clippy</span>
              <span class='icon icon-clock'>clock</span>
              <span class='icon icon-cloud-download'>cloud-download</span>
              <span class='icon icon-cloud-upload'>cloud-upload</span>
              <span class='icon icon-code'>code</span>
              <span class='icon icon-color-mode'>color-mode</span>
              <span class='icon icon-comment'>comment</span>
              <span class='icon icon-comment-add'>comment-add</span>
              <span class='icon icon-comment-discussion'>comment-discussion</span>
              <span class='icon icon-credit-card'>credit-card</span>
              <span class='icon icon-dash'>dash</span>
              <span class='icon icon-dashboard'>dashboard</span>
              <span class='icon icon-database'>database</span>
              <span class='icon icon-desktop-download'>desktop-download</span>
              <span class='icon icon-device-camera'>device-camera</span>
              <span class='icon icon-device-camera-video'>device-camera-video</span>
              <span class='icon icon-device-desktop'>device-desktop</span>
              <span class='icon icon-device-mobile'>device-mobile</span>
              <span class='icon icon-diff'>diff</span>
              <span class='icon icon-diff-added'>diff-added</span>
              <span class='icon icon-diff-ignored'>diff-ignored</span>
              <span class='icon icon-diff-modified'>diff-modified</span>
              <span class='icon icon-diff-removed'>diff-removed</span>
              <span class='icon icon-diff-renamed'>diff-renamed</span>
              <span class='icon icon-ellipses'>ellipses</span>
              <span class='icon icon-ellipsis'>ellipsis</span>
              <span class='icon icon-eye'>eye</span>
              <span class='icon icon-eye-unwatch'>eye-unwatch</span>
              <span class='icon icon-eye-watch'>eye-watch</span>
              <span class='icon icon-file'>file</span>
              <span class='icon icon-file-add'>file-add</span>
              <span class='icon icon-file-binary'>file-binary</span>
              <span class='icon icon-file-code'>file-code</span>
              <span class='icon icon-file-directory'>file-directory</span>
              <span class='icon icon-file-directory-create'>file-directory-create</span>
              <span class='icon icon-file-media'>file-media</span>
              <span class='icon icon-file-pdf'>file-pdf</span>
              <span class='icon icon-file-submodule'>file-submodule</span>
              <span class='icon icon-file-symlink-directory'>file-symlink-directory</span>
              <span class='icon icon-file-symlink-file'>file-symlink-file</span>
              <span class='icon icon-file-text'>file-text</span>
              <span class='icon icon-file-zip'>file-zip</span>
              <span class='icon icon-flame'>flame</span>
              <span class='icon icon-fold'>fold</span>
              <span class='icon icon-gear'>gear</span>
              <span class='icon icon-gift'>gift</span>
              <span class='icon icon-gist'>gist</span>
              <span class='icon icon-gist-fork'>gist-fork</span>
              <span class='icon icon-gist-new'>gist-new</span>
              <span class='icon icon-gist-private'>gist-private</span>
              <span class='icon icon-gist-secret'>gist-secret</span>
              <span class='icon icon-git-branch'>git-branch</span>
              <span class='icon icon-git-branch-create'>git-branch-create</span>
              <span class='icon icon-git-branch-delete'>git-branch-delete</span>
              <span class='icon icon-git-commit'>git-commit</span>
              <span class='icon icon-git-compare'>git-compare</span>
              <span class='icon icon-git-fork-private'>git-fork-private</span>
              <span class='icon icon-git-merge'>git-merge</span>
              <span class='icon icon-git-pull-request'>git-pull-request</span>
              <span class='icon icon-git-pull-request-abandoned'>git-pull-request-abandoned</span>
              <span class='icon icon-globe'>globe</span>
              <span class='icon icon-grabber'>grabber</span>
              <span class='icon icon-graph'>graph</span>
              <span class='icon icon-heart'>heart</span>
              <span class='icon icon-history'>history</span>
              <span class='icon icon-home'>home</span>
              <span class='icon icon-horizontal-rule'>horizontal-rule</span>
              <span class='icon icon-hourglass'>hourglass</span>
              <span class='icon icon-hubot'>hubot</span>
              <span class='icon icon-inbox'>inbox</span>
              <span class='icon icon-info'>info</span>
              <span class='icon icon-issue-closed'>issue-closed</span>
              <span class='icon icon-issue-opened'>issue-opened</span>
              <span class='icon icon-issue-reopened'>issue-reopened</span>
              <span class='icon icon-italic'>italic</span>
              <span class='icon icon-jersey'>jersey</span>
              <span class='icon icon-jump-down'>jump-down</span>
              <span class='icon icon-jump-left'>jump-left</span>
              <span class='icon icon-jump-right'>jump-right</span>
              <span class='icon icon-jump-up'>jump-up</span>
              <span class='icon icon-key'>key</span>
              <span class='icon icon-keyboard'>keyboard</span>
              <span class='icon icon-law'>law</span>
              <span class='icon icon-light-bulb'>light-bulb</span>
              <span class='icon icon-link'>link</span>
              <span class='icon icon-link-external'>link-external</span>
              <span class='icon icon-list-ordered'>list-ordered</span>
              <span class='icon icon-list-unordered'>list-unordered</span>
              <span class='icon icon-location'>location</span>
              <span class='icon icon-lock'>lock</span>
              <span class='icon icon-log-in'>log-in</span>
              <span class='icon icon-log-out'>log-out</span>
              <span class='icon icon-logo-gist'>logo-gist</span>
              <span class='icon icon-logo-github'>logo-github</span>
              <span class='icon icon-mail'>mail</span>
              <span class='icon icon-mail-read'>mail-read</span>
              <span class='icon icon-mail-reply'>mail-reply</span>
              <span class='icon icon-mark-github'>mark-github</span>
              <span class='icon icon-markdown'>markdown</span>
              <span class='icon icon-megaphone'>megaphone</span>
              <span class='icon icon-mention'>mention</span>
              <span class='icon icon-microscope'>microscope</span>
              <span class='icon icon-milestone'>milestone</span>
              <span class='icon icon-mirror'>mirror</span>
              <span class='icon icon-mirror-private'>mirror-private</span>
              <span class='icon icon-mirror-public'>mirror-public</span>
              <span class='icon icon-mortar-board'>mortar-board</span>
              <span class='icon icon-move-down'>move-down</span>
              <span class='icon icon-move-left'>move-left</span>
              <span class='icon icon-move-right'>move-right</span>
              <span class='icon icon-move-up'>move-up</span>
              <span class='icon icon-mute'>mute</span>
              <span class='icon icon-no-newline'>no-newline</span>
              <span class='icon icon-octoface'>octoface</span>
              <span class='icon icon-organization'>organization</span>
              <span class='icon icon-package'>package</span>
              <span class='icon icon-paintcan'>paintcan</span>
              <span class='icon icon-pencil'>pencil</span>
              <span class='icon icon-person'>person</span>
              <span class='icon icon-person-add'>person-add</span>
              <span class='icon icon-person-follow'>person-follow</span>
              <span class='icon icon-pin'>pin</span>
              <span class='icon icon-playback-fast-forward'>playback-fast-forward</span>
              <span class='icon icon-playback-pause'>playback-pause</span>
              <span class='icon icon-playback-play'>playback-play</span>
              <span class='icon icon-playback-rewind'>playback-rewind</span>
              <span class='icon icon-plug'>plug</span>
              <span class='icon icon-plus-small'>plus-small</span>
              <span class='icon icon-plus'>plus</span>
              <span class='icon icon-podium'>podium</span>
              <span class='icon icon-primitive-dot'>primitive-dot</span>
              <span class='icon icon-primitive-square'>primitive-square</span>
              <span class='icon icon-pulse'>pulse</span>
              <span class='icon icon-puzzle'>puzzle</span>
              <span class='icon icon-question'>question</span>
              <span class='icon icon-quote'>quote</span>
              <span class='icon icon-radio-tower'>radio-tower</span>
              <span class='icon icon-remove-close'>remove-close</span>
              <span class='icon icon-reply'>reply</span>
              <span class='icon icon-repo'>repo</span>
              <span class='icon icon-repo-clone'>repo-clone</span>
              <span class='icon icon-repo-create'>repo-create</span>
              <span class='icon icon-repo-delete'>repo-delete</span>
              <span class='icon icon-repo-force-push'>repo-force-push</span>
              <span class='icon icon-repo-forked'>repo-forked</span>
              <span class='icon icon-repo-pull'>repo-pull</span>
              <span class='icon icon-repo-push'>repo-push</span>
              <span class='icon icon-repo-sync'>repo-sync</span>
              <span class='icon icon-rocket'>rocket</span>
              <span class='icon icon-rss'>rss</span>
              <span class='icon icon-ruby'>ruby</span>
              <span class='icon icon-screen-full'>screen-full</span>
              <span class='icon icon-screen-normal'>screen-normal</span>
              <span class='icon icon-search'>search</span>
              <span class='icon icon-search-save'>search-save</span>
              <span class='icon icon-server'>server</span>
              <span class='icon icon-settings'>settings</span>
              <span class='icon icon-shield'>shield</span>
              <span class='icon icon-sign-in'>sign-in</span>
              <span class='icon icon-sign-out'>sign-out</span>
              <span class='icon icon-smiley'>smiley</span>
              <span class='icon icon-split'>split</span>
              <span class='icon icon-squirrel'>squirrel</span>
              <span class='icon icon-star'>star</span>
              <span class='icon icon-star-add'>star-add</span>
              <span class='icon icon-star-delete'>star-delete</span>
              <span class='icon icon-steps'>steps</span>
              <span class='icon icon-stop'>stop</span>
              <span class='icon icon-sync'>sync</span>
              <span class='icon icon-tag'>tag</span>
              <span class='icon icon-tag-add'>tag-add</span>
              <span class='icon icon-tag-remove'>tag-remove</span>
              <span class='icon icon-tasklist'>tasklist</span>
              <span class='icon icon-telescope'>telescope</span>
              <span class='icon icon-terminal'>terminal</span>
              <span class='icon icon-text-size'>text-size</span>
              <span class='icon icon-three-bars'>three-bars</span>
              <span class='icon icon-thumbsdown'>thumbsdown</span>
              <span class='icon icon-thumbsup'>thumbsup</span>
              <span class='icon icon-tools'>tools</span>
              <span class='icon icon-trashcan'>trashcan</span>
              <span class='icon icon-triangle-down'>triangle-down</span>
              <span class='icon icon-triangle-left'>triangle-left</span>
              <span class='icon icon-triangle-right'>triangle-right</span>
              <span class='icon icon-triangle-up'>triangle-up</span>
              <span class='icon icon-unfold'>unfold</span>
              <span class='icon icon-unmute'>unmute</span>
              <span class='icon icon-unverified'>unverified</span>
              <span class='icon icon-verified'>verified</span>
              <span class='icon icon-versions'>versions</span>
              <span class='icon icon-watch'>watch</span>
              <span class='icon icon-x'>x</span>
              <span class='icon icon-zap'>zap</span>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='inputs' title='Inputs'>
            <p>Various inputs and controls.</p>

            <h2>Text Inputs</h2>
            {this.renderExampleHTML(dedent`
              <input class='input-text' type='text' placeholder='Text'>
              <input class='input-search' type='search' placeholder='Search'>
              <textarea class='input-textarea' placeholder='Text Area'></textarea>
            `)}

            <h2>Controls</h2>
            {this.renderExampleHTML(dedent`
              <label class='input-label'><input class='input-radio' type='radio' name='radio'> Radio</label>
              <label class='input-label'><input class='input-radio' type='radio' name='radio' checked> Radio</label>
              <label class='input-label'><input class='input-checkbox' type='checkbox' checked> Checkbox</label>
              <label class='input-label'><input class='input-toggle' type='checkbox' checked> Toggle</label>
              <input class='input-range' type='range'>
            `)}

            <h2>Misc</h2>
            {this.renderExampleHTML(dedent`
              <input class='input-color' type='color' value='#FF85FF'>
              <input class='input-number' type='number' min='1' max='10' placeholder='1-10'>
              <select class='input-select'><option>Option 1</option><option>Option 2</option><option>Option 3</option></select>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='text' title='Text'>
            <p>There are a number of text classes.</p>

            <h2>text-* classes</h2>
            {this.renderExampleHTML(dedent`
              <div class='text-smaller'>Smaller text</div>
              <div>Normal text</div>
              <div class='text-subtle'>Subtle text</div>
              <div class='text-highlight'>Highlighted text</div>
              <div class='text-info'>Info text</div>
              <div class='text-success'>Success text</div>
              <div class='text-warning'>Warning text</div>
              <div class='text-error'>Error text</div>
            `)}

            <h2>highlight-* classes</h2>
            {this.renderExampleHTML(dedent`
              <span class='inline-block'>Normal</span>
              <span class='inline-block highlight'>Highlighted</span>
              <span class='inline-block highlight-info'>Info</span>
              <span class='inline-block highlight-success'>Success</span>
              <span class='inline-block highlight-warning'>Warning</span>
              <span class='inline-block highlight-error'>Error</span>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='layout' title='Layout'>
            <p>A few things that might be useful for general layout.</p>

            <h2>.block</h2>
            <p>Sometimes you need to separate components vertically. Say in a form.</p>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <label>You might want to type something here.</label>
                <atom-text-editor mini>Something you typed...</atom-text-editor>
              </div>
              <div class='block'>
                <label class='icon icon-file-directory'>Another field with an icon</label>
                <atom-text-editor mini>Something else you typed...</atom-text-editor>
              </div>
              <div class='block'>
                <button class='btn'>Do it</button>
              </div>
            `)}

            <h2>.inline-block</h2>
            <p>Sometimes you need to separate components horizontally.</p>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <button class='inline-block btn'>Do it</button>
                <button class='inline-block btn'>Another</button>
                <button class='inline-block btn'>OMG again</button>
              </div>
            `)}

            <h2>.inline-block-tight</h2>
            <p>You might want things to be a little closer to each other.</p>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <button class='inline-block-tight btn'>Do it</button>
                <button class='inline-block-tight btn'>Another</button>
                <button class='inline-block-tight btn'>OMG again</button>
              </div>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='git' title='Git Status'>
            <p>Often we need git related classes to specify status.</p>

            <h2>status-* classes</h2>
            {this.renderExampleHTML(dedent`
              <div class='status-ignored'>Ignored</div>
              <div class='status-added'>Added</div>
              <div class='status-modified'>Modified</div>
              <div class='status-removed'>Removed</div>
              <div class='status-renamed'>Renamed</div>
            `)}

            <h2>status-* classes with related icons</h2>
            {this.renderExampleHTML(dedent`
              <span class='inline-block status-ignored icon icon-diff-ignored'></span>
              <span class='inline-block status-added icon icon-diff-added'></span>
              <span class='inline-block status-modified icon icon-diff-modified'></span>
              <span class='inline-block status-removed icon icon-diff-removed'></span>
              <span class='inline-block status-renamed icon icon-diff-renamed'></span>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='site-highlight' title='Site colors'>
            <p>Site colors are used for collaboration. A site is another collaborator.</p>

            <h2>ui-site-* classes</h2>
            <p>
              These classes only set the background color, no other styles.
              You can also use LESS variables <code>@ui-site-#</code> in your plugins where
              <code>#</code> is a number between 1 and 5.
            </p>
            <p>Site colors will always be in the color progression you see here.</p>
            {this.renderExampleHTML(dedent`
              <div class='block ui-site-1'></div>
              <div class='block ui-site-2'></div>
              <div class='block ui-site-3'></div>
              <div class='block ui-site-4'></div>
              <div class='block ui-site-5'></div>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='badges' title='Badges'>
            <p>Badges are typically used to show numbers.</p>

            <h2>Standalone badges</h2>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <span class='badge'>0</span>
                <span class='badge'>8</span>
                <span class='badge'>27</span>
                <span class='badge'>450</span>
                <span class='badge'>2869</span>
              </div>
            `)}

            <h2>Colored badges</h2>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <span class='badge badge-info'>78</span>
                <span class='badge badge-success'>3</span>
                <span class='badge badge-warning'>14</span>
                <span class='badge badge-error'>1845</span>
              </div>
            `)}

            <h2>Badge sizes</h2>
            <p>By default the <code>@font-size</code> variable from themes is used. Additionally there are also 3 predefined sizes.</p>
            {this.renderExampleHTML(dedent`
              <div class='block'>Large <span class='badge badge-large'>8</span></div>
              <div class='block'>Medium <span class='badge badge-medium'>2</span></div>
              <div class='block'>Small <span class='badge badge-small'>7</span></div>
            `)}

            <p>If you like the size change depending on the parent, use the <code>badge-flexible</code> class. Note: Best used for larger sizes. For smaller sizes it could cause the number to be mis-aligned by a pixel.</p>
            {this.renderExampleHTML(dedent`
              <h1 class='block'>Heading <span class='badge badge-flexible'>1</span></h1>
              <h2 class='block'>Heading <span class='badge badge-flexible'>2</span></h2>
              <h3 class='block'>Heading <span class='badge badge-flexible'>3</span></h3>
            `)}

            <h2>Icon Badges</h2>
            <p>See the icons section to get an overview of all Octicons.</p>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <span class='badge icon icon-gear'>4</span>
                <span class='badge badge-info icon icon-cloud-download'>13</span>
                <span class='badge badge-success icon icon-octoface'>5</span>
              </div>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='buttons' title='Buttons'>
            <p>Buttons are similar to bootstrap buttons</p>

            <h2>Standalone buttons</h2>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <button class='btn'>Button</button>
              </div>
              <div class='block'>
                <button class='btn btn-xs'>Extra Small Button</button>
              </div>
              <div class='block'>
                <button class='btn btn-sm'>Small Button</button>
              </div>
              <div class='block'>
                <button class='btn btn-lg'>Large Button</button>
              </div>
            `)}

            <h2>Colored buttons</h2>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <button class='btn btn-primary inline-block-tight'>Primary</button>
                <button class='btn btn-primary selected inline-block-tight'>Selected Primary</button>
              </div>

              <div class='block'>
                <button class='btn btn-info inline-block-tight'>Info</button>
                <button class='btn btn-info selected inline-block-tight'>Selected Info</button>
              </div>

              <div class='block'>
                <button class='btn btn-success inline-block-tight'>Success</button>
                <button class='btn btn-success selected inline-block-tight'>Selected Success</button>
              </div>

              <div class='block'>
                <button class='btn btn-warning inline-block-tight'>Warning</button>
                <button class='btn btn-warning selected inline-block-tight'>Selected Warning</button>
              </div>

              <div class='block'>
                <button class='btn btn-error inline-block-tight'>Error</button>
                <button class='btn btn-error selected inline-block-tight'>Selected Error</button>
              </div>
            `)}

            <h2>Icon buttons</h2>
            <p>Overview of all <a href='https://octicons.github.com/'>Octicons</a>.</p>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <button class='btn icon icon-gear inline-block-tight'>Settings</button>
                <button class='btn btn-primary icon icon-cloud-download inline-block-tight'>Install</button>
                <button class='btn btn-error icon icon-octoface inline-block-tight'>Danger</button>
              </div>
            `)}

            <h2>Button Groups</h2>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <div>Normal size</div>
                <div class='btn-group'>
                  <button class='btn'>One</button>
                  <button class='btn'>Two</button>
                  <button class='btn'>Three</button>
                </div>
              </div>

              <div class='block'>
                <div>Extra Small</div>
                <div class='btn-group btn-group-xs'>
                  <button class='btn'>One</button>
                  <button class='btn'>Two</button>
                  <button class='btn'>Three</button>
                </div>
              </div>

              <div class='block'>
                <div>Small</div>
                <div class='btn-group btn-group-sm'>
                  <button class='btn'>One</button>
                  <button class='btn'>Two</button>
                  <button class='btn'>Three</button>
                </div>
              </div>

              <div class='block'>
                <div>Large</div>
                <div class='btn-group btn-group-lg'>
                  <button class='btn'>One</button>
                  <button class='btn'>Two</button>
                  <button class='btn'>Three</button>
                </div>
              </div>
            `)}

            <h2>Button Toolbars</h2>
            {this.renderExampleHTML(dedent`
              <div class='btn-toolbar'>
                <div class='btn-group'>
                  <button class='btn'>One</button>
                  <button class='btn'>Two</button>
                  <button class='btn'>Three</button>
                </div>

                <div class='btn-group'>
                  <button class='btn'>Four</button>
                  <button class='btn'>Five</button>
                </div>

                <button class='btn'>Six</button>
                <button class='btn'>Seven</button>
              </div>
            `)}

            <h2>Selected buttons</h2>
            <p>Buttons can be marked selected by adding a <code>.selected</code> class. Useful for toggle groups.</p>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <div class='btn-group'>
                  <button class='btn selected'>One</button>
                  <button class='btn'>Two</button>
                  <button class='btn'>Three</button>
                </div>
              </div>

              <div class='block'>
                <div class='btn-group'>
                  <button class='btn'>One</button>
                  <button class='btn selected'>Two</button>
                  <button class='btn'>Three</button>
                </div>
              </div>

              <div class='block'>
                <div class='btn-group'>
                  <button class='btn'>One</button>
                  <button class='btn'>Two</button>
                  <button class='btn selected'>Three</button>
                </div>
              </div>

              <div class='block'>
                <div class='btn-group'>
                  <button class='btn selected'>One</button>
                  <button class='btn selected'>Two</button>
                  <button class='btn'>Three</button>
                </div>
              </div>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='panel' title='Panels'>
            <p>A container attached to some side of the Atom UI.</p>
            {this.renderExampleHTML(dedent`
              <atom-panel>
                Some content
              </atom-panel>
            `)}

            <h2>Inset Panel</h2>
            <p>Use inside a panel</p>
            {this.renderExampleHTML(dedent`
              <atom-panel class='padded'>
                <div class="inset-panel padded">Some inset content</div>
              </atom-panel>
            `)}

            <h2>With a heading</h2>
            {this.renderExampleHTML(dedent`
              <atom-panel class='padded'>
                <div class="inset-panel">
                  <div class="panel-heading">An inset-panel heading</div>
                  <div class="panel-body padded">Some Content</div>
                </div>
              </atom-panel>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='list-group' title='List Group'>
            <p>Use for anything that requires a list.</p>
            {this.renderExampleHTML(dedent`
              <ul class='list-group'>
                <li class='list-item'><span>Normal item</span></li>
                <li class='list-item selected'><span>This is the Selected item</span></li>
                <li class='list-item text-subtle'><span>Subtle</span></li>
                <li class='list-item text-info'><span>Info</span></li>
                <li class='list-item text-success'><span>Success</span></li>
                <li class='list-item text-warning'><span>Warning</span></li>
                <li class='list-item text-error'><span>Error</span></li>
              </ul>
            `)}

            <h2>With icons</h2>
            {this.renderExampleHTML(dedent`
              <ul class='list-group'>
                <li class='list-item'>
                  <span class='icon icon-file-directory'>Using a span with an icon</span>
                </li>
                <li class='list-item'>
                  <i class='icon icon-file-directory'></i>
                  <span>With .icon-file-directory using &lt;i&gt; tags</span>
                </li>
                <li class='list-item selected'>
                  <span class='icon icon-file-directory'>Selected with .icon-file-directory</span>
                </li>
                <li class='list-item'>
                  <span class='no-icon'>With .no-icon</span>
                </li>
                <li class='list-item'>
                  <span class='icon icon-file-text'>With icon-file-text</span>
                </li>
                <li class='list-item'>
                  <span class='icon icon-file-media'>With icon-file-media</span>
                </li>
                <li class='list-item'>
                  <span class='icon icon-file-symlink-file'>With icon-file-symlink-file</span>
                </li>
                <li class='list-item'>
                  <span class='icon icon-file-submodule'>With icon-file-submodule</span>
                </li>
                <li class='list-item'>
                  <span class='icon icon-book'>With icon-book</span>
                </li>
              </ul>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='list-tree' title='List Tree'>
            <p>A <code>.list-tree</code> is a special case of <code>.list-group</code>.</p>
            {this.renderExampleHTML(dedent`
              <ul class='list-tree'>
                <li class='list-nested-item'>
                  <div class='list-item'>
                    <span class='icon icon-file-directory'>A Directory</span>
                  </div>

                  <ul class='list-tree'>
                    <li class='list-nested-item'>
                      <div class='list-item'>
                        <span class='icon icon-file-directory'>Nested Directory</span>
                      </div>

                      <ul class='list-tree'>
                        <li class='list-item'>
                          <span class='icon icon-file-text'>File one</span>
                        </li>
                      </ul>
                    </li>

                    <li class='list-nested-item collapsed'>
                      <div class='list-item'>
                        <span class='icon icon-file-directory'>Collapsed Nested Directory</span>
                      </div>

                      <ul class='list-tree'>
                        <li class='list-item'>
                          <span class='icon icon-file-text'>File one</span>
                        </li>
                      </ul>
                    </li>

                    <li class='list-item'>
                      <span class='icon icon-file-text'>File one</span>
                    </li>

                    <li class='list-item selected'>
                      <span class='icon icon-file-text'>File three .selected!</span>
                    </li>
                  </ul>
                </li>

                <li class='list-item'>
                  <span class='icon icon-file-text'>.icon-file-text</span>
                </li>

                <li class='list-item'>
                  <span class='icon icon-file-symlink-file'>.icon-file-symlink-file</span>
                </li>
            `)}

            <h2>With disclosure arrows</h2>
            <p>Add the class <code>.has-collapsable-children</code> to give the children with nested items disclosure arrows.</p>
            {this.renderExampleHTML(dedent`
              <ul class='list-tree has-collapsable-children'>
                <li class='list-nested-item'>
                  <div class='list-item'>
                    <span class='icon icon-file-directory'>A Directory</span>
                  </div>

                  <ul class='list-tree'>
                    <li class='list-nested-item'>
                      <div class='list-item'>
                        <span class='icon icon-file-directory'>Nested Directory</span>
                      </div>

                      <ul class='list-tree'>
                        <li class='list-item'>
                          <span class='icon icon-file-text'>File one</span>
                        </li>
                      </ul>
                    </li>

                    <li class='list-nested-item collapsed'>
                      <div class='list-item'>
                        <span class='icon icon-file-directory'>Collapsed Nested Directory</span>
                      </div>

                      <ul class='list-tree'>
                        <li class='list-item'>
                          <span class='icon icon-file-text'>File one</span>
                        </li>
                      </ul>
                    </li>

                    <li class='list-item'>
                      <span class='icon icon-file-text'>File one</span>
                    </li>

                    <li class='list-item selected'>
                      <span class='icon icon-file-text'>File three .selected!</span>
                    </li>
                  </ul>
                </li>

                <li class='list-item'>
                  <span class='icon icon-file-text'>.icon-file-text</span>
                </li>

                <li class='list-item'>
                  <span class='icon icon-file-symlink-file'>.icon-file-symlink-file</span>
                </li>
              </ul>
            `)}

            <h2>With disclosure arrows at only one level.</h2>
            <p>Add the class <code>.has-flat-children</code> to sub-<code>.list-tree</code>s to indicate that the children will not be collapsable.</p>
            {this.renderExampleHTML(dedent`
              <ul class='list-tree has-collapsable-children '>
                <li class='list-nested-item'>
                  <div class='list-item'>
                    <span class='icon icon-file-text'>This is a collapsable section</span>
                  </div>

                  <ul class='list-tree has-flat-children'>
                    <li class='list-item'>Something is here</li>
                    <li class='list-item selected'>Something selected</li>
                  </ul>
                </li>

                <li class='list-nested-item'>
                  <div class='list-item'>
                    <span class='icon icon-file-directory'>Another collapsable section</span>
                  </div>

                  <ul class='list-tree has-flat-children'>
                    <li class='list-item'>Something is here</li>
                    <li class='list-item'>Something else</li>
                  </ul>
                </li>
              </ul>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='select-list' title='Select List'>
            <p>This is how you will typically specify a <code>.select-list</code>.</p>
            <ExampleSelectListView />

            <p>The list items have many options you can use, and shows you how they will display.</p>

            <h2>Basic example with one item selected</h2>
            {this.renderExampleHTML(dedent`
              <atom-panel class='modal'>
                <div class='select-list'>
                  <ol class='list-group'>
                    <li class='selected'>one</li>
                    <li>two</li>
                    <li>three</li>
                  </ol>
                </div>
              </atom-panel>
            `)}

            <h2>Single line with icons</h2>
            {this.renderExampleHTML(dedent`
              <atom-panel class='modal'>
                <div class='select-list'>
                  <ol class='list-group'>
                    <li class='selected'>
                      <div class='status status-added icon icon-diff-added'></div>
                      <div class='icon icon-file-text'>Some file</div>
                    </li>

                    <li>
                      <div class='status status-modified icon icon-diff-modified'></div>
                      <div class='icon icon-file-text'>Another file</div>
                    </li>

                    <li>
                      <div class='status status-removed icon icon-diff-removed'></div>
                      <div class='icon icon-file-text'>Yet another file</div>
                    </li>
                  </ol>
                </div>
              </atom-panel>
            `)}

            <h2>Single line with key-bindings</h2>
            {this.renderExampleHTML(dedent`
              <atom-panel class='modal'>
                <div class='select-list'>
                  <ol class='list-group'>
                    <li class='selected'>
                      <div class='pull-right'>
                        <kbd class='key-binding pull-right'>⌘⌥↓</kbd>
                      </div>

                      <span class='icon icon-file-text'>Some file</span>
                    </li>

                    <li>
                      <div class='pull-right key-bindings'>
                        <kbd class='key-binding'>⌘⌥A</kbd>
                        <kbd class='key-binding'>⌘⌥O</kbd>
                      </div>

                      <span class='icon icon-file-text'>Another file with a long name</span>
                    </li>

                    <li>
                      <div class='pull-right'>
                        <kbd class='key-binding'>⌘⌥↓</kbd>
                      </div>

                      <span class='icon icon-file-text'>Yet another file</span>
                    </li>
                  </ol>
                </div>
              </atom-panel>
            `)}

            <h2>Multiple lines with no icons</h2>
            {this.renderExampleHTML(dedent`
              <atom-panel class='modal'>
                <div class='select-list'>
                  <ol class='list-group'>
                    <li class='two-lines'>
                      <div class='primary-line'>Primary line</div>
                      <div class='secondary-line'>Secondary line</div>
                    </li>

                    <li class='two-lines selected'>
                      <div class='primary-line'>A thing</div>
                      <div class='secondary-line'>Description of the thing</div>
                    </li>
                  </ol>
                </div>
              </atom-panel>
            `)}

            <h2>Multiple lines with icons</h2>
            {this.renderExampleHTML(dedent`
              <atom-panel class='modal'>
                <div class='select-list'>
                  <ol class='list-group'>
                    <li class='two-lines'>
                      <div class='status status-added icon icon-diff-added'></div>
                      <div class='primary-line icon icon-file-text'>Primary line</div>
                      <div class='secondary-line no-icon'>Secondary line</div>
                    </li>

                    <li class='two-lines selected'>
                      <div class='status status-modified icon icon-diff-modified'></div>
                      <div class='primary-line icon icon-file-symlink-file'>A thing</div>
                      <div class='secondary-line no-icon'>Description of the thing</div>
                    </li>

                    <li class='two-lines'>
                      <div class='status status-renamed icon icon-diff-renamed'></div>
                      <div class='primary-line icon icon-file-symlink-file'>A thing</div>
                      <div class='secondary-line no-icon'>Description of the thing</div>
                    </li>
                  </ol>
                </div>
              </atom-panel>
            `)}

            <h2>Using mark-active class to indicate the active item</h2>
            <p>Use ...</p>
            {this.renderExampleHTML(dedent`
              <atom-panel class='modal'>
                <div class='select-list'>
                  <ol class='list-group mark-active'>
                    <li class='selected'>Selected &mdash; user is arrowing through the list.</li>
                    <li class='active'>This is the active item</li>
                    <li class='selected active'>Selected AND Active!</li>
                  </ol>
                </div>
              </atom-panel>
            `)}

            <h2>Error messages</h2>
            {this.renderExampleHTML(dedent`
              <atom-panel class='modal'>
                <div class='select-list'>
                  <atom-text-editor mini>I searched for this</atom-text-editor>
                  <div class='error-message'>Nothing has been found!</div>
                </div>
              </atom-panel>
            `)}

            <h2>Loading message</h2>
            {this.renderExampleHTML(dedent`
              <atom-panel class='modal'>
                <div class='select-list'>
                  <atom-text-editor mini>User input</atom-text-editor>
                  <div class='loading'>
                    <span class='loading-message'>Chill, bro. Things are loading.</span>
                    <span class='badge'>1234</span>
                  </div>
                </div>
              </atom-panel>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='popover-list' title='Popover List'>
            <p>
              A <code>.popover-list</code> is a <code>.select-list</code> that
              is meant to popover the code for something like autocomplete.
            </p>

            <h2>Basic example with one item selected</h2>
            {this.renderExampleHTML(dedent`
              <div class='select-list popover-list'>
                <atom-text-editor mini>'User types here..'</atom-text-editor>
                <ol class='list-group'>
                  <li class='selected'>one</li>
                  <li>two</li>
                  <li>three</li>
                </ol>
              </div>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='modal-panel' title='Modals'>
            <p>Modals are like dialog boxes.</p>
            {this.renderExampleHTML(dedent`
              <atom-panel class='modal'>
                <div>Some content</div>
              </atom-panel>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='tooltips' title='Tooltips'>
            <p>
              You do not create the markup directly. You call
              <code>{`element.setTooltip(title, {command, commandElement}={})`}</code>.
              Passing in a <code>command</code> (like <code>find-and-replace:show-find</code>) and
              <code>commandElement</code> (context for the command) will yield a tip with a keystroke.
            </p>

            {this.renderExampleHTML(dedent`
              <div class='tooltip top'>
                <div class='tooltip-arrow'></div>
                <div class='tooltip-inner'>This is a message</div>
              </div>

              <div class='tooltip top'>
                <div class='tooltip-arrow'></div>
                <div class='tooltip-inner'>
                  With a keystroke <span class="keystroke">cmd-shift-o</span>
                </div>
              </div>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='error-messages' title='Messages'>
            <p>
              Use to convey info to the user when something happens. See <code>find-and-replace</code>
              for an example.
            </p>

            <h2>Error messages</h2>
            {this.renderExampleHTML(dedent`
              <ul class='error-messages block'>
                <li>This is an error!</li>
                <li>And another</li>
              </ul>
            `)}

            <h2>Info messages</h2>
            {this.renderExampleHTML(dedent`
              <ul class='info-messages block'>
                <li>Info line</li>
                <li>Another info line</li>
              </ul>
            `)}

            <h2>Background Messages</h2>
            <p>
              Subtle background messages for panes. Use for cases when there are no results.
            </p>

            {this.renderExampleHTML(dedent`
              <ul class='background-message'>
                <li>No Results</li>
              </ul>
            `)}

            <p>
              Centered background messages will center horizontally and vertically.
              Your container for this element must have <code>position</code> set with <code>relative</code> or
              <code>absolute</code>.
            </p>

            {this.renderExampleHTML(dedent`
              <ul class='background-message centered'>
                <li>No Results</li>
              </ul>
            `)}
          </StyleguideSection>

          <StyleguideSection onDidInitialize={this.didInitializeSection.bind(this)} name='progress' title='Loading/Progress'>
            <h2>Progress Bars</h2>
            {this.renderExampleHTML(dedent`
              <div class='block'>
                <progress class='inline-block'></progress>
                <span class='inline-block'>Indeterminate</span>
              </div>

              <div class='block'>
                <progress class='inline-block' max='100' value='25'></progress>
                <span class='inline-block'>At 25%</span>
              </div>

              <div class='block'>
                <progress class='inline-block' max='100' value='50'></progress>
                <span class='inline-block'>At 50%</span>
              </div>

              <div class='block'>
                <progress class='inline-block' max='100' value='75'></progress>
                <span class='inline-block'>At 75%</span>
              </div>

              <div class='block'>
                <progress class='inline-block' max='100' value='100'></progress>
                <span class='inline-block'>At 100%</span>
              </div>
            `)}

            <h2>Loading Spinners</h2>
            {this.renderExampleHTML(dedent`
              <span class='loading loading-spinner-tiny inline-block'></span>
              <span class='loading loading-spinner-small inline-block'></span>
              <span class='loading loading-spinner-medium inline-block'></span>
              <span class='loading loading-spinner-large inline-block'></span>
            `)}
          </StyleguideSection>
        </main>
      </div>
    )
  }

  renderExampleHTML (html) {
    return (
      <div className='example'>
        <div className='example-rendered' innerHTML={html} />
        <div className='example-code show-example-html'>
          <CodeBlock cssClass='example-html' grammarScopeName='text.html.basic' code={html} />
        </div>
      </div>
    )
  }

  didInitializeSection (section) {
    this.sections.push(section)
  }
}
