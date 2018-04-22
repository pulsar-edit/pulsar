# SYNTAX TEST "source.python"


def my_func(first, second=False, *third, **forth):
# <- storage.type.function
#   ^^^^^^^ entity.name.function
#          ^ punctuation.definition.parameters.begin
#           ^^^^^ variable.parameter.function
#                ^ punctuation.separator.parameters
#                  ^^^^^^ variable.parameter.function
#                        ^ keyword.operator.assignment
#                         ^^^^^ constant
#                              ^ punctuation.separator.parameters
#                                ^ keyword.operator.unpacking.arguments
#                                 ^^^^^ variable.parameter.function
#                                      ^ punctuation.separator.parameters
#                                        ^^ keyword.operator.unpacking.arguments
#                                          ^^^^^ variable.parameter.function
#                                                ^ punctuation.definition.function.begin
    pass


my_func2 = lambda x, y=2, *z, **kw: x + y + 1
#        ^ keyword.operator.assignment
#           ^^^^^ meta.function.inline storage.type.function.inline
#                 ^^^^^^^^^^^^^^^^ meta.function.inline.parameters
#                 ^ variable.parameter.function
#                  ^ punctuation.separator.parameters
#                    ^ variable.parameter.function
#                     ^ keyword.operator.assignment
#                      ^ constant
#                       ^ punctuation.separator.parameters
#                         ^ keyword.operator.unpacking.arguments
#                          ^ variable.parameter.function
#                           ^ punctuation.separator.parameters
#                             ^^ keyword.operator.unpacking.arguments
#                               ^^ variable.parameter.function
#                                 ^ punctuation.definition.function.begin
