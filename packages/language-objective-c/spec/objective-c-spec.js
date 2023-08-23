/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
describe('Language-Objective-C', function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage('language-objective-c'));

    return waitsForPromise(() => atom.packages.activatePackage('language-c'));
  });

  describe("Objective-C", function() {
    beforeEach(() => grammar = atom.grammars.grammarForScopeName('source.objc'));

    it('parses the grammar', function() {
      expect(grammar).toBeTruthy();
      return expect(grammar.scopeName).toBe('source.objc');
    });

    return it('tokenizes classes', function() {
      const lines = grammar.tokenizeLines(`\
@interface Thing
@property (nonatomic, strong) NSArray *items;
@end\
`
      );

      expect(lines[0][1]).toEqual({value: 'interface', scopes: ["source.objc", "meta.interface-or-protocol.objc", "storage.type.objc"]});
      return expect(lines[0][3]).toEqual({value: 'Thing', scopes: ["source.objc", "meta.interface-or-protocol.objc", "entity.name.type.objc"]});
  });
});

  return describe("Objective-C++", function() {
    beforeEach(() => grammar = atom.grammars.grammarForScopeName('source.objcpp'));

    it('parses the grammar', function() {
      expect(grammar).toBeTruthy();
      return expect(grammar.scopeName).toBe('source.objcpp');
    });

    return it('tokenizes classes', function() {
      const lines = grammar.tokenizeLines(`\
class Thing1 {
  vector<int> items;
};

@interface Thing2
@property (nonatomic, strong) NSArray *items;
@end\
`
      );

      expect(lines[0][2].value).toBe('Thing1');
      return expect(lines[4][3]).toEqual({value: 'Thing2', scopes: ["source.objcpp", "meta.interface-or-protocol.objc", "entity.name.type.objc"]});
  });
});
});
