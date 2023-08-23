/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
describe("Less grammar", function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage("language-css"));

    waitsForPromise(() => atom.packages.activatePackage("language-less"));

    return runs(() => grammar = atom.grammars.grammarForScopeName("source.css.less"));
  });

  it("parses the grammar", function() {
    expect(grammar).toBeDefined();
    return expect(grammar.scopeName).toBe("source.css.less");
  });

  it("parses numbers", function() {
    let {tokens} = grammar.tokenizeLine(" 10");
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[1]).toEqual({value: "10", scopes: ['source.css.less', 'constant.numeric.css']});

    ({tokens} = grammar.tokenizeLine("-.1"));
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({value: "-.1", scopes: ['source.css.less', 'constant.numeric.css']});

    ({tokens} = grammar.tokenizeLine(".4"));
    expect(tokens).toHaveLength(1);
    return expect(tokens[0]).toEqual({value: ".4", scopes: ['source.css.less', 'constant.numeric.css']});
});

  it('parses color names', function() {
    const {tokens} = grammar.tokenizeLine('.foo { color: rebeccapurple; background: whitesmoke; }');
    expect(tokens[8]).toEqual({value: "rebeccapurple", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.color.w3c-extended-color-name.css']});
    return expect(tokens[14]).toEqual({value: "whitesmoke", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.color.w3c-extended-color-name.css']});
});

  it("parses property names", function() {
    let {tokens} = grammar.tokenizeLine("{display: none;}");
    expect(tokens[1]).toEqual({value: "display", scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});

    ({tokens} = grammar.tokenizeLine("{displaya: none;}"));
    return expect(tokens[1]).toEqual({value: "displaya", scopes: ['source.css.less', 'meta.property-list.css']});
});

  it("parses property names distinctly from property values with the same text", function() {
    let {tokens} = grammar.tokenizeLine("{left: left;}");
    expect(tokens).toHaveLength(7);
    expect(tokens[1]).toEqual({value: "left", scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[2]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    expect(tokens[3]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[4]).toEqual({value: "left", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
    expect(tokens[5]).toEqual({value: ";", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.terminator.rule.css']});

    ({tokens} = grammar.tokenizeLine("{left:left;}"));
    expect(tokens).toHaveLength(6);
    expect(tokens[1]).toEqual({value: "left", scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[2]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    expect(tokens[3]).toEqual({value: "left", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
    return expect(tokens[4]).toEqual({value: ";", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
});

  it("parses property names distinctly from element selectors with the same prefix", function() {
    const {tokens} = grammar.tokenizeLine("{table-layout: fixed;}");
    expect(tokens).toHaveLength(7);
    expect(tokens[1]).toEqual({value: "table-layout", scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[2]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    expect(tokens[3]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[4]).toEqual({value: "fixed", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
    return expect(tokens[5]).toEqual({value: ";", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
});

  it("does not parse @media conditions as a property-list", function() {
    const {tokens} = grammar.tokenizeLine('@media (min-resolution: 2dppx) {}');
    expect(tokens[4].scopes).not.toContain('support.type.property-name.css');
    expect(tokens[7].scopes).not.toContain('meta.property-value.css');
    return expect(tokens[11].scopes).not.toContain('meta.property-value.css');
  });

  it("parses @media features", function() {
    const {tokens} = grammar.tokenizeLine('@media (min-width: 100px) {}');
    expect(tokens[0]).toEqual({value: "@", scopes: ['source.css.less', 'meta.at-rule.media.css', 'keyword.control.at-rule.media.css', 'punctuation.definition.keyword.css']});
    expect(tokens[1]).toEqual({value: "media", scopes: ['source.css.less', 'meta.at-rule.media.css', 'keyword.control.at-rule.media.css']});
    expect(tokens[4]).toEqual({value: "min-width", scopes: ['source.css.less', 'support.type.property-name.media.css']});
    expect(tokens[7]).toEqual({value: "100", scopes: ['source.css.less', 'constant.numeric.css']});
    return expect(tokens[8]).toEqual({value: "px", scopes: ['source.css.less', 'constant.numeric.css', 'keyword.other.unit.px.css']});
});

  it("parses @media orientation", function() {
    const {tokens} = grammar.tokenizeLine('@media (orientation: portrait){}');
    expect(tokens[4]).toEqual({value: "orientation", scopes: ['source.css.less', 'support.type.property-name.media.css']});
    return expect(tokens[7]).toEqual({value: "portrait", scopes: ['source.css.less', 'support.constant.property-value.media-property.media.css']});
});

  it("parses parent selector", function() {
    let {tokens} = grammar.tokenizeLine('& .foo {}');
    expect(tokens[0]).toEqual({value: "&", scopes: ['source.css.less', 'entity.other.attribute-name.parent-selector.css', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[2]).toEqual({value: ".", scopes: ['source.css.less', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
    expect(tokens[3]).toEqual({value: "foo", scopes: ['source.css.less', 'entity.other.attribute-name.class.css']});
    expect(tokens[4]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[5]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    expect(tokens[6]).toEqual({value: "}", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']});

    ({tokens} = grammar.tokenizeLine('&:hover {}'));
    expect(tokens[0]).toEqual({value: "&", scopes: ['source.css.less', 'entity.other.attribute-name.parent-selector.css', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: ":", scopes: ['source.css.less', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']});
    expect(tokens[2]).toEqual({value: "hover", scopes: ['source.css.less', 'entity.other.attribute-name.pseudo-class.css']});
    expect(tokens[3]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[4]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    return expect(tokens[5]).toEqual({value: "}", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']});
});

  it("parses pseudo element", function() {
    const {tokens} = grammar.tokenizeLine('.foo::after {}');
    expect(tokens[0]).toEqual({value: ".", scopes: ['source.css.less', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: "foo", scopes: ['source.css.less', 'entity.other.attribute-name.class.css']});
    expect(tokens[2]).toEqual({value: "::", scopes: ['source.css.less', 'entity.other.attribute-name.pseudo-element.css', 'punctuation.definition.entity.css']});
    expect(tokens[3]).toEqual({value: "after", scopes: ['source.css.less', 'entity.other.attribute-name.pseudo-element.css']});
    expect(tokens[4]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[5]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    return expect(tokens[6]).toEqual({value: "}", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']});
});

  it("parses id selectors", function() {
    let {tokens} = grammar.tokenizeLine("#abc {}");
    expect(tokens[0]).toEqual({value: "#", scopes: ['source.css.less', 'meta.selector.css', 'entity.other.attribute-name.id', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: "abc", scopes: ['source.css.less', 'meta.selector.css', 'entity.other.attribute-name.id']});

    ({tokens} = grammar.tokenizeLine("#abc-123 {}"));
    expect(tokens[0]).toEqual({value: "#", scopes: ['source.css.less', 'meta.selector.css', 'entity.other.attribute-name.id', 'punctuation.definition.entity.css']});
    return expect(tokens[1]).toEqual({value: "abc-123", scopes: ['source.css.less', 'meta.selector.css', 'entity.other.attribute-name.id']});
});

  it("parses custom selectors", function() {
    const {tokens} = grammar.tokenizeLine("abc-123-xyz {}");
    return expect(tokens[0]).toEqual({value: "abc-123-xyz", scopes: ['source.css.less', 'entity.name.tag.custom.css']});
});

  it("parses pseudo classes", function() {
    const {tokens} = grammar.tokenizeLine(".foo:hover { span:last-of-type { font-weight: bold; } }");
    expect(tokens[0]).toEqual({value: ".", scopes: ['source.css.less', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: "foo", scopes: ['source.css.less', 'entity.other.attribute-name.class.css']});
    expect(tokens[2]).toEqual({value: ":", scopes: ['source.css.less', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']});
    expect(tokens[3]).toEqual({value: "hover", scopes: ['source.css.less', 'entity.other.attribute-name.pseudo-class.css']});
    expect(tokens[4]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[5]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    expect(tokens[6]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[7]).toEqual({value: "span", scopes: ['source.css.less', 'meta.property-list.css', 'entity.name.tag.css']});
    expect(tokens[8]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']});
    expect(tokens[9]).toEqual({value: "last-of-type", scopes: ['source.css.less', 'meta.property-list.css', 'entity.other.attribute-name.pseudo-class.css']});
    expect(tokens[10]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[11]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    expect(tokens[12]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-list.css']});
    expect(tokens[13]).toEqual({value: "font-weight", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-list.css', 'support.type.property-name.css']});
    return expect(tokens[14]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
});

  it('parses nested multiple lines with pseudo-classes', function() {
    const lines = grammar.tokenizeLines(`\
a { p:hover,
p:active { color: blue; } }\
`
    );
    expect(lines[0][0]).toEqual({value: 'a', scopes: ['source.css.less', 'entity.name.tag.css']});
    expect(lines[0][1]).toEqual({value: ' ', scopes: ['source.css.less']});
    expect(lines[0][2]).toEqual({value: '{', scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    expect(lines[0][3]).toEqual({value: ' ', scopes: ['source.css.less', 'meta.property-list.css']});
    expect(lines[0][4]).toEqual({value: 'p', scopes: ['source.css.less', 'meta.property-list.css', 'entity.name.tag.css']});
    expect(lines[0][5]).toEqual({value: ':', scopes: ['source.css.less', 'meta.property-list.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']});
    expect(lines[0][6]).toEqual({value: 'hover', scopes: ['source.css.less', 'meta.property-list.css', 'entity.other.attribute-name.pseudo-class.css']});
    expect(lines[0][7]).toEqual({value: ',', scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.list.comma.css']});
    expect(lines[1][0]).toEqual({value: 'p', scopes: ['source.css.less', 'meta.property-list.css', 'entity.name.tag.css']});
    expect(lines[1][1]).toEqual({value: ':', scopes: ['source.css.less', 'meta.property-list.css', 'entity.other.attribute-name.pseudo-class.css', 'punctuation.definition.entity.css']});
    expect(lines[1][2]).toEqual({value: 'active', scopes: ['source.css.less', 'meta.property-list.css', 'entity.other.attribute-name.pseudo-class.css']});
    expect(lines[1][3]).toEqual({value: ' ', scopes: ['source.css.less', 'meta.property-list.css']});
    expect(lines[1][4]).toEqual({value: '{', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    return expect(lines[1][5]).toEqual({value: ' ', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-list.css']});
});

  it("parses property lists", function() {
    const {tokens} = grammar.tokenizeLine(".foo { display: table-row; }");
    expect(tokens).toHaveLength(12);
    expect(tokens[0]).toEqual({value: ".", scopes: ['source.css.less', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: "foo", scopes: ['source.css.less', 'entity.other.attribute-name.class.css']});
    expect(tokens[2]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[3]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    expect(tokens[4]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[5]).toEqual({value: "display", scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[6]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    expect(tokens[7]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[8]).toEqual({value: "table-row", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
    expect(tokens[9]).toEqual({value: ";", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
    expect(tokens[10]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    return expect(tokens[11]).toEqual({value: "}", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']});
});

  it('parses font lists', function() {
    const {tokens} = grammar.tokenizeLine('.foo { font-family: "Some Font Name", serif; }');
    expect(tokens[5]).toEqual({value: 'font-family', scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[9]).toEqual({value: 'Some Font Name', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css']});
    return expect(tokens[13]).toEqual({value: 'serif', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.font-name.css']});
});

  it('parses an incomplete property list', function() {
    const {tokens} = grammar.tokenizeLine('.foo { border: none}');
    expect(tokens[5]).toEqual({value: 'border', scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[8]).toEqual({value: 'none', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
    return expect(tokens[9]).toEqual({value: '}', scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']});
});

  it('parses multiple lines of an incomplete property-list', function() {
    const lines = grammar.tokenizeLines(`\
very-custom { color: inherit }
another-one { display: none; }\
`
    );
    expect(lines[0][0]).toEqual({value: 'very-custom', scopes: ['source.css.less', 'entity.name.tag.custom.css']});
    expect(lines[0][4]).toEqual({value: 'color', scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(lines[0][7]).toEqual({value: 'inherit', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
    expect(lines[0][9]).toEqual({value: '}', scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']});

    expect(lines[1][0]).toEqual({value: 'another-one', scopes: ['source.css.less', 'entity.name.tag.custom.css']});
    return expect(lines[1][10]).toEqual({value: '}', scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']});
});

  it("parses variables", function() {
    const {tokens} = grammar.tokenizeLine(".foo { border: @bar; }");
    expect(tokens[0]).toEqual({value: ".", scopes: ['source.css.less', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: "foo", scopes: ['source.css.less', 'entity.other.attribute-name.class.css']});
    expect(tokens[2]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[3]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    expect(tokens[4]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[5]).toEqual({value: "border", scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[6]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    expect(tokens[7]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[8]).toEqual({value: "@", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'variable.other.less', 'punctuation.definition.variable.less']});
    expect(tokens[9]).toEqual({value: "bar", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'variable.other.less']});
    expect(tokens[10]).toEqual({value: ";", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
    expect(tokens[11]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    return expect(tokens[12]).toEqual({value: "}", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']});
});

  it("parses css variables", function() {
    const {tokens} = grammar.tokenizeLine(".foo { --spacing-unit: 6px; }");
    expect(tokens[0]).toEqual({value: ".", scopes: ['source.css.less', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: "foo", scopes: ['source.css.less', 'entity.other.attribute-name.class.css']});
    expect(tokens[2]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[3]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    expect(tokens[4]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[5]).toEqual({value: "--", scopes: ['source.css.less', 'meta.property-list.css', 'variable.other.less', 'punctuation.definition.variable.less']});
    expect(tokens[6]).toEqual({value: "spacing-unit", scopes: ['source.css.less', 'meta.property-list.css', 'variable.other.less']});
    expect(tokens[7]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    expect(tokens[8]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[9]).toEqual({value: "6", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']});
    expect(tokens[10]).toEqual({value: "px", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']});
    expect(tokens[11]).toEqual({value: ";", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
    expect(tokens[12]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    return expect(tokens[13]).toEqual({value: "}", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.end.bracket.curly.css']});
});

  it('parses variable interpolation in selectors', function() {
    const {tokens} = grammar.tokenizeLine('.@{selector} { color: #0ee; }');
    expect(tokens[0]).toEqual({value: '.', scopes: ['source.css.less', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: '@{selector}', scopes: ['source.css.less', 'entity.other.attribute-name.class.css', 'variable.other.interpolation.less']});
    expect(tokens[2]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[3]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    return expect(tokens[4]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
});

  it('parses variable interpolation in properties', function() {
    const {tokens} = grammar.tokenizeLine('.foo { @{property}: #0ee; }');
    expect(tokens[0]).toEqual({value: ".", scopes: ['source.css.less', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: "foo", scopes: ['source.css.less', 'entity.other.attribute-name.class.css']});
    expect(tokens[2]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[3]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    expect(tokens[4]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[5]).toEqual({value: '@{property}', scopes: ['source.css.less', 'meta.property-list.css', 'variable.other.interpolation.less']});
    expect(tokens[6]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    return expect(tokens[7]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
});

  it('parses variable interpolation in urls', function() {
    const {tokens} = grammar.tokenizeLine('.foo { background: #F0F0F0 url("@{var}/img.png"); }";');
    expect(tokens[8]).toEqual({value: "#F0F0F0", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'constant.other.rgb-value.css']});
    expect(tokens[10]).toEqual({value: "url", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css']});
    expect(tokens[11]).toEqual({value: "(", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css', 'meta.brace.round.css']});
    expect(tokens[13]).toEqual({value: "@{var}", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css', 'string.quoted.double.css', 'variable.other.interpolation.less']});
    return expect(tokens[14]).toEqual({value: "/img.png", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css', 'string.quoted.double.css']});
});

  it('parses variable interpolation in imports', function() {
    const {tokens} = grammar.tokenizeLine('@import "@{var}/tidal-wave.less";');
    expect(tokens[0]).toEqual({value: "@", scopes: ['source.css.less', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.less', 'punctuation.definition.keyword.less']});
    expect(tokens[1]).toEqual({value: "import", scopes: ['source.css.less', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.less']});
    expect(tokens[2]).toEqual({value: " ", scopes: ['source.css.less', 'meta.at-rule.import.css']});
    expect(tokens[3]).toEqual({value: "\"", scopes: ['source.css.less', 'meta.at-rule.import.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']});
    return expect(tokens[4]).toEqual({value: "@{var}", scopes: ['source.css.less', 'meta.at-rule.import.css', 'string.quoted.double.css', 'variable.other.interpolation.less']});
});

  it('parses options in import statements', function() {
    const {tokens} = grammar.tokenizeLine('@import (optional, reference) "theme";');
    expect(tokens[0]).toEqual({value: "@", scopes: ['source.css.less', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.less', 'punctuation.definition.keyword.less']});
    expect(tokens[1]).toEqual({value: "import", scopes: ['source.css.less', 'meta.at-rule.import.css', 'keyword.control.at-rule.import.less']});
    expect(tokens[4]).toEqual({value: "optional", scopes: ['source.css.less', 'meta.at-rule.import.css', 'keyword.control.import.option.less']});
    expect(tokens[5]).toEqual({value: ",", scopes: ['source.css.less', 'meta.at-rule.import.css', 'punctuation.separator.list.comma.css']});
    expect(tokens[7]).toEqual({value: "reference", scopes: ['source.css.less', 'meta.at-rule.import.css', 'keyword.control.import.option.less']});
    return expect(tokens[11]).toEqual({value: "theme", scopes: ['source.css.less', 'meta.at-rule.import.css', 'string.quoted.double.css']});
});

  it('parses built-in functions in property values', function() {
    const {tokens} = grammar.tokenizeLine('.foo { border: 1px solid rgba(0,0,0); }');
    expect(tokens[0]).toEqual({value: ".", scopes: ['source.css.less', 'entity.other.attribute-name.class.css', 'punctuation.definition.entity.css']});
    expect(tokens[1]).toEqual({value: "foo", scopes: ['source.css.less', 'entity.other.attribute-name.class.css']});
    expect(tokens[2]).toEqual({value: " ", scopes: ['source.css.less']});
    expect(tokens[3]).toEqual({value: "{", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.section.property-list.begin.bracket.curly.css']});
    expect(tokens[4]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[5]).toEqual({value: "border", scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[6]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    expect(tokens[8]).toEqual({value: "1", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css']});
    expect(tokens[9]).toEqual({value: "px", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'constant.numeric.css', 'keyword.other.unit.px.css']});
    expect(tokens[11]).toEqual({value: "solid", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
    expect(tokens[13]).toEqual({value: "rgba", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'support.function.misc.css']});
    expect(tokens[14]).toEqual({value: "(", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.section.function.begin.bracket.round.css']});
    expect(tokens[15]).toEqual({value: "0", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']});
    expect(tokens[16]).toEqual({value: ",", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']});
    expect(tokens[17]).toEqual({value: "0", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'constant.numeric.css']});
    expect(tokens[18]).toEqual({value: ",", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.color.css', 'punctuation.separator.list.comma.css']});
    return expect(tokens[21]).toEqual({value: ";", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
});

  it('parses linear-gradient', function() {
    const {tokens} = grammar.tokenizeLine('.foo { background: linear-gradient(white, black); }');
    expect(tokens[5]).toEqual({value: "background", scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[6]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    expect(tokens[7]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[8]).toEqual({value: "linear-gradient", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'support.function.gradient.css']});
    return expect(tokens[9]).toEqual({value: "(", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'meta.function.gradient.css', 'punctuation.section.function.begin.bracket.round.css']});
});

  it('parses transform functions', function() {
    const {tokens} = grammar.tokenizeLine('.foo { transform: scaleY(1); }');
    expect(tokens[5]).toEqual({value: "transform", scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[6]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    expect(tokens[7]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[8]).toEqual({value: "scaleY", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.transform.css']});
    return expect(tokens[9]).toEqual({value: "(", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'punctuation.section.function.begin.bracket.round.css']});
});

  it('parses blend modes', function() {
    const {tokens} = grammar.tokenizeLine('.foo { background-blend-mode: color-dodge; }');
    expect(tokens[5]).toEqual({value: "background-blend-mode", scopes: ['source.css.less', 'meta.property-list.css', 'support.type.property-name.css']});
    expect(tokens[6]).toEqual({value: ":", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.separator.key-value.css']});
    expect(tokens[7]).toEqual({value: " ", scopes: ['source.css.less', 'meta.property-list.css']});
    expect(tokens[8]).toEqual({value: "color-dodge", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.constant.property-value.css']});
    return expect(tokens[9]).toEqual({value: ";", scopes: ['source.css.less', 'meta.property-list.css', 'punctuation.terminator.rule.css']});
});

  it('parses non-quoted urls', function() {
    const {tokens} = grammar.tokenizeLine('.foo { background: url(http://%20/2.png) }');
    expect(tokens[8]).toEqual({value: "url", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css']});
    expect(tokens[9]).toEqual({value: "(", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css', 'meta.brace.round.css']});
    return expect(tokens[10]).toEqual({value: "http://%20/2.png", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css', 'string.url.css']});
});

  it('parses non-quoted relative urls', function() {
    const {tokens} = grammar.tokenizeLine('.foo { background: url(../path/to/image.png) }');
    expect(tokens[8]).toEqual({value: "url", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css']});
    expect(tokens[9]).toEqual({value: "(", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css', 'meta.brace.round.css']});
    return expect(tokens[10]).toEqual({value: "../path/to/image.png", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css', 'string.url.css']});
});

  it('parses non-quoted urls followed by a format', function() {
    const {tokens} = grammar.tokenizeLine('@font-face { src: url(http://example.com/font.woff) format("woff"); }');
    expect(tokens[8]).toEqual({value: 'url', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css']});
    expect(tokens[9]).toEqual({value: "(", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css', 'meta.brace.round.css']});
    expect(tokens[10]).toEqual({value: "http://example.com/font.woff", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css', 'string.url.css']});
    expect(tokens[11]).toEqual({value: ")", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.url.css', 'meta.brace.round.css']});
    return expect(tokens[13]).toEqual({value: "format", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'support.function.any-method.builtin.less']});
});

  it('parses the "true" value', function() {
    const {tokens} = grammar.tokenizeLine('@var: true;');
    return expect(tokens[4]).toEqual({value: "true", scopes: ['source.css.less', 'constant.language.boolean.less']});
});

  it('parses mixin guards', function() {
    const {tokens} = grammar.tokenizeLine('.mixin() when (isnumber(@b)) and (default()), (ispixel(@a)) and  not (@a < 0) { }');
    expect(tokens[4]).toEqual({value: "when", scopes: ['source.css.less', 'keyword.control.logical.operator.less']});
    expect(tokens[7]).toEqual({value: "isnumber", scopes: ['source.css.less', 'support.function.type-checking.less']});
    expect(tokens[14]).toEqual({value: "and", scopes: ['source.css.less', 'keyword.control.logical.operator.less']});
    expect(tokens[17]).toEqual({value: "default", scopes: ['source.css.less', 'support.function.default.less']});
    expect(tokens[21]).toEqual({value: ",", scopes: ['source.css.less', 'punctuation.separator.list.comma.css']});
    expect(tokens[24]).toEqual({value: "ispixel", scopes: ['source.css.less', 'support.function.unit-checking.less']});
    expect(tokens[31]).toEqual({value: "and", scopes: ['source.css.less', 'keyword.control.logical.operator.less']});
    expect(tokens[33]).toEqual({value: "not", scopes: ['source.css.less', 'keyword.control.logical.operator.less']});
    return expect(tokens[39]).toEqual({value: "<", scopes: ['source.css.less', 'keyword.operator.less']});
});

  return describe('strings', function() {
    it('tokenizes single-quote strings', function() {
      const {tokens} = grammar.tokenizeLine(".a { content: 'hi' }");

      expect(tokens[8]).toEqual({value: "'", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'punctuation.definition.string.begin.css']});
      expect(tokens[9]).toEqual({value: 'hi', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css']});
      return expect(tokens[10]).toEqual({value: "'", scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'punctuation.definition.string.end.css']});
  });

    it('tokenizes double-quote strings', function() {
      const {tokens} = grammar.tokenizeLine('.a { content: "hi" }');

      expect(tokens[8]).toEqual({value: '"', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.begin.css']});
      expect(tokens[9]).toEqual({value: 'hi', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css']});
      return expect(tokens[10]).toEqual({value: '"', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'punctuation.definition.string.end.css']});
  });

    return it('tokenizes escape characters', function() {
      let {tokens} = grammar.tokenizeLine(".a { content: '\\abcdef' }");

      expect(tokens[9]).toEqual({value: '\\abcdef', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.single.css', 'constant.character.escape.css']});

      ({tokens} = grammar.tokenizeLine('.a { content: "\\abcdef" }'));

      return expect(tokens[9]).toEqual({value: '\\abcdef', scopes: ['source.css.less', 'meta.property-list.css', 'meta.property-value.css', 'string.quoted.double.css', 'constant.character.escape.css']});
  });
});
});
