describe("XS grammar", () => {
  let grammar = null;
  beforeEach(() => {
    waitsForPromise(() => atom.packages.activatePackage("language-perl"));
    runs(() => grammar = atom.grammars.grammarForScopeName("source.xs"));
  });

  it("parses the grammar", () => {
    expect(grammar).toBeDefined();
    expect(atom.grammars.selectGrammar("foo.xs").scopeName).toBe("source.xs");
    expect(grammar.scopeName).toBe("source.xs");
  });

  describe("parses the header portion correctly", () => {
    it("works with module and package", () => {
      const {tokens} = grammar.tokenizeLine("MODULE = MyModule    PACKAGE = MyModule");
      expect(tokens[0]).toEqual({value: "MODULE", scopes: ["source.xs", "keyword.control.directive.xs"]});
      expect(tokens[2]).toEqual({value: "PACKAGE", scopes: ["source.xs", "keyword.control.directive.xs"]});
    });

  });

  describe("parses preprocessor stuff", () => {
    it("works with define", () => {
      const {tokens} = grammar.tokenizeLine("#define FOO \"bar\"");
      expect(tokens[0]).toEqual({value: "#define", scopes: ["source.xs", "keyword.control.directive.xs"]});
    });
    it("works with if endif", () => {
      const {tokens} = grammar.tokenizeLine("#ifdef FOO #endif");
      expect(tokens[0]).toEqual({value: "#ifdef", scopes: ["source.xs", "keyword.control.directive.xs"]});
      expect(tokens[2]).toEqual({value: " #endif", scopes: ["source.xs", "keyword.control.directive.xs"]});
    });
  });

  describe("strings", () => {
    it("works with double quotes", () => {
      const {tokens} = grammar.tokenizeLine("\"String!\"");
      expect(tokens[0]).toEqual({value: "\"", scopes: ["source.xs", "string.quoted.double.xs"]});
      expect(tokens[1]).toEqual({value: "String!", scopes: ["source.xs", "string.quoted.double.xs"]})
      expect(tokens[2]).toEqual({value: "\"", scopes: ["source.xs", "string.quoted.double.xs"]});
    });
    it("works with single quotes", () => {
      const {tokens} = grammar.tokenizeLine("'s'");
      expect(tokens[0]).toEqual({value: "'", scopes: ["source.xs", "string.quoted.single.xs"]});
      expect(tokens[1]).toEqual({value: "s", scopes: ["source.xs", "string.quoted.single.xs"]})
      expect(tokens[2]).toEqual({value: "'", scopes: ["source.xs", "string.quoted.single.xs"]});
    });
  });

  describe("works with functions", () => {
    it("properly handles CODE and RETURN", () => {
      const tokens = grammar.tokenizeLines(`\
double
get_cell(SV *self, int r, int c)
    PREINIT:
        Matrix *matrix = NULL;
    CODE:
        matrix = INT2PTR(Matrix *, SvIV(SvRV(self)));

        if (r < 0 || r >= matrix->rows || c < 0 || c >= matrix->cols) {
            croak("Index out of bounds");
        }

        RETVAL = matrix->data[r * matrix->cols + c];
    OUTPUT:
        RETVAL\
`);
      expect(tokens[0]).toEqual([{value: "double", scopes: ["source.xs", "storage.type.c.xs"]}]);
      expect(tokens[1]).toEqual([
        {value: "get_cell", scopes: ["source.xs", "entity.name.function.xs"]},
        {value: "(", scopes: ["source.xs"]},
        {value: "SV", scopes: ["source.xs", "storage.type.c.xs"]},
        {value: " *self, ", scopes: ["source.xs"]},
        {value: "int", scopes: ["source.xs", "storage.type.c.xs"]},
        {value: " r, ", scopes: ["source.xs"]},
        {value: "int", scopes: ["source.xs", "storage.type.c.xs"]},
        {value: " c)", scopes: [ "source.xs"]}]);
      expect(tokens[2][1]).toEqual({value: "PREINIT", scopes: ["source.xs", "keyword.control.directive.xs"]});
      expect(tokens[3][1]).toEqual({value: "NULL", scopes: ["source.xs", "constant.language.c.xs"]});
      expect(tokens[4][1]).toEqual({value: "CODE", scopes: ["source.xs", "keyword.other.xs"]});
      expect(tokens[5]).toEqual([
        {value: "        matrix = ", scopes: ["source.xs"]},
        {value: "INT2PTR", scopes: ["source.xs", "entity.name.function.xs"]},
        {value: "(Matrix *, ", scopes: ["source.xs"]},
        {value: "SvIV", scopes: ["source.xs", "entity.name.function.xs"]},
        {value: "(", scopes: ["source.xs"]},
        {value: "SvRV", scopes: ["source.xs", "entity.name.function.xs"]},
        {value: "(self)));", scopes: ["source.xs"]}]);
      expect(tokens[7]).toEqual([
        {value: "        ", scopes: ["source.xs"]},
        {value: "if ", scopes: ["source.xs", "entity.name.function.xs"]},
        {value: "(r < ", scopes: ["source.xs"]},
        {value: "0", scopes: ["source.xs", "constant.numeric.xs"]},
        {value: " || r >= matrix->rows || c < ", scopes : ["source.xs"]},
        {value: "0", scopes: ["source.xs", "constant.numeric.xs"]},
        {value: " || c >= matrix->cols) {", scopes: ["source.xs"]}]);
      expect(tokens[8]).toEqual([
        {value: "            ", scopes: ["source.xs"]},
        {value: "croak", scopes: ["source.xs", "entity.name.function.xs"]},
        {value: "(", scopes: ["source.xs"]},
        {value: "\"", scopes: ["source.xs", "string.quoted.double.xs"]},
        {value: "Index out of bounds", scopes: ["source.xs", "string.quoted.double.xs"]},
        {value: "\"", scopes: ["source.xs", "string.quoted.double.xs"]},
        {value: ");", scopes: ["source.xs"]}]);
      expect(tokens[11]).toEqual([{value: "        RETVAL = matrix->data[r * matrix->cols + c];", scopes: ["source.xs"]}]);
      expect(tokens[12][1]).toEqual({value: "OUTPUT", scopes: ["source.xs", "keyword.other.xs"]});
    })
  });

  describe("works with misc", () => {
    it("works with comments", () => {
      let {tokens} = grammar.tokenizeLine("/* this is a comment */");
      expect(tokens[0]).toEqual({value: "/*", scopes: ["source.xs", "comment.block.xs"]});
      expect(tokens[1]).toEqual({value: " this is a comment ", scopes: ["source.xs", "comment.block.xs"]});
      expect(tokens[2]).toEqual({value: "*/", scopes: ["source.xs", "comment.block.xs"]});

      ({tokens} = grammar.tokenizeLine(" # this is a valid xs comment!"));

      expect(tokens[0]).toEqual({value: " # this is a valid xs comment!", scopes: ["source.xs", "comment.line.number-sign.xs"]});
    });
  });
});
