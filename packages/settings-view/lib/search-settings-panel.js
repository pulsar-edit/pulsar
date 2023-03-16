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
            <div className='alert alert-warning icon icon-info'>
              This feature is experimental.<br />
              If you have feedback/suggestions, or you encounter any issues, feel free to report them here:&nbsp;
              <a href="https://github.com/orgs/pulsar-edit/discussions/150" style="text-decoration: underline;">
                https://github.com/orgs/pulsar-edit/discussions/150
              </a>
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

          schema.rank = this.generateRanks(text, schema.title, schema.description, setting, item)

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
    // In charge of generating each setting entry's rank
    let rankedTitle = this.getScore(this.handleSettingsString(searchText), this.handleSettingsString(title))
    let rankedDescription = this.getScore(this.handleSettingsString(searchText), this.handleSettingsString(description))
    let rankedSettingName = this.getScore(this.handleSettingsString(searchText), this.handleSettingsString(settingName))
    let rankedSettingItem = this.getScore(this.handleSettingsString(searchText), this.handleSettingsString(settingItem))

    let rank = {
      title: rankedTitle,
      description: rankedDescription,
      settingName: rankedSettingName,
      settingItem: rankedSettingItem
    };

    // Now to calculate the total score of the search resutls.
    // The total score will be a sume of all individual scores,
    // with weighted bonus' for higher matches depending on where the match was
    let titleBonus = (rank.title.score > 0.8) ? 0.2 : 0;
    let perfectTitleBonus = (rank.title.score === 1) ? 0.2 : 0;
    let descriptionBonus = (rank.description.score > 0.5) ? 0.1 : 0;
    let perfectDescriptionBonus = (rank.title.score === 1) ? 0.1 : 0;
    let settingNameBonus = (rank.settingName.score > 0.8) ? 0.2 : 0;
    let perfectSettingNameBonus = (rank.settingName.score === 1) ? 0.3 : 0;
    let settingItemBonus = (rank.settingItem.score > 0.8) ? 0.2 : 0;
    let perfectSettingItemBonus = (rank.settingItem.score === 1) ? 0.1 : 0;

    let totalScore =
      rank.title.score + titleBonus + perfectTitleBonus
      + rank.description.score + descriptionBonus + perfectDescriptionBonus
      + rank.settingName.score + settingNameBonus + perfectSettingNameBonus
      + rank.settingItem.score + settingItemBonus + perfectSettingItemBonus;

    rank.totalScore = totalScore;

    return rank;
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

  getScore (s1, s2) {
    // s1 is the text we are calculating the score against
    // s2 is the text the user typed
    // Below is an exact implmentation of Longest Common Subsequence

    let height = s1.length + 1;
    let width = s2.length + 1;
    let matrix = Array(height)
      .fill(0)
      .map(() => Array(width).fill(0));

    for (let row = 1; row < height; row++) {
      for (let col = 1; col < width; col++) {
        if (s1[row - 1] == s2[col - 1]) {
          matrix[row][col] = matrix[row - 1][col - 1] + 1;
        } else {
          matrix[row][col] = Math.max(matrix[row][col - 1], matrix[row - 1][col]);
        }
      }
    }

    let longest = this.lcsTraceback(matrix, s1, s2, height, width);
    // Now longest is a literal string of the longest common subsequence.
    // We will now assign a score to help ranking, but will still return the
    // text sequence, in case we want to use that for display purposes
    return {
      score: longest.length / s1.length,
      sequence: longest
    };
  }

  lcsTraceback (matrix, s1, s2, height, width) {
    if (height === 0 || width === 0) {
      return "";
    }
    if (s1[height - 1] == s2[width - 1]) {
      return (
        this.lcsTraceback(matrix, s1, s2, height - 1, width - 1) +
          (s1[height - 1] ? s1[height - 1] : "")
      );
    }
    if (matrix[height][width - 1] > matrix[height - 1][width]) {
      return this.lcsTraceback(matrix, s1, s2, height, width - 1);
    }
    return this.lcsTraceback(matrix, s1, s2, height - 1, width);
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
