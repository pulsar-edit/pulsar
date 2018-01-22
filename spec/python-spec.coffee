describe "Python grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-python")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.python")

  it "recognises shebang on firstline", ->
    expect(grammar.firstLineRegex.scanner.findNextMatchSync("#!/usr/bin/env python")).not.toBeNull()
    expect(grammar.firstLineRegex.scanner.findNextMatchSync("#! /usr/bin/env python")).not.toBeNull()

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.python"

  it "tokenizes `yield`", ->
    {tokens} = grammar.tokenizeLine 'yield v'

    expect(tokens[0]).toEqual value: 'yield', scopes: ['source.python', 'keyword.control.statement.python']

  it "tokenizes `yield from`", ->
    {tokens} = grammar.tokenizeLine 'yield from v'

    expect(tokens[0]).toEqual value: 'yield from', scopes: ['source.python', 'keyword.control.statement.python']

  it "tokenizes multi-line strings", ->
    tokens = grammar.tokenizeLines('"1\\\n2"')

    # Line 0
    expect(tokens[0][0].value).toBe '"'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']

    expect(tokens[0][1].value).toBe '1'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python']

    expect(tokens[0][2].value).toBe '\\'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.newline.python']

    expect(tokens[0][3]).not.toBeDefined()

    # Line 1
    expect(tokens[1][0].value).toBe '2'
    expect(tokens[1][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python']

    expect(tokens[1][1].value).toBe '"'
    expect(tokens[1][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

    expect(tokens[1][2]).not.toBeDefined()

  it "terminates a single-quoted raw string containing opening parenthesis at closing quote", ->
    tokens = grammar.tokenizeLines("r'%d(' #foo")

    expect(tokens[0][0].value).toBe 'r'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe "'"
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '('
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']
    expect(tokens[0][4].value).toBe "'"
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a single-quoted raw string containing opening bracket at closing quote", ->
    tokens = grammar.tokenizeLines("r'%d[' #foo")

    expect(tokens[0][0].value).toBe 'r'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe "'"
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '['
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.begin.regexp']
    expect(tokens[0][4].value).toBe "'"
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a double-quoted raw string containing opening parenthesis at closing quote", ->
    tokens = grammar.tokenizeLines('r"%d(" #foo')

    expect(tokens[0][0].value).toBe 'r'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe '"'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '('
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']
    expect(tokens[0][4].value).toBe '"'
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a double-quoted raw string containing opening bracket at closing quote", ->
    tokens = grammar.tokenizeLines('r"%d[" #foo')

    expect(tokens[0][0].value).toBe 'r'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe '"'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '['
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.begin.regexp']
    expect(tokens[0][4].value).toBe '"'
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a unicode single-quoted raw string containing opening parenthesis at closing quote", ->
    tokens = grammar.tokenizeLines("ur'%d(' #foo")

    expect(tokens[0][0].value).toBe 'ur'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe "'"
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '('
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']
    expect(tokens[0][4].value).toBe "'"
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a unicode single-quoted raw string containing opening bracket at closing quote", ->
    tokens = grammar.tokenizeLines("ur'%d[' #foo")

    expect(tokens[0][0].value).toBe 'ur'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe "'"
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '['
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.begin.regexp']
    expect(tokens[0][4].value).toBe "'"
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a unicode double-quoted raw string containing opening parenthesis at closing quote", ->
    tokens = grammar.tokenizeLines('ur"%d(" #foo')

    expect(tokens[0][0].value).toBe 'ur'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe '"'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '('
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']
    expect(tokens[0][4].value).toBe '"'
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a unicode double-quoted raw string containing opening bracket at closing quote", ->
    tokens = grammar.tokenizeLines('ur"%d[" #foo')

    expect(tokens[0][0].value).toBe 'ur'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe '"'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '['
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.begin.regexp']
    expect(tokens[0][4].value).toBe '"'
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates referencing an item in a list variable after a sequence of a closing and opening bracket", ->
    tokens = grammar.tokenizeLines('foo[i[0]][j[0]]')

    expect(tokens[0][0].value).toBe 'foo'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'meta.item-access.python']
    expect(tokens[0][1].value).toBe '['
    expect(tokens[0][1].scopes).toEqual ['source.python', 'meta.item-access.python', 'punctuation.definition.arguments.begin.python']
    expect(tokens[0][2].value).toBe 'i'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python']
    expect(tokens[0][3].value).toBe '['
    expect(tokens[0][3].scopes).toEqual ['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python', 'punctuation.definition.arguments.begin.python']
    expect(tokens[0][4].value).toBe '0'
    expect(tokens[0][4].scopes).toEqual ['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'constant.numeric.integer.decimal.python']
    expect(tokens[0][5].value).toBe ']'
    expect(tokens[0][5].scopes).toEqual ['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python', 'punctuation.definition.arguments.end.python']
    expect(tokens[0][6].value).toBe ']'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'meta.item-access.python', 'punctuation.definition.arguments.end.python']
    expect(tokens[0][7].value).toBe '['
    expect(tokens[0][7].scopes).toEqual ['source.python', 'meta.structure.list.python', 'punctuation.definition.list.begin.python']
    expect(tokens[0][8].value).toBe 'j'
    expect(tokens[0][8].scopes).toEqual ['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python']
    expect(tokens[0][9].value).toBe '['
    expect(tokens[0][9].scopes).toEqual ['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python', 'punctuation.definition.arguments.begin.python']
    expect(tokens[0][10].value).toBe '0'
    expect(tokens[0][10].scopes).toEqual ['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'constant.numeric.integer.decimal.python']
    expect(tokens[0][11].value).toBe ']'
    expect(tokens[0][11].scopes).toEqual ['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python', 'punctuation.definition.arguments.end.python']
    expect(tokens[0][12].value).toBe ']'
    expect(tokens[0][12].scopes).toEqual ['source.python', 'meta.structure.list.python', 'punctuation.definition.list.end.python']

  it "tokenizes a hex escape inside a string", ->
    tokens = grammar.tokenizeLines('"\\x5A"')

    expect(tokens[0][0].value).toBe '"'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][1].value).toBe '\\x5A'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.hex.python']

    tokens = grammar.tokenizeLines('"\\x9f"')

    expect(tokens[0][0].value).toBe '"'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][1].value).toBe '\\x9f'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.hex.python']

  describe "f-strings", ->
    types =
      'f': 'format'
      'F': 'format'
      'rf': 'raw-format'
      'rF': 'raw-format'
      'Rf': 'raw-format'
      'RF': 'raw-format'

    quotes =
      '"': 'double.single-line'
      "'": 'single.single-line'
      '"""': 'double.block'
      "'''": 'single.block'

    for type, typeScope of types
      for quote, quoteScope of quotes
        it "tokenizes them", ->
          {tokens} = grammar.tokenizeLine "#{type}#{quote}hello#{quote}"

          expect(tokens[0]).toEqual value: type, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'storage.type.string.python']
          expect(tokens[1]).toEqual value: quote, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'punctuation.definition.string.begin.python']
          expect(tokens[2]).toEqual value: 'hello', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python"]
          expect(tokens[3]).toEqual value: quote, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'punctuation.definition.string.end.python']

        it "tokenizes {{ and }} as escape characters", ->
          {tokens} = grammar.tokenizeLine "#{type}#{quote}he}}l{{lo#{quote}"

          expect(tokens[0]).toEqual value: type, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'storage.type.string.python']
          expect(tokens[1]).toEqual value: quote, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'punctuation.definition.string.begin.python']
          expect(tokens[2]).toEqual value: 'he', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python"]
          expect(tokens[3]).toEqual value: '}}', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'constant.character.escape.curly-bracket.python']
          expect(tokens[4]).toEqual value: 'l', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python"]
          expect(tokens[5]).toEqual value: '{{', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'constant.character.escape.curly-bracket.python']
          expect(tokens[6]).toEqual value: 'lo', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python"]
          expect(tokens[7]).toEqual value: quote, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'punctuation.definition.string.end.python']

        it "tokenizes unmatched closing curly brackets as invalid", ->
          {tokens} = grammar.tokenizeLine "#{type}#{quote}he}llo#{quote}"

          expect(tokens[0]).toEqual value: type, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'storage.type.string.python']
          expect(tokens[1]).toEqual value: quote, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'punctuation.definition.string.begin.python']
          expect(tokens[2]).toEqual value: 'he', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python"]
          expect(tokens[3]).toEqual value: '}', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'invalid.illegal.closing-curly-bracket.python']
          expect(tokens[4]).toEqual value: 'llo', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python"]
          expect(tokens[5]).toEqual value: quote, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'punctuation.definition.string.end.python']

        describe "in expressions", ->
          it "tokenizes variables", ->
            {tokens} = grammar.tokenizeLine "#{type}#{quote}{abc}#{quote}"

            expect(tokens[2]).toEqual value: '{', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']
            expect(tokens[3]).toEqual value: 'abc', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python']
            expect(tokens[4]).toEqual value: '}', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']

          it "tokenizes arithmetic", ->
            {tokens} = grammar.tokenizeLine "#{type}#{quote}{5 - 3}#{quote}"

            expect(tokens[2]).toEqual value: '{', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']
            expect(tokens[3]).toEqual value: '5', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'constant.numeric.integer.decimal.python']
            expect(tokens[5]).toEqual value: '-', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'keyword.operator.arithmetic.python']
            expect(tokens[7]).toEqual value: '3', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'constant.numeric.integer.decimal.python']
            expect(tokens[8]).toEqual value: '}', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']

          it "tokenizes function and method calls", ->
            argumentQuote = '"'
            argumentQuoteScope = 'double'

            if quote is '"'
              argumentQuote = "'"
              argumentQuoteScope = 'single'

            {tokens} = grammar.tokenizeLine "#{type}#{quote}{name.decode(#{argumentQuote}utf-8#{argumentQuote}).lower()}#{quote}"

            expect(tokens[2]).toEqual value: '{', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']
            expect(tokens[3]).toEqual value: 'name', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python']
            expect(tokens[4]).toEqual value: '.', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python']
            expect(tokens[5]).toEqual value: 'decode', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python']
            expect(tokens[6]).toEqual value: '(', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python', 'punctuation.definition.arguments.begin.python']
            expect(tokens[7]).toEqual value: argumentQuote, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python', 'meta.function-call.arguments.python', "string.quoted.#{argumentQuoteScope}.single-line.python", 'punctuation.definition.string.begin.python']
            expect(tokens[8]).toEqual value: 'utf-8', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python', 'meta.function-call.arguments.python', "string.quoted.#{argumentQuoteScope}.single-line.python"]
            expect(tokens[9]).toEqual value: argumentQuote, scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python', 'meta.function-call.arguments.python', "string.quoted.#{argumentQuoteScope}.single-line.python", 'punctuation.definition.string.end.python']
            expect(tokens[10]).toEqual value: ')', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python', 'punctuation.definition.arguments.end.python']
            expect(tokens[11]).toEqual value: '.', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python']
            expect(tokens[12]).toEqual value: 'lower', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python']
            expect(tokens[13]).toEqual value: '(', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python', 'punctuation.definition.arguments.begin.python']
            expect(tokens[14]).toEqual value: ')', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'meta.function-call.python', 'punctuation.definition.arguments.end.python']
            expect(tokens[15]).toEqual value: '}', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']

          it "tokenizes conversion flags", ->
            {tokens} = grammar.tokenizeLine "#{type}#{quote}{abc!r}#{quote}"

            expect(tokens[2]).toEqual value: '{', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']
            expect(tokens[3]).toEqual value: 'abc', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python']
            expect(tokens[4]).toEqual value: '!r', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'constant.other.placeholder.python']
            expect(tokens[5]).toEqual value: '}', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']

          it "tokenizes format specifiers", ->
            {tokens} = grammar.tokenizeLine "#{type}#{quote}{abc:^d}#{quote}"

            expect(tokens[2]).toEqual value: '{', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']
            expect(tokens[3]).toEqual value: 'abc', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python']
            expect(tokens[4]).toEqual value: ':^d', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'constant.other.placeholder.python']
            expect(tokens[5]).toEqual value: '}', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']

          it "tokenizes nested replacement fields in top-level format specifiers", ->
            {tokens} = grammar.tokenizeLine "#{type}#{quote}{abc:{align}d}#{quote}"

            expect(tokens[2]).toEqual value: '{', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']
            expect(tokens[3]).toEqual value: 'abc', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python']
            expect(tokens[4]).toEqual value: ':', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'constant.other.placeholder.python']
            expect(tokens[5]).toEqual value: '{align}', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'constant.other.placeholder.python', 'constant.other.placeholder.python']
            expect(tokens[6]).toEqual value: 'd', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'constant.other.placeholder.python']
            expect(tokens[7]).toEqual value: '}', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']

          it "tokenizes backslashes as invalid", ->
            {tokens} = grammar.tokenizeLine "#{type}#{quote}{ab\\n}#{quote}"

            expect(tokens[2]).toEqual value: '{', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.begin.bracket.curly.python']
            expect(tokens[3]).toEqual value: 'ab', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python']
            expect(tokens[4]).toEqual value: '\\', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'meta.embedded.python', 'invalid.illegal.backslash.python']
            expect(tokens[6]).toEqual value: '}', scopes: ['source.python', "string.quoted.#{quoteScope}.#{typeScope}.python", 'meta.interpolation.python', 'punctuation.definition.interpolation.end.bracket.curly.python']

  describe "string formatting", ->
    describe "%-style formatting", ->
      it "tokenizes the conversion type", ->
        {tokens} = grammar.tokenizeLine '"%d"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '%d', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes an optional mapping key", ->
        {tokens} = grammar.tokenizeLine '"%(key)x"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '%(key)x', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes an optional conversion flag", ->
        {tokens} = grammar.tokenizeLine '"% F"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '% F', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes an optional field width", ->
        {tokens} = grammar.tokenizeLine '"%11s"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '%11s', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes * as the optional field width", ->
        {tokens} = grammar.tokenizeLine '"%*g"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '%*g', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes an optional precision", ->
        {tokens} = grammar.tokenizeLine '"%.4r"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '%.4r', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes * as the optional precision", ->
        {tokens} = grammar.tokenizeLine '"%.*%"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '%.*%', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes an optional length modifier", ->
        {tokens} = grammar.tokenizeLine '"%Lo"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '%Lo', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes complex formats", ->
        {tokens} = grammar.tokenizeLine '"%(key)#5.*hc"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '%(key)#5.*hc', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

    describe "{}-style formatting", ->
      it "tokenizes the empty replacement field", ->
        {tokens} = grammar.tokenizeLine '"{}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes a number as the field name", ->
        {tokens} = grammar.tokenizeLine '"{1}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{1}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes a variable name as the field name", ->
        {tokens} = grammar.tokenizeLine '"{key}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{key}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes field name attributes", ->
        {tokens} = grammar.tokenizeLine '"{key.length}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{key.length}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        {tokens} = grammar.tokenizeLine '"{4.width}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{4.width}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        {tokens} = grammar.tokenizeLine '"{python2[\'3\']}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{python2[\'3\']}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        {tokens} = grammar.tokenizeLine '"{2[4]}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{2[4]}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes multiple field name attributes", ->
        {tokens} = grammar.tokenizeLine '"{nested.a[2][\'val\'].value}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{nested.a[2][\'val\'].value}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes conversions", ->
        {tokens} = grammar.tokenizeLine '"{!r}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{!r}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      describe "format specifiers", ->
        it "tokenizes alignment", ->
          {tokens} = grammar.tokenizeLine '"{:<}"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{:<}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

          {tokens} = grammar.tokenizeLine '"{:a^}"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{:a^}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        it "tokenizes signs", ->
          {tokens} = grammar.tokenizeLine '"{:+}"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{:+}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

          {tokens} = grammar.tokenizeLine '"{: }"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{: }', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        it "tokenizes the alternate form indicator", ->
          {tokens} = grammar.tokenizeLine '"{:#}"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{:#}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        it "tokenizes 0", ->
          {tokens} = grammar.tokenizeLine '"{:0}"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{:0}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        it "tokenizes the width", ->
          {tokens} = grammar.tokenizeLine '"{:34}"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{:34}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        it "tokenizes the grouping option", ->
          {tokens} = grammar.tokenizeLine '"{:,}"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{:,}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        it "tokenizes the precision", ->
          {tokens} = grammar.tokenizeLine '"{:.5}"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{:.5}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        it "tokenizes the type", ->
          {tokens} = grammar.tokenizeLine '"{:b}"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{:b}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

        it "tokenizes nested replacement fields", ->
          {tokens} = grammar.tokenizeLine '"{:{align}-.{precision}%}"'

          expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
          expect(tokens[1]).toEqual value: '{:', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[2]).toEqual value: '{align}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python', 'constant.other.placeholder.python']
          expect(tokens[3]).toEqual value: '-.', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[4]).toEqual value: '{precision}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python', 'constant.other.placeholder.python']
          expect(tokens[5]).toEqual value: '%}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
          expect(tokens[6]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes complex formats", ->
        {tokens} = grammar.tokenizeLine '"{0.players[2]!a:2>-#01_.3d}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{0.players[2]!a:2>-#01_.3d}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.other.placeholder.python']
        expect(tokens[2]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

      it "tokenizes {{ and }} as escape characters and not formatters", ->
        {tokens} = grammar.tokenizeLine '"{{hello}}"'

        expect(tokens[0]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']
        expect(tokens[1]).toEqual value: '{{', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.curly-bracket.python']
        expect(tokens[2]).toEqual value: 'hello', scopes: ['source.python', 'string.quoted.double.single-line.python']
        expect(tokens[3]).toEqual value: '}}', scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.curly-bracket.python']
        expect(tokens[4]).toEqual value: '"', scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

  it "tokenizes properties of self as self-type variables", ->
    tokens = grammar.tokenizeLines('self.foo')

    expect(tokens[0][0].value).toBe 'self'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'variable.language.self.python']
    expect(tokens[0][1].value).toBe '.'
    expect(tokens[0][1].scopes).toEqual ['source.python']
    expect(tokens[0][2].value).toBe 'foo'
    expect(tokens[0][2].scopes).toEqual ['source.python']

  it "tokenizes cls as a self-type variable", ->
    tokens = grammar.tokenizeLines('cls.foo')

    expect(tokens[0][0].value).toBe 'cls'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'variable.language.self.python']
    expect(tokens[0][1].value).toBe '.'
    expect(tokens[0][1].scopes).toEqual ['source.python']
    expect(tokens[0][2].value).toBe 'foo'
    expect(tokens[0][2].scopes).toEqual ['source.python']

  it "tokenizes properties of a variable as variables", ->
    tokens = grammar.tokenizeLines('bar.foo')

    expect(tokens[0][0].value).toBe 'bar'
    expect(tokens[0][0].scopes).toEqual ['source.python']
    expect(tokens[0][1].value).toBe '.'
    expect(tokens[0][1].scopes).toEqual ['source.python']
    expect(tokens[0][2].value).toBe 'foo'
    expect(tokens[0][2].scopes).toEqual ['source.python']

  it "tokenizes comments inside function parameters", ->
    {tokens} = grammar.tokenizeLine('def test(arg, # comment')

    expect(tokens[0]).toEqual value: 'def', scopes: ['source.python', 'meta.function.python', 'storage.type.function.python']
    expect(tokens[2]).toEqual value: 'test', scopes: ['source.python', 'meta.function.python', 'entity.name.function.python']
    expect(tokens[3]).toEqual value: '(', scopes: ['source.python', 'meta.function.python', 'punctuation.definition.parameters.begin.python']
    expect(tokens[4]).toEqual value: 'arg', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'variable.parameter.function.python']
    expect(tokens[5]).toEqual value: ',', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'punctuation.separator.parameters.python']
    expect(tokens[7]).toEqual value: '#', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[8]).toEqual value: ' comment', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'comment.line.number-sign.python']

    tokens = grammar.tokenizeLines("""
      def __init__(
        self,
        codec, # comment
        config
      ):
    """)

    expect(tokens[0][0]).toEqual value: 'def', scopes: ['source.python', 'meta.function.python', 'storage.type.function.python']
    expect(tokens[0][2]).toEqual value: '__init__', scopes: ['source.python', 'meta.function.python', 'entity.name.function.python', 'support.function.magic.python']
    expect(tokens[0][3]).toEqual value: '(', scopes: ['source.python', 'meta.function.python', 'punctuation.definition.parameters.begin.python']
    expect(tokens[1][1]).toEqual value: 'self', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'variable.parameter.function.python']
    expect(tokens[1][2]).toEqual value: ',', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'punctuation.separator.parameters.python']
    expect(tokens[2][1]).toEqual value: 'codec', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'variable.parameter.function.python']
    expect(tokens[2][2]).toEqual value: ',', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'punctuation.separator.parameters.python']
    expect(tokens[2][4]).toEqual value: '#', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[2][5]).toEqual value: ' comment', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'comment.line.number-sign.python']
    expect(tokens[3][1]).toEqual value: 'config', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'variable.parameter.function.python']
    expect(tokens[4][0]).toEqual value: ')', scopes: ['source.python', 'meta.function.python', 'punctuation.definition.parameters.end.python']
    expect(tokens[4][1]).toEqual value: ':', scopes: ['source.python', 'meta.function.python', 'punctuation.section.function.begin.python']

  it "tokenizes complex function calls", ->
    {tokens} = grammar.tokenizeLine "torch.nn.BCELoss()(Variable(bayes_optimal_prob, 1, requires_grad=False), Yvar).data[0]"

    expect(tokens[4]).toEqual value: 'BCELoss', scopes: ['source.python', 'meta.function-call.python']
    expect(tokens[5]).toEqual value: '(', scopes: ['source.python', 'meta.function-call.python', 'punctuation.definition.arguments.begin.python']
    expect(tokens[6]).toEqual value: ')', scopes: ['source.python', 'meta.function-call.python', 'punctuation.definition.arguments.end.python']
    expect(tokens[7]).toEqual value: '(', scopes: ['source.python', 'meta.function-call.python', 'punctuation.definition.arguments.begin.python']
    expect(tokens[8]).toEqual value: 'Variable', scopes: ['source.python', 'meta.function-call.python', 'meta.function-call.arguments.python', 'meta.function-call.python']
    expect(tokens[9]).toEqual value: '(', scopes: ['source.python', 'meta.function-call.python', 'meta.function-call.arguments.python', 'meta.function-call.python', 'punctuation.definition.arguments.begin.python']
    expect(tokens[10]).toEqual value: 'bayes_optimal_prob', scopes: ['source.python', 'meta.function-call.python', 'meta.function-call.arguments.python', 'meta.function-call.python', 'meta.function-call.arguments.python']
    expect(tokens[14]).toEqual value: 'requires_grad', scopes: ['source.python', 'meta.function-call.python', 'meta.function-call.arguments.python', 'meta.function-call.python', 'meta.function-call.arguments.python', 'variable.parameter.function.python']
    expect(tokens[16]).toEqual value: 'False', scopes: ['source.python', 'meta.function-call.python', 'meta.function-call.arguments.python', 'meta.function-call.python', 'meta.function-call.arguments.python', 'constant.language.python']
    expect(tokens[17]).toEqual value: ')', scopes: ['source.python', 'meta.function-call.python', 'meta.function-call.arguments.python', 'meta.function-call.python', 'punctuation.definition.arguments.end.python']
    expect(tokens[18]).toEqual value: ', ', scopes: ['source.python', 'meta.function-call.python', 'meta.function-call.arguments.python']
    expect(tokens[20]).toEqual value: ')', scopes: ['source.python', 'meta.function-call.python', 'punctuation.definition.arguments.end.python']
    expect(tokens[21]).toEqual value: '.', scopes: ['source.python']

  it "tokenizes SQL inline highlighting on blocks", ->
    delimsByScope =
      "string.quoted.double.block.sql.python": '"""'
      "string.quoted.single.block.sql.python": "'''"

    for scope, delim in delimsByScope
      tokens = grammar.tokenizeLines(
        delim +
        'SELECT bar
        FROM foo'
        + delim
      )

      expect(tokens[0][0]).toEqual value: delim, scopes: ['source.python', scope, 'punctuation.definition.string.begin.python']
      expect(tokens[1][0]).toEqual value: 'SELECT bar', scopes: ['source.python', scope]
      expect(tokens[2][0]).toEqual value: 'FROM foo', scopes: ['source.python', scope]
      expect(tokens[3][0]).toEqual value: delim, scopes: ['source.python', scope, 'punctuation.definition.string.end.python']

  it "tokenizes SQL inline highlighting on blocks with a CTE", ->
    delimsByScope =
      "string.quoted.double.block.sql.python": '"""'
      "string.quoted.single.block.sql.python": "'''"

    for scope, delim of delimsByScope
      tokens = grammar.tokenizeLines("""
        #{delim}
        WITH example_cte AS (
        SELECT bar
        FROM foo
        GROUP BY bar
        )

        SELECT COUNT(*)
        FROM example_cte
        #{delim}
      """)

      expect(tokens[0][0]).toEqual value: delim, scopes: ['source.python', scope, 'punctuation.definition.string.begin.python']
      expect(tokens[1][0]).toEqual value: 'WITH example_cte AS (', scopes: ['source.python', scope]
      expect(tokens[2][0]).toEqual value: 'SELECT bar', scopes: ['source.python', scope]
      expect(tokens[3][0]).toEqual value: 'FROM foo', scopes: ['source.python', scope]
      expect(tokens[4][0]).toEqual value: 'GROUP BY bar', scopes: ['source.python', scope]
      expect(tokens[5][0]).toEqual value: ')', scopes: ['source.python', scope]
      expect(tokens[6][0]).toEqual value: '', scopes: ['source.python', scope]
      expect(tokens[7][0]).toEqual value: 'SELECT COUNT(*)', scopes: ['source.python', scope]
      expect(tokens[8][0]).toEqual value: 'FROM example_cte', scopes: ['source.python', scope]
      expect(tokens[9][0]).toEqual value: delim, scopes: ['source.python', scope, 'punctuation.definition.string.end.python']

  it "tokenizes SQL inline highlighting on single line with a CTE", ->

    {tokens} = grammar.tokenizeLine('\'WITH example_cte AS (SELECT bar FROM foo) SELECT COUNT(*) FROM example_cte\'')

    expect(tokens[0]).toEqual value: '\'', scopes: ['source.python', 'string.quoted.single.single-line.python', 'punctuation.definition.string.begin.python']
    expect(tokens[1]).toEqual value: 'WITH example_cte AS (SELECT bar FROM foo) SELECT COUNT(*) FROM example_cte', scopes: ['source.python', 'string.quoted.single.single-line.python']
    expect(tokens[2]).toEqual value: '\'', scopes: ['source.python', 'string.quoted.single.single-line.python', 'punctuation.definition.string.end.python']
