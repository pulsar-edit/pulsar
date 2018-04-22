# SYNTAX TEST "source.python"


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


lambda x, z = 4: x * z
# <- source.python meta.function.inline.python storage.type.function.inline.python
#     ^ source.python meta.function.inline.python
#      ^ source.python meta.function.inline.python meta.function.inline.parameters.python variable.parameter.function.python
#       ^ source.python meta.function.inline.python meta.function.inline.parameters.python punctuation.separator.parameters.python
#        ^ source.python meta.function.inline.python
#         ^ source.python meta.function.inline.python meta.function.inline.parameters.python variable.parameter.function.python
#           ^ source.python meta.function.inline.python meta.function.inline.parameters.python keyword.operator.assignment.python
#             ^ source.python meta.function.inline.python meta.function.inline.parameters.python constant.numeric.integer.decimal.python
#              ^ source.python meta.function.inline.python punctuation.definition.function.begin.python
#               ^^^^^^ source.python
