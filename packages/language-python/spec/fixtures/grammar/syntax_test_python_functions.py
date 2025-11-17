# SYNTAX TEST "source.python"


# it "tokenizes async function definitions"
async def test(param):
# <- keyword.control.statement.async.python
#     ^^^ storage.type.function.python
#         ^^^^ entity.name.function.python
    pass


# it "tokenizes comments inside function parameters"
def test(arg, # comment')
# <- storage.type.function.python
#   ^^^^ entity.name.function.python
#       ^ punctuation.definition.parameters.begin
#        ^^^ variable.parameter.function.python
#           ^ punctuation.separator.parameters.comma.python
#             ^ comment.line.number-sign.python
#             ^ punctuation.definition.comment.python
#               ^^^^^^^ comment.line.number-sign.python
    ):
    pass


def __init__(
# <- storage.type.function.python
#   ^^^^^^^^ entity.name.function.magic.python
#           ^ punctuation.definition.parameters.begin
    self,
#   ^^^^^ meta.function.parameters.python
#   ^^^^ variable.parameter.function.python
#   ^^^^ variable.language.self.python
#       ^ punctuation.separator.parameters.comma.python
    codec, # comment
#   ^^^^^ variable.parameter.function.python
#        ^ punctuation.separator.parameters.comma.python
#          ^ comment.line.number-sign.python
#          ^ punctuation.definition.comment.python
#            ^^^^^^^ comment.line.number-sign.python
    config
#   ^^^^^^ meta.function.parameters.python
#   ^^^^^^ variable.parameter.function.python
# >> meta.function.python
):
# <- punctuation.definition.parameters.end
#^ punctuation.definition.function.colon.python
    pass


# it "tokenizes a function definition with annotations"
def f(a: None, b: int = 3) -> int:
# <- storage.type.function.python
#   ^ entity.name.function.python
#    ^ punctuation.definition.parameters.begin
#     ^^^^^^^^^^^^^^^^^^^ meta.function.parameters.python
#     ^ variable.parameter.function.python
#      ^ punctuation.separator.type-annotation.python
#        ^^^^ support.storage.type.python
#        ^^^^ constant.builtin.none.python
#            ^ punctuation.separator.parameters.comma.python
#              ^ variable.parameter.function.python
#               ^ punctuation.separator.type-annotation.python
#                 ^^^ support.storage.type.python
#                     ^ keyword.operator.assignment.python
#                       ^ constant.numeric.integer.python
#                        ^ punctuation.definition.parameters.end
#                          ^^ keyword.operator.function-annotation.python
#                             ^^^ support.storage.type.python
#                                ^ punctuation.definition.function.colon.python
    pass


# it "tokenizes complex function calls"
torch.nn.BCELoss()(Variable(bayes_optimal_prob, 1, requires_grad=False), Yvar).data[0]
#        ^^^^^^^ support.type.constructor.python
#               ^ punctuation.definition.arguments.begin.bracket.round.python
#                ^ punctuation.definition.arguments.end.bracket.round.python
#                 ^ punctuation.definition.arguments.begin.bracket.round.python
#                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ meta.function-call.arguments.python
#                  ^^^^^^^^ support.type.constructor.python
#                          ^ punctuation.definition.arguments.begin.bracket.round.python
#                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ meta.function-call.arguments.python
#                                                  ^^^^^^^^^^^^^ variable.parameter.function.python
#                                                                ^^^^^ constant.builtin.false.python
#                                                                     ^ punctuation.definition.arguments.end.bracket.round.python
#                                                                      ^ punctuation.separator.arguments.comma.python
#                                                                            ^ punctuation.definition.arguments.end.bracket.round.python
#                                                                             ^ keyword.operator.accessor.python
