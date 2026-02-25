/** @babel */
/** @jsx etch.dom */

import { TextEditor, CompositeDisposable } from 'atom'
import etch from 'etch'
import CollapsibleSectionPanel from './collapsible-section-panel'
import SearchSettingView from './search-setting-view'

export default class SearchSettingsPanel extends CollapsibleSectionPanel {
  constructor(settingsView) {
    super()
    etch.initialize(this)
    this.settingsView = settingsView
    this.searchResults = []
    // Get all available settings
    this.settingsSchema = atom.config.schema.properties;

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(this.handleEvents())
    this.subscriptions.add(atom.commands.add(this.element, {
      'core:move-up': () => { this.scrollUp() },
      'core:move-down': () => { this.scrollDown() },
      'core:page-up': () => { this.pageUp() },
      'core:page-down': () => { this.pageDown() },
      'core:move-to-top': () => { this.scrollToTop() },
      'core:move-to-bottom': () => { this.scrollToBottom() }
    }))

    this.subscriptions.add(
      this.refs.searchEditor.onDidStopChanging(() => { this.matchSettings() })
    )
  }

  focus () {
    this.refs.searchEditor.element.focus()
  }

  show () {
    this.element.style.display = ''
    // Don't show the loading for search results as soon as page appears
    this.refs.loadingArea.style.display = 'none'
  }

  destroy () {
    this.subscriptions.dispose()
    return etch.destroy(this)
  }

  update () {}

  render () {
    return (
      <div className='panels-item' tabIndex='-1'>
        <section className='section'>
          <div className='section-container'>
            <div className='section-heading icon icon-search-save'>
              Search Pulsar's Settings
            </div>
<div className='editor-container'>
              <TextEditor ref='searchEditor' mini placeholderText='Start Searching for Settings' />
            </div>

            <section className='sub-section search-results'>
              <h3 ref='searchHeader' className='sub-section-heading icon icon-package'>
                Search Results
              </h3>
              <div ref='searchResults' className='container package-container'>
                <div ref='loadingArea' className='alert alert-info loading-area icon icon-hourglass'>
                  Loading Results...
                </div>
              </div>
            </section>

          </div>
        </section>
      </div>
    )
  }

  matchSettings () {
    // this is called after the user types.
    // So lets show our loading message after removing any previous results
    this.clearSearchResults()
    this.refs.loadingArea.style.display = ''
    this.filterSettings(this.refs.searchEditor.getText())
  }

  clearSearchResults () {
    for (let i = 0; i < this.searchResults.length; i++) {
      this.searchResults[i].destroy()
    }
    this.searchResults = []
  }

  filterSettings (text) {
    let rankedResults = [];

    let searchTerm = text;
    let namedFilter;
    let useFilter = false;

    // Now we will check if the user is filtering any results

    if (text.startsWith("core: ")) {
      searchTerm = text.replace("core: ", "");
      namedFilter = "core";
      useFilter = true;
    }

    if (text.startsWith("editor: ")) {
      searchTerm = text.replace("editor: ", "");
      namedFilter = "editor";
      useFilter = true;
    }

    for (const setting in this.settingsSchema) {
      // The top level item should always be an object, but just in case we will check.
      // If the top level item returned is not an object it will NOT be listed
      if (useFilter) {

        if (namedFilter !== setting) {
          continue;
          // We use this so that we can break out of our current loop iteration
          // when using a filter that doesn't match the current namespace.
          // But otherwise will process the settings when no filter is set
          // or when the filter set matches our current namespace.
          // This helps avoid processing any namespace that doesn't match our filter
          // or process all of them as default.
        }
      }

      if (this.settingsSchema[setting].type === "object") {
        for (const item in this.settingsSchema[setting].properties) {

          let schema = this.settingsSchema[setting].properties[item];

          schema.rank = this.generateRanks(searchTerm, schema.title, schema.description, setting, item)

          schema.path = `${setting}.${item}`

          rankedResults.push(schema)
        }
      }

    }

    this.processRanks(rankedResults)
  }

  handleSettingsString (string) {
    return string?.toLowerCase() ?? "";
  }

  generateRanks (searchText, title, description, settingName, settingItem) {
    let candidate = [settingName, settingItem, title]
      .filter(Boolean).join(' ');

    let result = this.getScore(candidate, searchText);

    // Only use description as a tiebreaker when primary fields already match
    let descBonus = 0;
    if (result.score > 0 && description) {
      let descResult = this.getScore(description, searchText);
      descBonus = descResult.score * 0.01;
    }

    return { totalScore: result.score + descBonus, matchIndexes: result.matchIndexes };
  }

  processRanks (ranks) {
    // Gets an array of schemas with ranks included

    // Removes any scores below a specific limit
    let filteredRanks = ranks.filter(item => item.rank.totalScore > atom.config.get("settings-view.searchSettingsMinimumScore"));

    // Sorts the array from highest score to lowest score
    filteredRanks.sort((a, b) => {
      if (a.rank.totalScore < b.rank.totalScore) {
        return 1;
      }
      if (a.rank.totalScore > b.rank.totalScore) {
        return -1;
      }
      return 0;
    });

    // Remove our loading symbol
    this.refs.loadingArea.style.display = 'none'

    for (const setting of filteredRanks) {
      let searchView = new SearchSettingView(setting, this.settingsView)
      this.refs.searchResults.appendChild(searchView.element)
      this.searchResults.push(searchView)
    }

  }

  getScore (candidate, query) {
    if (!candidate || !query) {
      return { score: 0, matchIndexes: [] };
    }
    const result = atom.ui.fuzzyMatcher.match(candidate, query, { recordMatchIndexes: true });
    if (result) {
      return { score: result.score, matchIndexes: result.matchIndexes };
    }
    return { score: 0, matchIndexes: [] };
  }

  // Boiler Plate Functions
  scrollUp () {
    this.element.scrollTop -= document.body.offsetHeight / 20
  }

  scrollDown () {
    this.element.scrollTop += document.body.offsetHeight / 20
  }

  pageUp () {
    this.element.scrollTop -= this.element.offsetHeight
  }

  pageDown () {
    this.element.scrollTop += this.element.offsetHeight
  }

  scrollToTop () {
    this.element.scrollTop = 0
  }

  scrollToBottom () {
    this.element.scrollTop = this.element.scrollHeight
  }
}
