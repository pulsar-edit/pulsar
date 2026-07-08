# SYNTAX TEST "source.python"

# f-strings (baseline) and t-strings (PEP 750) should be highlighted the same
# way: a format string with interpolations.

x = f"hi {name}"
#   ^ storage.type.string.python
#     ^ string.quoted.double.single-line.format.python
#        ^ punctuation.section.embedded.begin.python
#             ^ punctuation.section.embedded.end.python

y = t"hi {name}"
#   ^ storage.type.string.python
#     ^ string.quoted.double.single-line.format.python
#        ^ punctuation.section.embedded.begin.python
#             ^ punctuation.section.embedded.end.python

w = t'x {y}'
#   ^ storage.type.string.python
#     ^ string.quoted.single.single-line.format.python
#       ^ punctuation.section.embedded.begin.python
#         ^ punctuation.section.embedded.end.python

v = t"""a {b}"""
#   ^ storage.type.string.python
#        ^ string.quoted.triple.block.format.python
#         ^ punctuation.section.embedded.begin.python
#           ^ punctuation.section.embedded.end.python
