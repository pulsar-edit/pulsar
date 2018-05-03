# SYNTAX TEST "source.python"


my_func2 = lambda x, y=2, *z, **kw: x + y + 1
#        ^ keyword.operator.assignment
#          ^^^^^^^^^^^^^^^^^^^^^^^ meta.function.inline
#           ^^^^^ storage.type.function.inline
#                 ^^^^^^^^^^^^^^^^ meta.function.inline.parameters
#                 ^  ^     ^    ^^ variable.parameter.function
#                  ^    ^   ^ punctuation.separator.parameters
#                    ^ variable.parameter.function
#                     ^ keyword.operator.assignment
#                      ^ constant
#                         ^   ^^ keyword.operator.unpacking.arguments
#                          ^ variable.parameter.function
#                                 ^ punctuation.definition.function.begin


lambda x, z = 4: x * z
# ^^^^^^^^^^^^^ meta.function.inline.python
# <- storage.type.function.inline.python
#      ^^^^^^^^ meta.function.inline.parameters.python
#      ^  ^ variable.parameter.function.python
#       ^ punctuation.separator.parameters.python
#           ^ keyword.operator.assignment.python
#             ^ constant.numeric.integer.decimal.python
#              ^ punctuation.definition.function.begin.python


lambda: None
# ^^^^ meta.function.inline.python
# <- storage.type.function.inline.python
#     ^ punctuation.definition.function.begin.python


not_a_lambda.foo
# <- ! meta.function.inline.python


lambda_not.foo
# <- ! meta.function.inline.python
