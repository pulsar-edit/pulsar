# SYNTAX TEST "source.python"

test_int: int = 1
#         ^^^ support.storage.type.python
test_string: str = "Hello world!"
#            ^^^ support.storage.type.python
list_of_ints: list[int] = [1, 2, 3]
#             ^^^^ support.storage.type.generic.python
#                  ^^^ support.storage.type.python



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
