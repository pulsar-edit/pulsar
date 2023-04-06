const TagFinder = require('../lib/tag-finder')
const tagFinder = new TagFinder()

describe('closeTag', () => {
  describe('TagFinder::parseFragment', () => {
    let fragment = ''

    beforeEach(() => fragment = '<html><head><body></body>')

    it('returns the last not closed elem in fragment, matching a given pattern', () => {
      const stack = tagFinder.parseFragment(fragment, [], /<(\w+)|<\/(\w*)/, () => true)
      expect(stack[stack.length - 1]).toBe('head')
    })

    it('stops when cond become true', () => {
      const stack = tagFinder.parseFragment(fragment, [], /<(\w+)|<\/(\w*)/, () => false)
      expect(stack.length).toBe(0)
    })

    it('uses the given match expression to match tags', () => {
      const stack = tagFinder.parseFragment(fragment, [], /<(body)|(notag)/, () => true)
      expect(stack[stack.length - 1]).toBe('body')
    })
  })

  describe('TagFinder::tagsNotClosedInFragment', () => {
    it('returns the outermost tag not closed in an HTML fragment', () => {
      const fragment = '<html><head></head><body><h1><p></p>'
      const tags = tagFinder.tagsNotClosedInFragment(fragment)
      expect(tags).toEqual(['html', 'body', 'h1'])
    })

    it('is not confused by tag attributes', () => {
      const fragment = '<html><head></head><body class="c"><h1 class="p"><p></p>'
      const tags = tagFinder.tagsNotClosedInFragment(fragment)
      expect(tags).toEqual(['html', 'body', 'h1'])
    })

    it('is not confused by namespace prefixes', () => {
      const fragment = '<xhtml:html><xhtml:body><xhtml:h1>'
      const tags = tagFinder.tagsNotClosedInFragment(fragment)
      expect(tags).toEqual(['xhtml:html', 'xhtml:body', 'xhtml:h1'])
    })
  })

  describe('TagFinder::tagDoesNotCloseInFragment', () => {
    it('returns true if the given tag is not closed in the given fragment', () => {
      const fragment = '</other1></other2></html>'
      expect(tagFinder.tagDoesNotCloseInFragment('body', fragment)).toBe(true)
    })

    it('returns false if the given tag is closed in the given fragment', () => {
      const fragment = '</other1></body></html>'
      expect(tagFinder.tagDoesNotCloseInFragment(['body'], fragment)).toBe(false)
    })

    it('returns true even if the given tag is re-opened and re-closed', () => {
      const fragment = '<other> </other><body></body><html>'
      expect(tagFinder.tagDoesNotCloseInFragment(['body'], fragment)).toBe(true)
    })

    it('returns false even if the given tag is re-opened and re-closed before closing', () => {
      const fragment = '<other> </other><body></body></body><html>'
      expect(tagFinder.tagDoesNotCloseInFragment(['body'], fragment)).toBe(false)
    })
  })

  describe('TagFinder::closingTagForFragments', () => {
    it('returns the last opened in preFragment tag that is not closed in postFragment', () => {
      const preFragment = '<html><head></head><body><h1></h1><p>'
      const postFragment = '</body></html>'
      expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('p')
    })

    it('correctly handles empty postFragment', () => {
      const preFragment = '<html><head></head><body><h1></h1><p>'
      const postFragment = ''
      expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('p')
    })

    it('correctly handles malformed tags', () => {
      const preFragment = '<html><head></head></htm'
      const postFragment = ''
      expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('html')
    })

    it('returns null if there is no open tag to be closed', () => {
      const preFragment = '<html><head></head><body><h1></h1><p>'
      const postFragment = '</p></body></html>'
      expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe(null)
    })

    it('correctly closes tags containing hyphens', () => {
      const preFragment = '<html><head></head><body><h1></h1><my-element>'
      const postFragment = '</body></html>'
      expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('my-element')
    })

    it('correctly closes tags containing attributes', () => {
      const preFragment = '<html><head></head><body class="foo bar"><div>'
      const postFragment = '</body></html>'
      expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('div')
    })

    it('correctly closes tags containing an XML namespace', () => {
      const preFragment = '<html><head></head><body><custom:tag>'
      const postFragment = '</body></html>'
      expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('custom:tag')
    })

    it('correctly closes tags containing multiple XML namespaces', () => {
      // This is not exactly valid syntax but it can't hurt to support it
      const preFragment = '<html><head></head><body><custom:custom2:tag>'
      const postFragment = '</body></html>'
      expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('custom:custom2:tag')
    })

    it('correctly closes tags in the present of JSX tags containing member accesses', () => {
        const preFragment = '<Foo><Bar.Baz></Bar.Baz>'
        const postFragment = ''
        expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('Foo')
    })

    it('correctly closes JSX tags containing member accesses', () => {
        const preFragment = '<Foo.Bar><div></div>'
        const postFragment = ''
        expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('Foo.Bar')
    })

    it('correctly closes JSX tags containing deep member accesses', () => {
        const preFragment = '<Foo.Bar.Baz><div></div>'
        const postFragment = ''
        expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('Foo.Bar.Baz')
    })

    it('correctly closes tags when there are other tags with the same prefix', () => {
      const preFragment = '<thead><th>'
      const postFragment = '</thead>'
      expect(tagFinder.closingTagForFragments(preFragment, postFragment)).toBe('th')
    })
  })
})
