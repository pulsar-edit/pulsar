{getSettingDescription} = require '../lib/rich-description'

describe "Rich descriptions", ->
  beforeEach ->
    config =
      type: 'object'
      properties:
        plainText:
          description: 'Plain text description'
          type: 'string'
          default: ''
        italics:
          description: 'Description *with* italics'
          type: 'string'
          default: ''
        bold:
          description: 'Description **with** bold'
          type: 'string'
          default: ''
        link:
          description: 'Description [with](http://www.example.com) link'
          type: 'string'
          default: ''
        inlineCode:
          description: 'Description `with` inline code'
          type: 'string'
          default: ''
        lineBreak:
          description: 'Description with<br/> line break'
          type: 'string'
          default: ''
        strikethrough:
          description: 'Description ~~with~~ strikethrough'
          type: 'string'
          default: ''
        image:
          description: 'Description without ![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1") image'
          type: 'string'
          default: ''
        fencedBlockCode:
          description: '''Description without fenced block code
          ```
          Test
          ```
          '''
          type: 'string'
          default: ''
        indentedBlockCode:
          description: '''
          Description without indented block code

              Test
          '''
          type: 'string'
          default: ''
        blockquote:
          description: '''
          Description without blockquote

          > Test
          '''
          type: 'string'
          default: ''
        html:
          description: '''
          Description without html

          <html>Test</html>
          '''
          type: 'string'
          default: ''
        heading:
          description: '''
          Description without heading

          ## Test
          '''
          type: 'string'
          default: ''
        orderedList:
          description: '''
          Description without ordered list

          1. Test
          2. Test
          3. Test
          '''
          type: 'string'
          default: ''
        unorderedList:
          description: '''
          Description without unordered list

          * Test
          * Test
          * Test
          '''
          type: 'string'
          default: ''
        table:
          description: '''
          Description without table

          <table><tr><td>Test</td></tr></table>
          '''
          type: 'string'
          default: ''

    atom.config.setSchema("foo", config)

  describe 'supported Markdown', ->
    it 'handles plain text', ->
      expect(getSettingDescription('foo.plainText')).toEqual 'Plain text description'

    it 'handles italics', ->
      expect(getSettingDescription('foo.italics')).toEqual 'Description <em>with</em> italics'

    it 'handles bold', ->
      expect(getSettingDescription('foo.bold')).toEqual 'Description <strong>with</strong> bold'

    it 'handles links', ->
      expect(getSettingDescription('foo.link')).toEqual 'Description <a href="http://www.example.com">with</a> link'

    it 'handles inline code', ->
      expect(getSettingDescription('foo.inlineCode')).toEqual 'Description <code>with</code> inline code'

    it 'handles line breaks', ->
      expect(getSettingDescription('foo.lineBreak')).toEqual 'Description with<br/> line break'

    it 'handles strikethrough', ->
      expect(getSettingDescription('foo.strikethrough')).toEqual 'Description <del>with</del> strikethrough'

  describe 'unsupported Markdown', ->
    it 'strips images', ->
      expect(getSettingDescription('foo.image')).toEqual 'Description without  image'

    it 'strips fenced code blocks', ->
      expect(getSettingDescription('foo.fencedBlockCode')).toEqual 'Description without fenced block code'

    it 'strips indented code blocks', ->
      expect(getSettingDescription('foo.indentedBlockCode')).toEqual 'Description without indented block code'

    it 'strips blockquotes', ->
      expect(getSettingDescription('foo.blockquote')).toEqual 'Description without blockquote'

    it 'strips html elements', ->
      expect(getSettingDescription('foo.html')).toEqual 'Description without html'

    it 'strips headings', ->
      expect(getSettingDescription('foo.heading')).toEqual 'Description without heading'

    it 'strips ordered lists', ->
      expect(getSettingDescription('foo.orderedList')).toEqual 'Description without ordered list'

    it 'strips unordered lists', ->
      expect(getSettingDescription('foo.unorderedList')).toEqual 'Description without unordered list'

    it 'strips tables', ->
      expect(getSettingDescription('foo.table')).toEqual 'Description without table'
