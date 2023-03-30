describe 'Go settings', ->
  [editor, languageMode] = []

  afterEach ->
    editor.destroy()

  beforeEach ->
    atom.config.set('core.useTreeSitterParsers', false)

    waitsForPromise ->
      atom.workspace.open().then (o) ->
        editor = o
        languageMode = editor.languageMode

    waitsForPromise ->
      atom.packages.activatePackage('language-go')

  it 'matches lines correctly using the increaseIndentPattern', ->
    increaseIndentRegex = languageMode.increaseIndentRegexForScopeDescriptor(['source.go'])

    expect(increaseIndentRegex.findNextMatchSync('  case true:')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  default:')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('func something() {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  if true {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  else {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  switch {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  switch true {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  select {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  select true {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  for v := range val {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  for i := 0; i < 10; i++ {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  for i := 0; i < 10; i++ {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  type something struct {')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  fmt.Printf("some%s",')).toBeTruthy()
    expect(increaseIndentRegex.findNextMatchSync('  aSlice := []string{}{')).toBeTruthy()

  it 'matches lines correctly using the decreaseIndentPattern', ->
    decreaseIndentRegex = languageMode.decreaseIndentRegexForScopeDescriptor(['source.go'])

    expect(decreaseIndentRegex.findNextMatchSync('  case true:')).toBeTruthy()
    expect(decreaseIndentRegex.findNextMatchSync('  default:')).toBeTruthy()
    expect(decreaseIndentRegex.findNextMatchSync('  }')).toBeTruthy()
    expect(decreaseIndentRegex.findNextMatchSync('  },')).toBeTruthy()
    expect(decreaseIndentRegex.findNextMatchSync('  )')).toBeTruthy()
    expect(decreaseIndentRegex.findNextMatchSync('  ),')).toBeTruthy()

  it 'matches lines correctly using the decreaseNextIndentPattern', ->
    decreaseNextIndentRegex = languageMode.decreaseNextIndentRegexForScopeDescriptor(['source.go'])

    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println("something"))')).toBeTruthy()
    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println("something")),')).toBeTruthy()
    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println("something"), "x"),')).toBeTruthy()
    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println(fmt.Sprint("something"))),')).toBeTruthy()
    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println(fmt.Sprint("something"), "x")),')).toBeTruthy()

    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println("something")')).toBeFalsy()
    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println("something"),')).toBeFalsy()

    # a line with many (), testing for catastrophic backtracking.
    # see https://github.com/atom/language-go/issues/78
    longLine = 'first.second().third().fourth().fifth().sixth().seventh().eighth().ninth().tenth()'
    expect(decreaseNextIndentRegex.findNextMatchSync(longLine)).toBeFalsy()
