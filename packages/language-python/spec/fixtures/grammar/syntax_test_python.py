# SYNTAX TEST "source.python"


def my_func(first, second=False, *third, **forth):
# <- storage.type.function
#   ^^^^^^^ entity.name.function
#          ^ punctuation.definition.parameters.begin
#           ^^^^^                                variable.parameter.function
#                  ^^^^^^                        variable.parameter.function
#                                 ^^^^^          variable.parameter.function
#                                          ^^^^^ variable.parameter.function
#                ^                       punctuation.separator.parameters
#                              ^         punctuation.separator.parameters
#                                      ^ punctuation.separator.parameters
#                        ^ keyword.operator.assignment
#                         ^^^^^ constant
#                                ^          keyword.operator.splat
#                                        ^^ keyword.operator.splat
#                                                ^ punctuation.definition.function
    pass
