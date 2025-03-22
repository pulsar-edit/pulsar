# SYNTAX TEST "source.python"


my_func2 = lambda x, y=2, *z, **kw: x + y + 1
#        ^ keyword.operator.assignment
#          ^^^^^^^^^^^^^^^^^^^^^^^ meta.function.inline
#           ^^^^^ keyword.control.lambda
#                 ^^^^^^^^^^^^^^^^ meta.function.inline.parameters
#                 ^                variable.parameter.function
#                    ^             variable.parameter.function
#                          ^       variable.parameter.function
#                               ^^ variable.parameter.function
#                  ^          punctuation.separator.parameters
#                       ^     punctuation.separator.parameters
#                           ^ punctuation.separator.parameters
#                    ^ variable.parameter.function
#                     ^ keyword.operator.assignment
#                      ^ constant
#                         ^      keyword.operator.splat
#                             ^^ keyword.operator.splat
#                          ^ variable.parameter.function
#                                 ^ punctuation.definition.function.lambda.colon


lambda x, z = 4: x * z
# ^^^^^^^^^^^^^ meta.function.inline.python
# <- keyword.control.lambda.python
#      ^^^^^^^^ meta.function.inline.parameters.python
#      ^    variable.parameter.function.lambda.python
#         ^ variable.parameter.function.lambda.python
#       ^ punctuation.separator.parameters.comma.python
#           ^ keyword.operator.assignment.python
#             ^ constant.numeric.integer.python
#              ^ punctuation.definition.function.lambda.colon.python


lambda: None
# ^^^^ meta.function.inline.python
# <- keyword.control.lambda.python
#     ^ punctuation.definition.function.lambda.colon


not_a_lambda.foo
# <- ! meta.function.inline.python


lambda_not.foo
# <- ! meta.function.inline.python
