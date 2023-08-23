/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
describe('Python settings', function() {
  let [editor, languageMode] = [];

  afterEach(() => editor.destroy());

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);


    waitsForPromise(() => atom.workspace.open().then(function(o) {
      editor = o;
      return languageMode = editor.languageMode;
    }));

    return waitsForPromise(() => atom.packages.activatePackage('language-python'));
  });

  it('matches lines correctly using the increaseIndentPattern', function() {
    const increaseIndentRegex = languageMode.increaseIndentRegexForScopeDescriptor(['source.python']);

    expect(increaseIndentRegex.findNextMatchSync('for i in range(n):')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  for i in range(n):')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('async for i in range(n):')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  async for i in range(n):')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('class TheClass(Object):')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  class TheClass(Object):')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('def f(x):')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  def f(x):')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('async def f(x):')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  async def f(x):')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('if this_var == that_var:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  if this_var == that_var:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('elif this_var == that_var:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  elif this_var == that_var:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('else:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  else:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('except Exception:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  except Exception:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('except Exception as e:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  except Exception as e:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('finally:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  finally:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('with open("filename") as f:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  with open("filename") as f:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('async with open("filename") as f:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  async with open("filename") as f:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('while True:')).toBeTruthy();
    expect(increaseIndentRegex.findNextMatchSync('  while True:')).toBeTruthy();
    return expect(increaseIndentRegex.findNextMatchSync('\t\t  while True:')).toBeTruthy();
  });

  it('does not match lines incorrectly using the increaseIndentPattern', function() {
    const increaseIndentRegex = languageMode.increaseIndentRegexForScopeDescriptor(['source.python']);

    expect(increaseIndentRegex.findNextMatchSync('for i in range(n)')).toBeFalsy();
    expect(increaseIndentRegex.findNextMatchSync('class TheClass(Object)')).toBeFalsy();
    expect(increaseIndentRegex.findNextMatchSync('def f(x)')).toBeFalsy();
    expect(increaseIndentRegex.findNextMatchSync('if this_var == that_var')).toBeFalsy();
    return expect(increaseIndentRegex.findNextMatchSync('"for i in range(n):"')).toBeFalsy();
  });

  it('matches lines correctly using the decreaseIndentPattern', function() {
    const decreaseIndentRegex = languageMode.decreaseIndentRegexForScopeDescriptor(['source.python']);

    expect(decreaseIndentRegex.findNextMatchSync('elif this_var == that_var:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('  elif this_var == that_var:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('else:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('  else:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('except Exception:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('  except Exception:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('except Exception as e:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('  except Exception as e:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('finally:')).toBeTruthy();
    expect(decreaseIndentRegex.findNextMatchSync('  finally:')).toBeTruthy();
    return expect(decreaseIndentRegex.findNextMatchSync('\t\t  finally:')).toBeTruthy();
  });

  return it('does not match lines incorrectly using the decreaseIndentPattern', function() {
    const decreaseIndentRegex = languageMode.decreaseIndentRegexForScopeDescriptor(['source.python']);

    // NOTE! This first one is different from most other rote tests here.
    expect(decreaseIndentRegex.findNextMatchSync('else: expression()')).toBeFalsy();
    expect(decreaseIndentRegex.findNextMatchSync('elif this_var == that_var')).toBeFalsy();
    expect(decreaseIndentRegex.findNextMatchSync('  elif this_var == that_var')).toBeFalsy();
    expect(decreaseIndentRegex.findNextMatchSync('else')).toBeFalsy();
    return expect(decreaseIndentRegex.findNextMatchSync('  "finally:"')).toBeFalsy();
  });
});
