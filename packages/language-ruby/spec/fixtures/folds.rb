class Car < Vehicle
  # <- fold_begin.class
  #                 ^ fold_new_position.class

  class << self
    # <- fold_begin.singleton_class
    #           ^ fold_new_position.singleton_class
  end
  # <- fold_end.singleton_class

  def self.something
    # <- fold_begin.singleton
    #                ^ fold_new_position.singleton
  end
  # <- fold_end.singleton

  def init(id)
    # <- fold_begin.method
    #          ^ fold_new_position.method
    {
    # <- fold_begin.hash
    # ^ fold_new_position.hash
      a: [
        #^ fold_begin.vector
        #  ^ fold_new_position.vector
        1,
        2,
        3
      ]
      # <- fold_end.vector
    }
    # <- fold_end.hash
  end
  # <- fold_end.method
end
# <- fold_end.class

if something
   # <- fold_begin.if
   #         ^ fold_new_position.if
  do_other_thing(
  )
end
# <- fold_end.if

# if something
# #  ^ fold_begin.if_else
#   do_other_thing()
#   # <- fold_new_position.if_else
# else
# # <- fold_end.if_else
# # # <- fold_begin.else
# # #   ^ fold_new_position.else
#   do_another()
# end
# # # <- fold_end.else

unless something
  #    ^ fold_begin.unless
  #              ^ fold_new_position.unless
  do_other_thing()
end
# <- fold_end.unless

# unless something
#   #    ^ fold_begin.unless_with_else
#   #              ^ fold_new_position.unless_with_else
#   do_other_thing()
# else
# # <- fold_end.unless_with_else
# # <- fold_begin.unless_else
# #    ^ fold_new_position.unless_else
#   we_should_never_do_this()
# end
# # <- fold_end.unless_else

call_something do
  #            ^ fold_begin.do_block
  #               ^ fold_new_position.do_block
  a
end
# <- fold_end.do_block

call_something {
  #            ^ fold_begin.inline_block
  #              ^ fold_new_position.inline_block
}
# <- fold_end.inline_block

multiline_call(
  #           ^ fold_begin.call
  #             ^ fold_new_position.call
  10,
  20
)
# <- fold_end.call

=begin
# <- fold_begin.multi_comment
#      ^ fold_new_position.multi_comment
  a
  b
  c
=end
# <- fold_end.multi_comment
