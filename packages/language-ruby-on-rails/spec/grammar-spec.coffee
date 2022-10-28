describe "Ruby on Rails package", ->
  beforeEach ->
    waitsForPromise ->
      core.packages.activatePackage("language-ruby-on-rails")

  it "parses the HTML grammar", ->
    grammar = core.grammars.grammarForScopeName("text.html.ruby")
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "text.html.ruby"

  it "parses the JavaScript grammar", ->
    grammar = core.grammars.grammarForScopeName("source.js.rails source.js.jquery")
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.js.rails source.js.jquery"

  it "parses the RJS grammar", ->
    grammar = core.grammars.grammarForScopeName("source.ruby.rails.rjs")
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.ruby.rails.rjs"

  it "parses the Rails grammar", ->
    grammar = core.grammars.grammarForScopeName("source.ruby.rails")
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.ruby.rails"

  it "parses the SQL grammar", ->
    grammar = core.grammars.grammarForScopeName("source.sql.ruby")
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.sql.ruby"
