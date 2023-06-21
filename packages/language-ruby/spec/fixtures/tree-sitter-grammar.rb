require "."
# <- keyword.other.special-method

class A::B < C
# <- keyword.control.class
#     ^ constant
#     ^ support.other.namespace.ruby
#      ^ keyword.operator.namespace
#        ^ constant
#        ^ support.other.class.ruby
#          ^ punctuation.separator.inheritance
#            ^ entity.other.inherited-class
  public
  # <- keyword.other.special-method
  protected
  # <- keyword.other.special-method
  private
  # <- keyword.other.special-method

  public def foo(a)
  # <- keyword.other.special-method
  #      ^ keyword.control.def
  #          ^ entity.name.function
  #              ^ variable.parameter.function
    self
    # <- variable.language.self
    @b = a
    # <- variable.other.readwrite.instance
    #  ^ keyword.operator.assignment
    #    ^ source
    d = c
    # <- source
  end

end

thing&.call
#    ^ keyword.operator.accessor
#      ^ support.other.function

VAR1 = 100
# <- constant
#    ^ keyword.operator.assignment
#      ^ constant.numeric

_VAR1 = 100_000
# <- !constant
#       ^ constant.numeric

# This dot will not be tokenized as a separator
1.23
#^ constant.numeric

# But this will
a.b
#^ keyword.operator.accessor

# These are all also numbers:
1.23e-4
# <- constant.numeric
0d100_000
# <- constant.numeric
0xAFFF
# <- constant.numeric
0XA_FFF
# <- constant.numeric
01_777
# <- constant.numeric
0o1_777
# <- constant.numeric
0b100_000
# <- constant.numeric
0B00100
# <- constant.numeric

:test
# <- constant.other.symbol
:$symbol
# <- constant.other.symbol
:<=>
# <- constant.other.symbol
%s(foo)
# <- constant.other.symbol.delimited

# Yes, these are ALL arrays
%i(foo)
# <- punctuation.definition.begin.array.other
#  ^ constant.other.symbol
#     ^ punctuation.definition.end.array.other
%i!foo!
# <- punctuation.definition.begin.array.other
#  ^ constant.other.symbol
#     ^ punctuation.definition.end.array.other

%w(foo)
# <- punctuation.definition.begin.array.other
#  ^ string.unquoted
#     ^ punctuation.definition.end.array.other

[:foo]
# <- punctuation.definition.begin.array.bracket.square
#  ^ constant.other.symbol
#    ^ punctuation.definition.end.array.bracket.square

{foo: 1}
# <- punctuation.definition.hash.begin.bracket.curly
# ^ constant.other.symbol.hashkey
#      ^ punctuation.definition.hash.end.bracket.curly
{:foo => 1}
# ^ constant.other.symbol.hashkey

# Strings.
"te\ste"
# <- punctuation.definition.string.begin
# ^ string.quoted.double.interpolated
#  ^ constant.character.escape
#    ^ string.quoted.double.interpolated
'te\ste'
# <- punctuation.definition.string.begin
# ^ string.quoted.single
# ^ !string.quoted.single.interpolated
#  ^ !constant.character.escape

%(te(s)t)
# <- punctuation.definition.string.begin
# ^ string.quoted.other.interpolated
#       ^ punctuation.definition.string.end

%[te[s]t]
# <- punctuation.definition.string.begin
# ^ string.quoted.other.interpolated
#       ^ punctuation.definition.string.end

%~te\~s~
# <- punctuation.definition.string.begin
# ^ string.quoted.other.interpolated
#   ^ constant.character.escape
#    ^ constant.character.escape
#     ^ string.quoted.other.interpolated

%Q(te(s)t)
# <- punctuation.definition.string.begin
# ^ string.quoted.other.interpolated
#        ^ punctuation.definition.string.end

%x!#{"l" + "s"}!
# <- punctuation.definition.string.begin
# ^ punctuation.definition.string.begin
#  ^ punctuation.section.embedded.begin
#   ^ punctuation.section.embedded.begin
#             ^ punctuation.section.embedded.end
#              ^ punctuation.definition.string.end

/test/
# <- punctuation.definition.begin.regexp
# ^ string.regexp
#    ^ punctuation.definition.end.regexp

%r(foo)
# <- punctuation.definition.begin.regexp
#  ^ string.regexp
#     ^ punctuation.definition.end.regexp
