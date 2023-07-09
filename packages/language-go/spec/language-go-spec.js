/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
describe('Go settings', function() {
  let [editor, languageMode] = Array.from([]);

  afterEach(() => editor.destroy());

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);


    waitsForPromise(() => atom.workspace.open().then(function(o) {
      editor = o;
      return languageMode = editor.languageMode;
    }));

    return waitsForPromise(() => atom.packages.activatePackage('language-go'));
  });

  it('matches lines correctly using the increaseIndentPattern', function() {
    const increaseIndentRegex = languageMode.increaseIndentRegexForScopeDescriptor(['source.go']);

    expect(increaseIndentRegex.findNextMatchSync('  case true:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  default:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('func something() {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  if true {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  else {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  switch {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  switch true {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  select {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  select true {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  for v := range val {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  for i := 0; i < 10; i++ {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  for i := 0; i < 10; i++ {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  type something struct {')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  fmt.Printf("some%s",')).toBeTruthy();
    return expect(increaseIndentRegex.findNextMatchSync('  aSlice := []string{}{')).toBeTruthy();
  });

  it('matches lines correctly using the decreaseIndentPattern', function() {
    const decreaseIndentRegex = languageMode.decreaseIndentRegexForScopeDescriptor(['source.go']);

    expect(decreaseIndentRegex.findNextMatchSync('  case true:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('  default:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('  }')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('  },')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('  )')).toBeTruthy();
    return expect(decreaseIndentRegex.findNextMatchSync('  ),')).toBeTruthy();
  });

  return it('matches lines correctly using the decreaseNextIndentPattern', function() {
    const decreaseNextIndentRegex = languageMode.decreaseNextIndentRegexForScopeDescriptor(['source.go']);

    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println("something"))')).toBeTruthy();
    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println("something")),')).toBeTruthy();
    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println("something"), "x"),')).toBeTruthy();
    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println(fmt.Sprint("something"))),')).toBeTruthy();
    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println(fmt.Sprint("something"), "x")),')).toBeTruthy();

    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println("something")')).toBeFalsy();
    expect(decreaseNextIndentRegex.findNextMatchSync('  fmt.Println("something"),')).toBeFalsy();

    // a line with many (), testing for catastrophic backtracking.
    // see https://github.com/atom/language-go/issues/78
    const longLine = 'first.second().third().fourth().fifth().sixth().seventh().eighth().ninth().tenth()';
    return expect(decreaseNextIndentRegex.findNextMatchSync(longLine)).toBeFalsy();
  });
});
