# SYNTAX TEST "source.python"


def my_func(first, second=False, *third, **forth):
# <- storage.type.function
#   ^^^^^^^ entity.name.function
#          ^ punctuation.definition.parameters.begin
#           ^^^^^  ^^^^^^         ^^^^^    ^^^^^ variable.parameter.function
#                ^             ^       ^ punctuation.separator.parameters
#                        ^ keyword.operator.assignment
#                         ^^^^^ constant
#                                ^       ^^ keyword.operator.unpacking.arguments
#                                                ^ punctuation.definition.function.begin
    pass
