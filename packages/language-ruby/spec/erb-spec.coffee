describe "TextMate HTML (Ruby - ERB) grammar", ->
  grammar = null

  beforeEach ->
    atom.config.set('core.useTreeSitterParsers', false)

    waitsForPromise ->
      atom.packages.activatePackage("language-ruby")

    runs ->
      grammar = atom.grammars.grammarForScopeName("text.html.erb")

  it "parses the grammar", ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe "text.html.erb"

  it "tokenizes embedded ruby", ->
    {tokens} = grammar.tokenizeLine('<%= self %>')
    expect(tokens[0]).toEqual value: '<%=', scopes: ['text.html.erb', 'meta.embedded.line.erb', 'punctuation.section.embedded.begin.erb']
    expect(tokens[1]).toEqual value: ' ', scopes: ['text.html.erb', 'meta.embedded.line.erb', 'source.ruby.embedded.erb']
    expect(tokens[2]).toEqual value: 'self', scopes: ['text.html.erb', 'meta.embedded.line.erb', 'source.ruby.embedded.erb', 'variable.language.self.ruby']
    expect(tokens[3]).toEqual value: ' ', scopes: ['text.html.erb', 'meta.embedded.line.erb', 'source.ruby.embedded.erb']
    expect(tokens[4]).toEqual value: '%>', scopes: ['text.html.erb', 'meta.embedded.line.erb', 'punctuation.section.embedded.end.erb']

    lines = grammar.tokenizeLines('<%=\nself\n%>')
    expect(lines[0][0]).toEqual value: '<%=', scopes: ['text.html.erb', 'meta.embedded.block.erb', 'punctuation.section.embedded.begin.erb']
    expect(lines[1][0]).toEqual value: 'self', scopes: ['text.html.erb', 'meta.embedded.block.erb', 'source.ruby.embedded.erb', 'variable.language.self.ruby']
    expect(lines[2][0]).toEqual value: '%>', scopes: ['text.html.erb', 'meta.embedded.block.erb', 'punctuation.section.embedded.end.erb']
