
sym = :foo
# <- source.ruby
# <- variable.other.assignment.ruby
#     ^^^^ constant.other.symbol.ruby
#     ^ punctuation.definition.symbol.ruby

class Foo

  public
# ^^^^^^ keyword.other.special-method.public.ruby
  protected
# ^^^^^^^^^ keyword.other.special-method.protected.ruby
  private
# ^^^^^^^ keyword.other.special-method.private.ruby

  public def foo; end
# ^^^^^^ keyword.other.special-method.public.ruby
#        ^^^ keyword.control.def.ruby
#            ^^^ entity.name.function.ruby
#                 ^^^ keyword.control.end.ruby

  alias_method :name, :full_name
# ^^^^^^^^^^^^ keyword.other.pseudo-method.ruby


  alias name full_name
# ^^^^^ keyword.control.alias.ruby

  def new
    super
#   ^^^^^ keyword.control.pseudo-method.ruby
    undef foo
#   ^^^^^ keyword.control.undef.ruby    
  end

end

def wat(x)
  yield x if block_given?
# ^^^^^ keyword.control.yield.ruby
#         ^^ keyword.control.if.ruby
#            ^^^^^^^^^^^^ support.other.function.ruby
  return unless defined?(:thing)
# ^^^^^^ keyword.control.return.ruby
#        ^^^^^^ keyword.control.unless.ruby
#               ^^^^^^^^ keyword.other.defined.ruby


end
