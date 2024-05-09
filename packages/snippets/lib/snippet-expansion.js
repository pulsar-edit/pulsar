const {CompositeDisposable, Range, Point} = require('atom')

module.exports = class SnippetExpansion {
  constructor (snippet, editor, cursor, snippets, {method} = {}) {
    this.settingTabStop = false
    this.isIgnoringBufferChanges = false
    this.onUndoOrRedo = this.onUndoOrRedo.bind(this)
    this.snippet = snippet
    this.editor = editor
    this.cursor = cursor
    this.snippets = snippets
    this.subscriptions = new CompositeDisposable
    this.selections = [this.cursor.selection]

    // Method refers to how the snippet was invoked; known values are `prefix`
    // or `command`. If neither is present, then snippet was inserted
    // programmatically.
    this.method = method

    // Holds the `Insertion` instance corresponding to each tab stop marker. We
    // don't use the tab stop's own numbering here; we renumber them
    // consecutively starting at 0 in the order in which they should be
    // visited. So `$1` (if present) will always be at index `0`, and `$0` (if
    // present) will always be the last index.
    this.insertionsByIndex = []

    // Each insertion has a corresponding marker. We keep them in a map so we
    // can easily reassociate an insertion with its new marker when we destroy
    // its old one.
    this.markersForInsertions = new Map()

    this.resolutionsForVariables = new Map()
    this.markersForVariables = new Map()

    // The index of the active tab stop.
    this.tabStopIndex = null

    // If, say, tab stop 4's placeholder references tab stop 2, then tab stop
    // 4's insertion goes into this map as a "related" insertion to tab stop 2.
    // We need to keep track of this because tab stop 4's marker will need to
    // be replaced while 2 is the active index.
    this.relatedInsertionsByIndex = new Map()

    const startPosition = this.cursor.selection.getBufferRange().start
    let {body, tabStopList} = this.snippet
    let tabStops = tabStopList.toArray()

    let indent = this.editor.lineTextForBufferRow(startPosition.row).match(/^\s*/)[0]
    if (this.snippet.lineCount > 1 && indent) {
      // Add proper leading indentation to the snippet
      body = body.replace(/\n/g, `\n${indent}`)

      tabStops = tabStops.map(tabStop => tabStop.copyWithIndent(indent))
    }

    this.ignoringBufferChanges(() => {
      this.editor.transact(() => {
        // Determine what each variable reference will be replaced by
        // _before_ we make any changes to the state of the editor. This
        // affects $TM_SELECTED_TEXT, $TM_CURRENT_WORD, and others.
        this.resolveVariables(startPosition)
        // Insert the snippet body at the cursor.
        const newRange = this.cursor.selection.insertText(body, {autoIndent: false})
        // Mark the range we just inserted. Once we interpolate variables and
        // apply transformations, the range may grow, and we need to keep
        // track of that so we can normalize tabs later on.
        const newRangeMarker = this.getMarkerLayer(this.editor).markBufferRange(newRange, {exclusive: false})

        if (this.snippet.tabStopList.length > 0) {
          // Listen for cursor changes so we can decide whether to keep the
          // snippet active or terminate it.
          this.subscriptions.add(
            this.cursor.onDidChangePosition(event => this.cursorMoved(event)),
            this.cursor.onDidDestroy(() => this.cursorDestroyed())
          )
          // First we'll add display markers for tab stops and variables.
          // Both need these areas to be marked before any expansion happens
          // so that they don't lose track of where their slots are.
          this.placeTabStopMarkers(startPosition, tabStops)
          this.markVariables(startPosition)

          // Now we'll expand variables. All markers in the previous step
          // were defined with `exclusive: false`, so any that are affected
          // by variable expansion will grow if necessary.
          this.expandVariables(startPosition)

          // Now we'll make the first tab stop active and apply snippet
          // transformations for the first time. As part of this process,
          // most markers will be converted to `exclusive: true` and adjusted
          // as necessary as the user tabs through the snippet.
          this.setTabStopIndex(0)
          this.applyAllTransformations()

          this.snippets.addExpansion(this.editor, this)
        } else {
          // No tab stops, so we're free to mark and expand variables without
          // worrying about the delicate order of operations.
          this.markVariables(startPosition)
          this.expandVariables(startPosition)
        }

        // Snippet bodies are written generically and don't know anything
        // about the user's indentation settings. So we adjust them after
        // expansion.
        this.editor.normalizeTabsInBufferRange(newRangeMarker.getBufferRange())
      })
    })
  }

  // Set a flag on undo or redo so that we know not to re-apply transforms.
  // They're already accounted for in the history.
  onUndoOrRedo (isUndo) {
    this.isUndoingOrRedoing = true
  }

  cursorMoved ({oldBufferPosition, newBufferPosition, textChanged}) {
    if (this.settingTabStop || textChanged) { return }
    const insertionAtCursor = this.insertionsByIndex[this.tabStopIndex].find(insertion => {
      let marker = this.markersForInsertions.get(insertion)
      return marker.getBufferRange().containsPoint(newBufferPosition)
    })

    if (insertionAtCursor && !insertionAtCursor.isTransformation()) { return }

    this.destroy()
  }

  cursorDestroyed () {
    // The only time a cursor can be destroyed without it ending the snippet is
    // if we move from a mirrored tab stop (i.e., multiple cursors) to a
    // single-cursor tab stop.
    if (!this.settingTabStop) { this.destroy() }
  }

  textChanged (event) {
    if (this.isIgnoringBufferChanges) { return }

    // Don't try to alter the buffer if all we're doing is restoring a snapshot
    // from history.
    if (this.isUndoingOrRedoing) {
      this.isUndoingOrRedoing = false
      return
    }

    this.applyTransformations(this.tabStopIndex)
  }

  ignoringBufferChanges (callback) {
    const wasIgnoringBufferChanges = this.isIgnoringBufferChanges
    this.isIgnoringBufferChanges = true
    callback()
    this.isIgnoringBufferChanges = wasIgnoringBufferChanges
  }

  applyAllTransformations () {
    this.editor.transact(() => {
      this.insertionsByIndex.forEach((insertion, index) =>
        this.applyTransformations(index))
    })
  }

  applyTransformations (tabStopIndex) {
    const insertions = [...this.insertionsByIndex[tabStopIndex]]
    if (insertions.length === 0) { return }

    const primaryInsertion = insertions.shift()
    const primaryRange = this.markersForInsertions.get(primaryInsertion).getBufferRange()
    const inputText = this.editor.getTextInBufferRange(primaryRange)

    this.ignoringBufferChanges(() => {
      for (const [index, insertion] of insertions.entries()) {
        // Don't transform mirrored tab stops. They have their own cursors, so
        // mirroring happens automatically.
        if (!insertion.isTransformation()) { continue }

        var marker = this.markersForInsertions.get(insertion)
        var range = marker.getBufferRange()

        var outputText = insertion.transform(inputText)
        this.editor.transact(() => this.editor.setTextInBufferRange(range, outputText))

        // Manually adjust the marker's range rather than rely on its internal
        // heuristics. (We don't have to worry about whether it's been
        // invalidated because setting its buffer range implicitly marks it as
        // valid again.)
        const newRange = new Range(
          range.start,
          range.start.traverse(new Point(0, outputText.length))
        )
        marker.setBufferRange(newRange)
      }
    })
  }

  resolveVariables (startPosition) {
    let params = {
      editor: this.editor,
      cursor: this.cursor,
      selectionRange: this.cursor.selection.getBufferRange(),
      method: this.method
    }

    for (const variable of this.snippet.variables) {
      let resolution = variable.resolve(params)
      this.resolutionsForVariables.set(variable, resolution)
    }
  }

  markVariables (startPosition) {
    // We make two passes here. On the first pass, we create markers for each
    // point where a variable will be inserted. On the second pass, we use each
    // marker to insert the resolved variable value.
    //
    // Those points will move around as we insert text into them, so the
    // markers are crucial for ensuring we adapt to those changes.
    for (const variable of this.snippet.variables) {
      const {point} = variable
      const marker = this.getMarkerLayer(this.editor).markBufferRange([
        startPosition.traverse(point),
        startPosition.traverse(point)
      ], {exclusive: false})
      this.markersForVariables.set(variable, marker)
    }
  }

  expandVariables (startPosition) {
    this.editor.transact(() => {
      for (const variable of this.snippet.variables) {
        let marker = this.markersForVariables.get(variable)
        let resolution = this.resolutionsForVariables.get(variable)
        let range = marker.getBufferRange()
        this.editor.setTextInBufferRange(range, resolution)
      }
    })
  }

  placeTabStopMarkers (startPosition, tabStops) {
    // Tab stops within a snippet refer to one another by their external index
    // (1 for $1, 3 for $3, etc.). We respect the order of these tab stops, but
    // we renumber them starting at 0 and using consecutive numbers.
    //
    // Luckily, we don't need to convert between the two numbering systems very
    // often. But we do have to build a map from external index to our internal
    // index. We do this in a separate loop so that the table is complete
    // before we need to consult it in the following loop.
    const indexTable = {}
    for (let [index, tabStop] of tabStops.entries()) {
      indexTable[tabStop.index] = index
    }

    for (let [index, tabStop] of tabStops.entries()) {
      const {insertions} = tabStop

      if (!tabStop.isValid()) { continue }

      for (const insertion of insertions) {
        const {range} = insertion
        const {start, end} = range
        let references = null
        if (insertion.references) {
          references = insertion.references.map(external => indexTable[external])
        }
        // This is our initial pass at marking tab stop regions. In a minute,
        // once the first tab stop is made active, we will make some of these
        // markers exclusive and some inclusive. But right now we need them all
        // to be inclusive, because we want them all to react when we resolve
        // snippet variables, and grow if they need to.
        const marker = this.getMarkerLayer(this.editor).markBufferRange([
          startPosition.traverse(start),
          startPosition.traverse(end)
        ], {exclusive: false})
        // Now that we've created these markers, we need to store them in a
        // data structure because they'll need to be deleted and re-created
        // when their exclusivity changes.
        this.markersForInsertions.set(insertion, marker)

        if (references) {
          // The insertion at tab stop `index` (internal numbering) is related
          // to, and affected by, all the tab stops mentioned in `references`
          // (internal numbering). We need to make sure we're included in these
          // other tab stops' exclusivity changes.
          for (let ref of references) {
            let relatedInsertions = this.relatedInsertionsByIndex.get(ref) || []
            relatedInsertions.push(insertion)
            this.relatedInsertionsByIndex.set(ref, relatedInsertions)
          }
        }
      }
      this.insertionsByIndex[index] = insertions
    }
  }

  // When two insertion markers are directly adjacent to one another, and the
  // cursor is placed right at the border between them, the marker that should
  // "claim" the newly typed content will vary based on context.
  //
  // All else being equal, that content should get added to the marker (if any)
  // whose tab stop is active, or else the marker whose tab stop's placeholder
  // references an active tab stop. To use the terminology of Atom's
  // `DisplayMarker`, all markers related to the active tab stop should be
  // "inclusive," and all others should be "exclusive."
  //
  // Exclusivity cannot be changed after a marker is created. So we need to
  // revisit the markers whenever the active tab stop changes, figure out which
  // ones need to be touched, and replace them with markers that have the
  // settings we need.
  //
  adjustTabStopMarkers (oldIndex, newIndex) {
    // All the insertions belonging to the newly active tab stop (and all
    // insertions whose placeholders reference the newly active tab stop)
    // should become inclusive.
    const insertionsToMakeInclusive = [
      ...this.insertionsByIndex[newIndex],
      ...(this.relatedInsertionsByIndex.get(newIndex) || [])
    ]

    // All insertions that are _not_ related to the newly active tab stop
    // should become exclusive if they aren't already.
    let insertionsToMakeExclusive
    if (oldIndex === null) {
      // This is the first index to be made active. Since all insertion markers
      // were initially created to be inclusive, we need to adjust _all_
      // insertion markers that are not related to the new tab stop.
      let allInsertions = this.insertionsByIndex.reduce((set, ins) => {
        set.push(...ins)
        return set
      }, [])
      insertionsToMakeExclusive = allInsertions.filter(ins => {
        return !insertionsToMakeInclusive.includes(ins)
      })
    } else {
      // We are moving from one tab stop to another, so we only need to touch
      // the markers related to the tab stop we're departing.
      insertionsToMakeExclusive = [
        ...this.insertionsByIndex[oldIndex],
        ...(this.relatedInsertionsByIndex.get(oldIndex) || [])
      ]
    }

    for (let insertion of insertionsToMakeExclusive) {
      this.replaceMarkerForInsertion(insertion, {exclusive: true})
    }

    for (let insertion of insertionsToMakeInclusive) {
      this.replaceMarkerForInsertion(insertion, {exclusive: false})
    }
  }

  replaceMarkerForInsertion (insertion, settings) {
    const marker = this.markersForInsertions.get(insertion)

    // If the marker is invalid or destroyed, return it as-is. Other methods
    // need to know if a marker has been invalidated or destroyed, and we have
    // no need to change the settings on such markers anyway.
    if (!marker.isValid() || marker.isDestroyed()) {
      return marker
    }

    // Otherwise, create a new marker with an identical range and the specified
    // settings.
    const range = marker.getBufferRange()
    const replacement = this.getMarkerLayer(this.editor).markBufferRange(range, settings)

    marker.destroy()
    this.markersForInsertions.set(insertion, replacement)
    return replacement
  }

  goToNextTabStop () {
    const nextIndex = this.tabStopIndex + 1
    if (nextIndex < this.insertionsByIndex.length) {
      if (this.setTabStopIndex(nextIndex)) {
        return true
      } else {
        return this.goToNextTabStop()
      }
    } else {
      // The user has tabbed past the last tab stop. If the last tab stop is a
      // $0, we shouldn't move the cursor any further.
      if (this.snippet.tabStopList.hasEndStop) {
        this.destroy()
        return false
      } else {
        const succeeded = this.goToEndOfLastTabStop()
        this.destroy()
        return succeeded
      }
    }
  }

  goToPreviousTabStop () {
    if (this.tabStopIndex > 0) { this.setTabStopIndex(this.tabStopIndex - 1) }
  }

  setTabStopIndex (newIndex) {
    const oldIndex = this.tabStopIndex
    this.tabStopIndex = newIndex
    // Set a flag before moving any selections so that our change handlers know
    // that the movements were initiated by us.
    this.settingTabStop = true
    // Keep track of whether we placed any selections or cursors.
    let markerSelected = false

    const insertions = this.insertionsByIndex[this.tabStopIndex]
    if (insertions.length === 0) { return false }

    const ranges = []
    this.hasTransforms = false

    // Go through the active tab stop's markers to figure out where to place
    // cursors and/or selections.
    for (const insertion of insertions) {
      const marker = this.markersForInsertions.get(insertion)
      if (marker.isDestroyed()) { continue }
      if (!marker.isValid()) { continue }
      if (insertion.isTransformation()) {
        // Set a flag for later, but skip transformation insertions because
        // they don't get their own cursors.
        this.hasTransforms = true
        continue
      }
      ranges.push(marker.getBufferRange())
    }

    if (ranges.length > 0) {
      // We have new selections to apply. Reuse existing selections if
      // possible, destroying the unused ones if we already have too many.
      for (const selection of this.selections.slice(ranges.length)) { selection.destroy() }
      this.selections = this.selections.slice(0, ranges.length)
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i]
        if (this.selections[i]) {
          this.selections[i].setBufferRange(range)
        } else {
          const newSelection = this.editor.addSelectionForBufferRange(range)
          this.subscriptions.add(newSelection.cursor.onDidChangePosition(event => this.cursorMoved(event)))
          this.subscriptions.add(newSelection.cursor.onDidDestroy(() => this.cursorDestroyed()))
          this.selections.push(newSelection)
        }
      }
      // We placed at least one selection, so this tab stop was successfully
      // set.
      markerSelected = true
    }

    this.settingTabStop = false
    // If this snippet has at least one transform, we need to observe changes
    // made to the editor so that we can update the transformed tab stops.
    if (this.hasTransforms) {
      this.snippets.observeEditor(this.editor)
    } else {
      this.snippets.stopObservingEditor(this.editor)
    }

    this.adjustTabStopMarkers(oldIndex, newIndex)

    return markerSelected
  }

  goToEndOfLastTabStop () {
    const size = this.insertionsByIndex.length
    if (size === 0) { return }
    const insertions = this.insertionsByIndex[size - 1]
    if (insertions.length === 0) { return }
    const lastMarker = this.markersForInsertions.get(insertions[insertions.length - 1])

    if (lastMarker.isDestroyed()) {
      return false
    } else {
      this.editor.setCursorBufferPosition(lastMarker.getEndBufferPosition())
      return true
    }
  }

  destroy () {
    this.subscriptions.dispose()
    this.getMarkerLayer(this.editor).clear()
    this.insertionsByIndex = []
    this.relatedInsertionsByIndex.clear()
    this.markersForInsertions.clear()
    this.resolutionsForVariables.clear()
    this.markersForVariables.clear()

    this.snippets.stopObservingEditor(this.editor)
    this.snippets.clearExpansions(this.editor)
  }

  getMarkerLayer () {
    return this.snippets.findOrCreateMarkerLayer(this.editor)
  }

  restore (editor) {
    this.editor = editor
    this.snippets.addExpansion(this.editor, this)
  }
}
