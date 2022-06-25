# SYNTAX TEST "source.python"


# it "tokenizes async function definitions"
async def test(param):
# <- meta.function.python storage.modifier.async.python
#     ^^^ storage.type.function.python
#         ^^^^ entity.name.function.python
    pass


# it "tokenizes comments inside function parameters"
def test(arg, # comment')
# <- meta.function.python storage.type.function.python
#   ^^^^ entity.name.function.python
#       ^ punctuation.definition.parameters.begin.python
#        ^^^^^^^^^^^^^^^^ meta.function.parameters.python
#        ^^^ variable.parameter.function.python
#           ^ punctuation.separator.parameters.python
#             ^ comment.line.number-sign.python punctuation.definition.comment.python
#               ^^^^^^^ comment.line.number-sign.python
    ):
    pass


def __init__(
# <- meta.function.python storage.type.function.python
#   ^^^^^^^^ entity.name.function.python support.function.magic.python
#           ^ punctuation.definition.parameters.begin.python
    self,
#   ^^^^^ meta.function.parameters.python
#   ^^^^ variable.parameter.function.python
#       ^ punctuation.separator.parameters.python
    codec, # comment
#   ^^^^^^^^^^^^^^^^ meta.function.parameters.python
#   ^^^^^ variable.parameter.function.python
#        ^ punctuation.separator.parameters.python
#          ^ comment.line.number-sign.python punctuation.definition.comment.python
#            ^^^^^^^ comment.line.number-sign.python
    config
#   ^^^^^^ meta.function.parameters.python variable.parameter.function.python
# >> meta.function.python
):
# <- punctuation.definition.parameters.end.python
#^ punctuation.definition.function.begin.python
    pass


# it "tokenizes a function definition with annotations"
def f(a: None, b: int = 3) -> int:
# <- meta.function.python storage.type.function.python
#   ^ entity.name.function.python
#    ^ punctuation.definition.parameters.begin.python
#     ^^^^^^^^^^^^^^^^^^^ meta.function.parameters.python
#     ^ variable.parameter.function.python
#      ^ punctuation.separator.python
#        ^^^^ storage.type.python
#            ^ punctuation.separator.parameters.python
#              ^ variable.parameter.function.python
#               ^ punctuation.separator.python
#                 ^^^ storage.type.python
#                     ^ keyword.operator.assignment.python
#                       ^ constant.numeric.integer.decimal.python
#                        ^ punctuation.definition.parameters.end.python
#                          ^^ keyword.operator.function-annotation.python
#                             ^^^ storage.type.python
#                                ^ punctuation.definition.function.begin.python
    pass


# it "tokenizes complex function calls"
torch.nn.BCELoss()(Variable(bayes_optimal_prob, 1, requires_grad=False), Yvar).data[0]
#        ^^^^^^^^^ meta.method-call.python
#        ^^^^^^^ entity.name.function.python
#               ^ punctuation.definition.arguments.begin.bracket.round.python
#                ^ punctuation.definition.arguments.end.bracket.round.python
#                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ meta.function-call.python
#                 ^ punctuation.definition.arguments.begin.bracket.round.python
#                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ meta.function-call.arguments.python
#                  ^^^^^^^^ entity.name.function.python
#                          ^ punctuation.definition.arguments.begin.bracket.round.python
#                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ meta.function-call.arguments.python
#                                                  ^^^^^^^^^^^^^ variable.parameter.function.python
#                                                                ^^^^^ constant.language.python
#                                                                     ^ punctuation.definition.arguments.end.bracket.round.python
#                                                                      ^ punctuation.separator.arguments.python
#                                                                            ^ punctuation.definition.arguments.end.bracket.round.python
#                                                                             ^ punctuation.separator.property.period.python
