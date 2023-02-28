class Car < Vehicle
  # <- fold_begin.class
  #                 ^ fold_new_position.class
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
