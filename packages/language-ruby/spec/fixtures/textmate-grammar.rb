require "."
# <- keyword.other.special-method

class A::B < C
# <- keyword.control.class
#     ^ entity.name.type.class
#      ^ punctuation.separator.namespace
#        ^ entity.name.type.class
#          ^ punctuation.separator.inheritance
#            ^ entity.other.inherited-class
#            ^ entity.name.type.class
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
    c = 10
    # <- source
  end

end

thing&.call
#    ^ punctuation.separator.method
#      ^ source

VAR1 = 100
# <- variable.other.constant
#    ^ keyword.operator.assignment
#      ^ constant.numeric

_VAR1 = 100_000
# <- variable.other.constant
#       ^ constant.numeric

# This dot will not be tokenized as a separator
1.23
#^ constant.numeric

# But this will
a.b
#^ punctuation.separator.method

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
%i(foo)
# <- punctuation.section.array.begin
#  ^ constant.other.symbol
{foo: 1}
# <- punctuation.section.scope.begin
# ^ constant.other.symbol.hashkey
#   ^ punctuation.definition.constant.hashkey
{:foo => 1}
# <- punctuation.section.scope.begin
# ^ constant.other.symbol.hashkey
#     ^ punctuation.separator.key-value
#         ^ punctuation.section.scope.end

a { |x| x }
# ^ punctuation.section.scope.begin.ruby
#   ^ punctuation.separator.variable
#     ^ punctuation.separator.variable
#         ^ punctuation.section.scope.end

class << A::B
# <- keyword.control.class
#     ^ punctuation.definition.variable
#        ^ entity.name.type.class
#         ^ punctuation.separator.namespace
end

def a.b(*args)
# <- meta.function.method.with-arguments
# <- keyword.control.def
#   ^ entity.name.function
#    ^ entity.name.function
#    ^ punctuation.separator.method
#      ^ meta.function.method.with-arguments
#      ^ punctuation.definition.parameters
#       ^ storage.type.variable
#        ^ variable.parameter.function
#            ^ punctuation.definition.parameters
end
# <- keyword.control

# Strings.
%(te(s)t)
# <- punctuation.definition.string.begin
# ^ string.quoted.other.interpolated
#       ^ punctuation.definition.string.end

%[te[s]t]
# <- punctuation.definition.string.begin
# ^ string.quoted.other.interpolated
#       ^ punctuation.definition.string.end

%{te{s}t}
# <- punctuation.definition.string.begin
# ^ string.quoted.other.interpolated
#       ^ punctuation.definition.string.end

%<te<s>t>
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
#     ^ string.quoted.other.interpolated
#        ^ punctuation.definition.string.end

%x!#{"l" + "s"}!
# <- punctuation.definition.string.begin
# ^ punctuation.definition.string.begin
#  ^ punctuation.section.embedded.begin
#   ^ punctuation.section.embedded.begin
#             ^ punctuation.section.embedded.end
#              ^ punctuation.definition.string.end

/test/
# <- punctuation.section.regexp
# ^ string.regexp.interpolated
#    ^ punctuation.section.regexp
