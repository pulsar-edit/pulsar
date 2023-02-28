require "."
# <- keyword.other.special-method.ruby

class A::B < C
# <- keyword.control.class.ruby
#     ^ entity.name.type.class.ruby
#      ^ punctuation.separator.namespace.ruby
#        ^ entity.name.type.class.ruby
#          ^ punctuation.separator.inheritance.ruby
#            ^ entity.other.inherited-class.ruby
#            ^ entity.name.type.class.ruby
  public
  # <- keyword.other.special-method.ruby
  protected
  # <- keyword.other.special-method.ruby
  private
  # <- keyword.other.special-method.ruby

  public def foo(a)
  # <- keyword.other.special-method.ruby
  #      ^ keyword.control.def.ruby
  #          ^ entity.name.function.ruby
  #              ^ variable.parameter.function.ruby
    self
    # <- variable.language.self.ruby
    @b = a
    # <- variable.other.readwrite.instance.ruby
    #  ^ keyword.operator.assignment.ruby
    #    ^ source.ruby
    c = 10
    # <- source.ruby
  end

end

thing&.call
#    ^ punctuation.separator.method.ruby
#      ^ source.ruby

VAR1 = 100
# <- variable.other.constant.ruby
#    ^ keyword.operator.assignment.ruby
#      ^ constant.numeric.ruby

_VAR1 = 100_000
# <- variable.other.constant.ruby
#       ^ constant.numeric.ruby

# This dot will not be tokenized as a separator
1.23
#^ constant.numeric.ruby

# But this will
a.b
#^ punctuation.separator.method.ruby

# These are all also numbers:
1.23e-4
# <- constant.numeric.ruby
0d100_000
# <- constant.numeric.ruby
0xAFFF
# <- constant.numeric.ruby
0XA_FFF
# <- constant.numeric.ruby
01_777
# <- constant.numeric.ruby
0o1_777
# <- constant.numeric.ruby
0b100_000
# <- constant.numeric.ruby
0B00100
# <- constant.numeric.ruby

:test
# <- constant.other.symbol.ruby
:$symbol
# <- constant.other.symbol.ruby
:<=>
# <- constant.other.symbol.ruby
%i(foo)
# <- punctuation.section.array.begin.ruby
#  ^ constant.other.symbol.ruby
{foo: 1}
# <- punctuation.section.scope.begin.ruby
# ^ constant.other.symbol.hashkey.ruby
{:foo => 1}
# ^ constant.other.symbol.hashkey.ruby

class << A::B
# <- keyword.control.class.ruby
#     ^ punctuation.definition.variable.ruby
#        ^ entity.name.type.class.ruby
#         ^ punctuation.separator.namespace.ruby
end

def a.b(*args)
# <- meta.function.method.with-arguments.ruby
# <- keyword.control.def.ruby
#   ^ entity.name.function.ruby
#    ^ entity.name.function.ruby
#    ^ punctuation.separator.method.ruby
#      ^ meta.function.method.with-arguments.ruby
#      ^ punctuation.definition.parameters.ruby
#       ^ storage.type.variable.ruby
#        ^ variable.parameter.function.ruby
#            ^ punctuation.definition.parameters.ruby
end
# <- keyword.control.ruby

# Strings.
%(te(s)t)
# <- punctuation.definition.string.begin.ruby
# ^ string.quoted.other.interpolated.ruby
#   ^ punctuation.section.scope.ruby
#    ^ string.quoted.other.interpolated.ruby
#       ^ punctuation.definition.string.end.ruby

%[te[s]t]
# <- punctuation.definition.string.begin.ruby
# ^ string.quoted.other.interpolated.ruby
#   ^ punctuation.section.scope.ruby
#    ^ string.quoted.other.interpolated.ruby
#       ^ punctuation.definition.string.end.ruby

%{te{s}t}
# <- punctuation.definition.string.begin.ruby
# ^ string.quoted.other.interpolated.ruby
#   ^ punctuation.section.scope.ruby
#    ^ string.quoted.other.interpolated.ruby
#       ^ punctuation.definition.string.end.ruby

%<te<s>t>
# <- punctuation.definition.string.begin.ruby
# ^ string.quoted.other.interpolated.ruby
#   ^ punctuation.section.scope.ruby
#    ^ string.quoted.other.interpolated.ruby
#       ^ punctuation.definition.string.end.ruby

%~te\~s~
# <- punctuation.definition.string.begin.ruby
# ^ string.quoted.other.interpolated.ruby
#   ^ constant.character.escape.ruby
#    ^ constant.character.escape.ruby
#     ^ string.quoted.other.interpolated.ruby

%Q(te(s)t)
# <- punctuation.definition.string.begin.ruby
# ^ string.quoted.other.interpolated.ruby
#    ^ punctuation.section.scope.ruby
#     ^ string.quoted.other.interpolated.ruby
#        ^ punctuation.definition.string.end.ruby

%x!#{"l" + "s"}!
# <- punctuation.definition.string.begin.ruby
# ^ punctuation.definition.string.begin.ruby
#  ^ punctuation.section.embedded.begin.ruby
#   ^ punctuation.section.embedded.begin.ruby
#             ^ punctuation.section.embedded.end.ruby
#              ^ punctuation.definition.string.end.ruby

/test/
# <- punctuation.section.regexp.ruby
# ^ string.regexp.interpolated.ruby
#    ^ punctuation.section.regexp.ruby
