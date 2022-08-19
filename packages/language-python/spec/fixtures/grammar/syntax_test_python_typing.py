# SYNTAX TEST "source.python"


def right_hand_split(
# <- storage.type.function
#   ^^^^^^^^^^^^^^^^ entity.name.function
#                   ^ punctuation.definition.parameters.begin
    line: Line, py36: bool = False, omit: Collection[LeafID] = ()
#   ^^^^ variable.parameter.function
#       ^ punctuation.separator
#         ^^^^ storage.type
#             ^ punctuation.separator.parameters
#               ^^^^ variable.parameter.function
#                   ^ punctuation.separator
#                     ^^^^ storage.type
#                          ^ keyword.operator.assignment
#                            ^^^^^ constant
#                                 ^ punctuation.separator.parameters
#                                   ^^^^ variable.parameter.function
#                                       ^ punctuation.separator
) -> Iterator[Line]:
#                  ^ punctuation.definition.function.begin
    pass
