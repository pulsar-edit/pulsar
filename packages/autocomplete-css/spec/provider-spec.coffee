packagesToTest =
  CSS:
    name: 'language-css'
    file: 'test.css'
  SCSS:
    name: 'language-sass'
    file: 'test.scss'
  Less:
    name: 'language-less'
    file: 'test.less'
  PostCSS:
    name: 'language-postcss'
    file: 'test.postcss'

# Throughout the entirety of this test document there are many places that the
# original Atom tests would check for exact values of returned items such as
# matching properties or matching tags. But as the web changes this is
# combersome to maintain, to do Pulsar's best to avoid regressions in this aspect
# these locations will now check for more than the last good value.
# This of course assumes that the web won't start removing matching items faster
# than adding. But locations of this behavior will be marked accordingly with: #398
# https://github.com/pulsar-edit/pulsar/pull/398

Object.keys(packagesToTest).forEach (packageLabel) ->
  unless atom.packages.getAvailablePackageNames().includes(packagesToTest[packageLabel].name)
    console.warn "Skipping tests for #{packageLabel} because it is not installed"
    delete packagesToTest[packageLabel]

describe "CSS property name and value autocompletions", ->
  [editor, provider] = []

  getCompletions = (options={}) ->
    cursor = editor.getLastCursor()
    start = cursor.getBeginningOfCurrentWordBufferPosition()
    end = cursor.getBufferPosition()
    prefix = editor.getTextInRange([start, end])
    request =
      editor: editor
      bufferPosition: end
      scopeDescriptor: cursor.getScopeDescriptor()
      prefix: prefix
      activatedManually: options.activatedManually ? true
    provider.getSuggestions(request)

  isValueInCompletions = (value, completions) ->
    completionsNodesText = []
    for completion in completions
      completionsNodesText.push(completion.text)
    return value in completionsNodesText

  beforeEach ->
    waitsForPromise -> atom.packages.activatePackage('autocomplete-css')
    waitsForPromise -> atom.packages.activatePackage('language-css') # Used in all CSS languages

    runs ->
      provider = atom.packages.getActivePackage('autocomplete-css').mainModule.getProvider()

    waitsFor -> Object.keys(provider.properties).length > 0

  Object.keys(packagesToTest).forEach (packageLabel) ->
    describe "#{packageLabel} files", ->
      beforeEach ->
        waitsForPromise -> atom.packages.activatePackage(packagesToTest[packageLabel].name)
        waitsForPromise -> atom.workspace.open(packagesToTest[packageLabel].file)
        runs -> editor = atom.workspace.getActiveTextEditor()

      it "returns tag completions when not in a property list", ->
        editor.setText('')
        expect(getCompletions()).toBe null

        editor.setText('d')
        editor.setCursorBufferPosition([0, 0])
        expect(getCompletions()).toBe null

        editor.setCursorBufferPosition([0, 1])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 9  # #398
        for completion in completions
          expect(completion.text.length).toBeGreaterThan 0
          expect(completion.type).toBe 'tag'

      it "autocompletes property names without a prefix when activated manually", ->
        editor.setText """
          body {

          }
        """
        editor.setCursorBufferPosition([1, 0])
        completions = getCompletions(activatedManually: true)
        expect(completions.length).toBeGreaterThan 237  # #398 Fun Fact last check this was 673
        for completion in completions
          expect(completion.text.length).toBeGreaterThan 0
          expect(completion.type).toBe 'property'
          expect(completion.descriptionMoreURL.length).toBeGreaterThan 0

      it "does not autocomplete property names without a prefix when not activated manually", ->
        editor.setText """
          body {

          }
        """
        editor.setCursorBufferPosition([1, 0])
        completions = getCompletions(activatedManually: false)
        expect(completions).toEqual []

      it "autocompletes property names with a prefix", ->
        editor.setText """
          body {
            d
          }
        """
        editor.setCursorBufferPosition([1, 3])
        completions = getCompletions()

        expect(isValueInCompletions('display: ', completions)).toBe true
        expect(isValueInCompletions('direction: ', completions)).toBe true

        # Then no matter what the top results are there's still some we can expect of them.
        expect(completions[0].type).toBe 'property'
        expect(completions[0].replacementPrefix).toBe 'd'
        expect(completions[0].description.length).toBeGreaterThan 0
        expect(completions[0].descriptionMoreURL.length).toBeGreaterThan 0
        expect(completions[1].type).toBe 'property'
        expect(completions[1].replacementPrefix).toBe 'd'

        editor.setText """
          body {
            D
          }
        """
        editor.setCursorBufferPosition([1, 3])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 2  # #398
        expect(isValueInCompletions('display: ', completions)).toBe true
        expect(isValueInCompletions('direction: ', completions)).toBe true

        expect(completions[1].replacementPrefix).toBe 'D'

        editor.setText """
          body {
            d:
          }
        """
        editor.setCursorBufferPosition([1, 3])
        completions = getCompletions()
        expect(isValueInCompletions('display: ', completions)).toBe true
        expect(isValueInCompletions('direction: ', completions)).toBe true

        editor.setText """
          body {
            bord
          }
        """
        editor.setCursorBufferPosition([1, 6])
        completions = getCompletions()
        expect(isValueInCompletions('border: ', completions)).toBe true

        expect(completions[0].replacementPrefix).toBe 'bord'

      it "does not autocomplete when at a terminator", ->
        editor.setText """
          body {
            .somemixin();
          }
        """
        editor.setCursorBufferPosition([1, 15])
        completions = getCompletions()
        expect(completions).toBe null

      it "does not autocomplete property names when preceding a {", ->
        editor.setText """
          body,{
          }
        """
        editor.setCursorBufferPosition([0, 5])
        completions = getCompletions()
        expect(completions).toBe null

        editor.setText """
          body,{}
        """
        editor.setCursorBufferPosition([0, 5])
        completions = getCompletions()
        expect(completions).toBe null

        editor.setText """
          body
          {
          }
        """
        editor.setCursorBufferPosition([1, 0])
        completions = getCompletions()
        expect(completions).toBe null

      it "does not autocomplete property names when immediately after a }", ->
        editor.setText """
          body{}
        """
        editor.setCursorBufferPosition([0, 6])
        completions = getCompletions()
        expect(completions).toBe null

        editor.setText """
          body{
          }
        """
        editor.setCursorBufferPosition([1, 1])
        completions = getCompletions()
        expect(completions).toBe null

      it "autocompletes property names when the cursor is up against the punctuation inside the property list", ->
        editor.setText """
          body {
          }
        """
        editor.setCursorBufferPosition([0, 6])
        completions = getCompletions()
        expect(isValueInCompletions('width: ', completions)).toBe true

        editor.setText """
          body {
          }
        """
        editor.setCursorBufferPosition([1, 0])
        completions = getCompletions()
        expect(isValueInCompletions('width: ', completions)).toBe true

        editor.setText """
          body { }
        """
        editor.setCursorBufferPosition([0, 6])
        completions = getCompletions()
        expect(isValueInCompletions('width: ', completions)).toBe true

        editor.setText """
          body { }
        """
        editor.setCursorBufferPosition([0, 7])
        completions = getCompletions()
        expect(isValueInCompletions('width: ', completions)).toBe true

      it "triggers autocomplete when an property name has been inserted", ->
        spyOn(atom.commands, 'dispatch')
        suggestion = {type: 'property', text: 'whatever'}
        provider.onDidInsertSuggestion({editor, suggestion})

        advanceClock 1
        expect(atom.commands.dispatch).toHaveBeenCalled()

        args = atom.commands.dispatch.mostRecentCall.args
        expect(args[0].tagName.toLowerCase()).toBe 'atom-text-editor'
        expect(args[1]).toBe 'autocomplete-plus:activate'

      it "autocompletes property values without a prefix", ->
        editor.setText """
          body {
            display:
          }
        """
        editor.setCursorBufferPosition([1, 10])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 24  # #398
        for completion in completions
          expect(completion.text.length).toBeGreaterThan 0
          expect(completion.description.length).toBeGreaterThan 0
          expect(completion.descriptionMoreURL.length).toBeGreaterThan 0

        editor.setText """
          body {
            display:

          }
        """
        editor.setCursorBufferPosition([2, 0])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 24  # #398
        for completion in completions
          expect(completion.text.length).toBeGreaterThan 0

      it "autocompletes property values with a prefix", ->
        editor.setText """
          body {
            display: i
          }
        """
        editor.setCursorBufferPosition([1, 12])
        completions = getCompletions()
        expect(isValueInCompletions('inline;', completions)).toBe true
        expect(isValueInCompletions('inline-block;', completions)).toBe true
        expect(isValueInCompletions('inline-flex;', completions)).toBe true
        expect(isValueInCompletions('inline-grid;', completions)).toBe true
        expect(isValueInCompletions('inline-table;', completions)).toBe true
        expect(isValueInCompletions('inherit;', completions)).toBe true
        expect(completions[0].description.length).toBeGreaterThan 0
        expect(completions[0].descriptionMoreURL.length).toBeGreaterThan 0

        editor.setText """
          body {
            display: I
          }
        """
        editor.setCursorBufferPosition([1, 12])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 6 # #398
        expect(isValueInCompletions('inline;', completions)).toBe true
        expect(isValueInCompletions('inline-block;', completions)).toBe true
        expect(isValueInCompletions('inline-flex;', completions)).toBe true
        expect(isValueInCompletions('inline-grid;', completions)).toBe true
        expect(isValueInCompletions('inline-table;', completions)).toBe true
        expect(isValueInCompletions('inherit;', completions)).toBe true

        editor.setText """
          body {
            display:
              i
          }
        """
        editor.setCursorBufferPosition([2, 5])
        completions = getCompletions()
        expect(isValueInCompletions('inline;', completions)).toBe true
        expect(isValueInCompletions('inline-block;', completions)).toBe true
        expect(isValueInCompletions('inline-flex;', completions)).toBe true
        expect(isValueInCompletions('inline-grid;', completions)).toBe true
        expect(isValueInCompletions('inline-table;', completions)).toBe true
        expect(isValueInCompletions('inherit;', completions)).toBe true

        editor.setText """
          body {
            text-align:
          }
        """
        editor.setCursorBufferPosition([1, 13])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 5 # #398
        expect(isValueInCompletions('center;', completions)).toBe true
        expect(isValueInCompletions('left;', completions)).toBe true
        expect(isValueInCompletions('justify;', completions)).toBe true
        expect(isValueInCompletions('right;', completions)).toBe true
        expect(isValueInCompletions('inherit;', completions)).toBe true

        editor.setText """
          body {
            text-align: c
          }
        """
        editor.setCursorBufferPosition([1, 15])
        completions = getCompletions()
        expect(completions).toHaveLength 1
        expect(completions[0].text).toBe 'center;'

      it "does not complete property values after percentage signs", ->
        editor.setText """
          body {
            width: 100%
          }
        """
        editor.setCursorBufferPosition([1, 13])
        completions = getCompletions()
        expect(completions).toHaveLength 0

      it "it doesn't add semicolon after a property if one is already present", ->
        editor.setText """
          body {
            display: i;
          }
        """
        editor.setCursorBufferPosition([1, 12])
        completions = getCompletions()
        completions.forEach (completion) ->
          expect(completion.text).not.toMatch(/;\s*$/)

      it "autocompletes inline property values", ->
        editor.setText "body { display: }"
        editor.setCursorBufferPosition([0, 16])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 24  # #398
        expect(isValueInCompletions('block;', completions)).toBe true

        editor.setText """
          body {
            display: block; float:
          }
        """
        editor.setCursorBufferPosition([1, 24])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 4  # #398
        expect(isValueInCompletions('left;', completions)).toBe true

      it "autocompletes more than one inline property value", ->
        editor.setText "body { display: block; float: }"
        editor.setCursorBufferPosition([0, 30])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 4 # #398
        expect(isValueInCompletions('left;', completions)).toBe true

        editor.setText "body { display: block; float: left; cursor: alias; text-decoration: }"
        editor.setCursorBufferPosition([0, 68])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 5  # #398
        expect(isValueInCompletions('line-through;', completions)).toBe true

      it "autocompletes inline property values with a prefix", ->
        editor.setText "body { display: i }"
        editor.setCursorBufferPosition([0, 17])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 6  # #398
        expect(isValueInCompletions('inline;', completions)).toBe true
        expect(isValueInCompletions('inline-block;', completions)).toBe true
        expect(isValueInCompletions('inline-flex;', completions)).toBe true
        expect(isValueInCompletions('inline-grid;', completions)).toBe true
        expect(isValueInCompletions('inline-table;', completions)).toBe true
        expect(isValueInCompletions('inherit;', completions)).toBe true

        editor.setText "body { display: i}"
        editor.setCursorBufferPosition([0, 17])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 6 # #398
        expect(isValueInCompletions('inline;', completions)).toBe true
        expect(isValueInCompletions('inline-block;', completions)).toBe true
        expect(isValueInCompletions('inline-flex;', completions)).toBe true
        expect(isValueInCompletions('inline-grid;', completions)).toBe true
        expect(isValueInCompletions('inline-table;', completions)).toBe true
        expect(isValueInCompletions('inherit;', completions)).toBe true

      it "autocompletes inline property values that aren't at the end of the line", ->
        editor.setText "body { float: display: inline; font-weight: bold; }"
        editor.setCursorBufferPosition([0, 14]) # right before display
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 4  # #398
        expect(isValueInCompletions('left;', completions)).toBe true
        expect(isValueInCompletions('right;', completions)).toBe true
        expect(isValueInCompletions('none;', completions)).toBe true
        expect(isValueInCompletions('inherit;', completions)).toBe true

      it "autocompletes !important in property-value scope", ->
        editor.setText """
          body {
            display: inherit !im
          }
        """
        editor.setCursorBufferPosition([1, 22])
        completions = getCompletions()

        important = null
        for c in completions
          important = c if c.displayText is '!important'

        expect(important.displayText).toBe '!important'

      it "does not autocomplete !important in property-name scope", ->
        editor.setText """
          body {
            !im
          }
        """
        editor.setCursorBufferPosition([1, 5])
        completions = getCompletions()

        important = null
        for c in completions
          important = c if c.displayText is '!important'

        expect(important).toBe null

      describe "tags", ->
        it "autocompletes with a prefix", ->
          editor.setText """
            ca {
            }
          """
          editor.setCursorBufferPosition([0, 2])
          completions = getCompletions()
          expect(completions.length).toBeGreaterThan 7 # #398
          expect(isValueInCompletions('canvas', completions)).toBe true
          expect(isValueInCompletions('code', completions)).toBe true

          expect(completions[0].type).toBe 'tag'
          expect(completions[0].description.length).toBeGreaterThan 0

          editor.setText """
            canvas,ca {
            }
          """
          editor.setCursorBufferPosition([0, 9])
          completions = getCompletions()
          expect(completions.length).toBeGreaterThan 7 # #398
          expect(completions[0].text).toBe 'canvas'

          editor.setText """
            canvas ca {
            }
          """
          editor.setCursorBufferPosition([0, 9])
          completions = getCompletions()
          expect(completions.length).toBeGreaterThan 7 # #398
          expect(completions[0].text).toBe 'canvas'

          editor.setText """
            canvas, ca {
            }
          """
          editor.setCursorBufferPosition([0, 10])
          completions = getCompletions()
          expect(completions.length).toBeGreaterThan 7 # #398
          expect(completions[0].text).toBe 'canvas'

        it "does not autocompletes when prefix is preceded by class or id char", ->
          editor.setText """
            .ca {
            }
          """
          editor.setCursorBufferPosition([0, 3])
          completions = getCompletions()
          expect(completions).toBe null

          editor.setText """
            #ca {
            }
          """
          editor.setCursorBufferPosition([0, 3])
          completions = getCompletions()
          expect(completions).toBe null

      describe "pseudo selectors", ->
        it "autocompletes without a prefix", ->
          editor.setText """
            div: {
            }
          """
          editor.setCursorBufferPosition([0, 4])
          completions = getCompletions()
          expect(completions.length).toBe 43
          for completion in completions
            text = (completion.text or completion.snippet)
            expect(text.length).toBeGreaterThan 0
            expect(completion.type).toBe 'pseudo-selector'

        # TODO: Enable these tests when we can enable autocomplete and test the
        # entire path.
        xit "autocompletes with a prefix", ->
          editor.setText """
            div:f {
            }
          """
          editor.setCursorBufferPosition([0, 5])
          completions = getCompletions()
          expect(completions.length).toBeGreaterThan 5 # #398
          expect(completions[0].text).toBe ':first'
          expect(completions[0].type).toBe 'pseudo-selector'
          expect(completions[0].description.length).toBeGreaterThan 0
          expect(completions[0].descriptionMoreURL.length).toBeGreaterThan 0

        xit "autocompletes with arguments", ->
          editor.setText """
            div:nth {
            }
          """
          editor.setCursorBufferPosition([0, 7])
          completions = getCompletions()
          expect(completions.length).toBeGreaterThan 4 # #398
          expect(completions[0].snippet).toBe ':nth-child(${1:an+b})'
          expect(completions[0].type).toBe 'pseudo-selector'
          expect(completions[0].description.length).toBeGreaterThan 0
          expect(completions[0].descriptionMoreURL.length).toBeGreaterThan 0

        xit "autocompletes when nothing precedes the colon", ->
          editor.setText """
            :f {
            }
          """
          editor.setCursorBufferPosition([0, 2])
          completions = getCompletions()
          expect(completions.length).toBe 5
          expect(completions[0].text).toBe ':first'

  Object.keys(packagesToTest).forEach (packageLabel) ->
    unless packagesToTest[packageLabel].name is 'language-css'
      describe "#{packageLabel} files", ->
        beforeEach ->
          waitsForPromise -> atom.packages.activatePackage(packagesToTest[packageLabel].name)
          waitsForPromise -> atom.workspace.open(packagesToTest[packageLabel].file)
          runs -> editor = atom.workspace.getActiveTextEditor()

        it "autocompletes tags and properties when nesting inside the property list", ->
          editor.setText """
            .ca {
              di
            }
          """
          editor.setCursorBufferPosition([1, 4])
          completions = getCompletions()
          expect(isValueInCompletions('display: ', completions)).toBe true
          expect(isValueInCompletions('direction: ', completions)).toBe true
          expect(isValueInCompletions('div', completions)).toBe true

        # FIXME: This is an issue with the grammar. It thinks nested
        # pseudo-selectors are meta.property-value.scss/less
        xit "autocompletes pseudo selectors when nested in LESS and SCSS files", ->
          editor.setText """
            .some-class {
              .a:f
            }
          """
          editor.setCursorBufferPosition([1, 6])
          completions = getCompletions()
          expect(completions.length).toBe 5
          expect(completions[0].text).toBe ':first'

        it "does not show property names when in a class selector", ->
          editor.setText """
            body {
              .a
            }
          """
          editor.setCursorBufferPosition([1, 4])
          completions = getCompletions()
          expect(completions).toBe null

        it "does not show property names when in an id selector", ->
          editor.setText """
            body {
              #a
            }
          """
          editor.setCursorBufferPosition([1, 4])
          completions = getCompletions()
          expect(completions).toBe null

        it "does not show property names when in a parent selector", ->
          editor.setText """
            body {
              &
            }
          """
          editor.setCursorBufferPosition([1, 4])
          completions = getCompletions()
          expect(completions).toBe null

        it "does not show property names when in a parent selector with a prefix", ->
          editor.setText """
            body {
              &a
            }
          """
          editor.setCursorBufferPosition([1, 4])
          completions = getCompletions()
          expect(completions).toBe null

  describe "SASS files", ->
    beforeEach ->
      waitsForPromise -> atom.packages.activatePackage('language-sass')
      waitsForPromise -> atom.workspace.open('test.sass')
      runs -> editor = atom.workspace.getActiveTextEditor()

    it "autocompletes property names with a prefix", ->
      editor.setText """
        body
          d
      """
      editor.setCursorBufferPosition([1, 3])
      completions = getCompletions()
      expect(isValueInCompletions('display: ', completions)).toBe true
      expect(isValueInCompletions('direction: ', completions)).toBe true

      expect(completions[0].type).toBe 'property'
      expect(completions[0].replacementPrefix).toBe 'd'
      expect(completions[0].description.length).toBeGreaterThan 0
      expect(completions[0].descriptionMoreURL.length).toBeGreaterThan 0

      expect(completions[1].type).toBe 'property'
      expect(completions[1].replacementPrefix).toBe 'd'

      editor.setText """
        body
          D
      """
      editor.setCursorBufferPosition([1, 3])
      completions = getCompletions()
      expect(completions.length).toBeGreaterThan 11 # #398
      expect(isValueInCompletions('display: ', completions)).toBe true
      expect(isValueInCompletions('direction: ', completions)).toBe true

      expect(completions[1].replacementPrefix).toBe 'D'

      editor.setText """
        body
          d:
      """
      editor.setCursorBufferPosition([1, 3])
      completions = getCompletions()
      expect(isValueInCompletions('display: ', completions)).toBe true
      expect(isValueInCompletions('direction: ', completions)).toBe true

      editor.setText """
        body
          bord
      """
      editor.setCursorBufferPosition([1, 6])
      completions = getCompletions()
      expect(isValueInCompletions('border: ', completions)).toBe true

      expect(completions[0].replacementPrefix).toBe 'bord'

    it "triggers autocomplete when an property name has been inserted", ->
      spyOn(atom.commands, 'dispatch')
      suggestion = {type: 'property', text: 'whatever'}
      provider.onDidInsertSuggestion({editor, suggestion})

      advanceClock 1
      expect(atom.commands.dispatch).toHaveBeenCalled()

      args = atom.commands.dispatch.mostRecentCall.args
      expect(args[0].tagName.toLowerCase()).toBe 'atom-text-editor'
      expect(args[1]).toBe 'autocomplete-plus:activate'

    it "autocompletes property values without a prefix", ->
      editor.setText """
        body
          display:
      """
      editor.setCursorBufferPosition([1, 10])
      completions = getCompletions()
      expect(completions.length).toBeGreaterThan 24  # #398
      for completion in completions
        expect(completion.text.length).toBeGreaterThan 0
        expect(completion.description.length).toBeGreaterThan 0
        expect(completion.descriptionMoreURL.length).toBeGreaterThan 0

      editor.setText """
        body
          display:
      """
      editor.setCursorBufferPosition([2, 0])
      completions = getCompletions()
      expect(completions.length).toBeGreaterThan 24  # #398
      for completion in completions
        expect(completion.text.length).toBeGreaterThan 0

    it "autocompletes property values with a prefix", ->
      editor.setText """
        body
          display: i
      """
      editor.setCursorBufferPosition([1, 12])
      completions = getCompletions()

      expect(isValueInCompletions('inline', completions)).toBe true
      expect(isValueInCompletions('inline-block', completions)).toBe true
      expect(isValueInCompletions('inline-flex', completions)).toBe true
      expect(isValueInCompletions('inline-grid', completions)).toBe true
      expect(isValueInCompletions('inline-table', completions)).toBe true
      expect(isValueInCompletions('inherit', completions)).toBe true

      expect(completions[0].description.length).toBeGreaterThan 0
      expect(completions[0].descriptionMoreURL.length).toBeGreaterThan 0

      editor.setText """
        body
          display: I
      """
      editor.setCursorBufferPosition([1, 12])
      completions = getCompletions()
      expect(completions.length).toBeGreaterThan 6 # #398

      expect(isValueInCompletions('inline', completions)).toBe true
      expect(isValueInCompletions('inline-block', completions)).toBe true
      expect(isValueInCompletions('inline-flex', completions)).toBe true
      expect(isValueInCompletions('inline-grid', completions)).toBe true
      expect(isValueInCompletions('inline-table', completions)).toBe true
      expect(isValueInCompletions('inherit', completions)).toBe true

    it "autocompletes !important in property-value scope", ->
      editor.setText """
        body
          display: inherit !im
      """
      editor.setCursorBufferPosition([1, 22])
      completions = getCompletions()

      important = null
      for c in completions
        important = c if c.displayText is '!important'

      expect(important.displayText).toBe '!important'

    it "does not autocomplete when indented and prefix is not a char", ->
      editor.setText """
        body
          .
      """
      editor.setCursorBufferPosition([1, 3])
      completions = getCompletions(activatedManually: false)
      expect(completions).toBe null

      editor.setText """
        body
          #
      """
      editor.setCursorBufferPosition([1, 3])
      completions = getCompletions(activatedManually: false)
      expect(completions).toBe null

      editor.setText """
        body
          .foo,
      """
      editor.setCursorBufferPosition([1, 7])
      completions = getCompletions(activatedManually: false)
      expect(completions).toBe null

      editor.setText """
        body
          foo -
      """
      editor.setCursorBufferPosition([1, 8])
      completions = getCompletions(activatedManually: false)
      expect(completions).toBe null

      # As spaces at end of line will be removed, we'll test with a char
      # after the space and with the cursor before that char.
      editor.setCursorBufferPosition([1, 7])
      completions = getCompletions(activatedManually: false)
      expect(completions).toBe null

    it 'does not autocomplete when inside a nth-child selector', ->
      editor.setText """
        body
          &:nth-child(4
      """
      editor.setCursorBufferPosition([1, 15])
      completions = getCompletions(activatedManually: false)
      expect(completions).toBe null

    it 'autocompletes a property name with a dash', ->
      editor.setText """
        body
          border-
      """
      editor.setCursorBufferPosition([1, 9])
      completions = getCompletions(activatedManually: false)
      expect(completions).not.toBe null

      expect(isValueInCompletions('border: ', completions)).toBe true
      expect(isValueInCompletions('border-radius: ', completions)).toBe true

      expect(completions[0].replacementPrefix).toBe 'border-'

      expect(completions[1].replacementPrefix).toBe 'border-'

    it "does not autocomplete !important in property-name scope", ->
      editor.setText """
        body {
          !im
        }
      """
      editor.setCursorBufferPosition([1, 5])
      completions = getCompletions()

      important = null
      for c in completions
        important = c if c.displayText is '!important'

      expect(important).toBe null

    describe "tags", ->
      it "autocompletes with a prefix", ->
        editor.setText """
          ca
        """
        editor.setCursorBufferPosition([0, 2])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 7 # #398
        expect(isValueInCompletions('canvas', completions)).toBe true
        expect(isValueInCompletions('code', completions)).toBe true

        expect(completions[0].type).toBe 'tag'
        expect(completions[0].description.length).toBeGreaterThan 0

        editor.setText """
          canvas,ca
        """
        editor.setCursorBufferPosition([0, 9])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 7 # #398
        expect(completions[0].text).toBe 'canvas'

        editor.setText """
          canvas ca
        """
        editor.setCursorBufferPosition([0, 9])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 7 # #398
        expect(completions[0].text).toBe 'canvas'

        editor.setText """
          canvas, ca
        """
        editor.setCursorBufferPosition([0, 10])
        completions = getCompletions()
        expect(completions.length).toBeGreaterThan 7 # #398
        expect(completions[0].text).toBe 'canvas'

      it "does not autocomplete when prefix is preceded by class or id char", ->
        editor.setText """
          .ca
        """
        editor.setCursorBufferPosition([0, 3])
        completions = getCompletions()
        expect(completions).toBe null

        editor.setText """
          #ca
        """
        editor.setCursorBufferPosition([0, 3])
        completions = getCompletions()
        expect(completions).toBe null

    describe "pseudo selectors", ->
      it "autocompletes without a prefix", ->
        editor.setText """
          div:
        """
        editor.setCursorBufferPosition([0, 4])
        completions = getCompletions()
        expect(completions.length).toBe 43
        for completion in completions
          text = (completion.text or completion.snippet)
          expect(text.length).toBeGreaterThan 0
          expect(completion.type).toBe 'pseudo-selector'
