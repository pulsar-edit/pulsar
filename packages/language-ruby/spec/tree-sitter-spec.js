const dedent = require('dedent')

describe('Tree-sitter Ruby grammar', () => {
  beforeEach(async () => {
    atom.config.set('core.useTreeSitterParsers', true)
    await atom.packages.activatePackage('language-ruby')
  })

  it('tokenizes symbols', async () => {
    const editor = await atom.workspace.open('foo.rb')

    editor.setText(dedent`
      :foo
      %i(foo)
    `)

    expect(editor.scopeDescriptorForBufferPosition([0, 1]).toString()).toBe(
      '.source.ruby .constant.other.symbol'
    )

    expect(editor.scopeDescriptorForBufferPosition([1, 3]).toString()).toBe(
      '.source.ruby .constant.other.symbol'
    )
  })

  it('tokenizes visibility modifiers', async () => {
    const editor = await atom.workspace.open('foo.rb')

    editor.setText(dedent`
      public
      protected
      private

      public def foo; end
      protected def bar; end
      private def baz; end
    `)

    expect(editor.scopeDescriptorForBufferPosition([0, 0]).toString()).toBe(
      '.source.ruby .keyword.other.special-method'
    )
    expect(editor.scopeDescriptorForBufferPosition([1, 0]).toString()).toBe(
      '.source.ruby .keyword.other.special-method'
    )
    expect(editor.scopeDescriptorForBufferPosition([2, 0]).toString()).toBe(
      '.source.ruby .keyword.other.special-method'
    )
    expect(editor.scopeDescriptorForBufferPosition([4, 0]).toString()).toBe(
      '.source.ruby .keyword.other.special-method'
    )
    expect(editor.scopeDescriptorForBufferPosition([5, 0]).toString()).toBe(
      '.source.ruby .keyword.other.special-method'
    )
    expect(editor.scopeDescriptorForBufferPosition([6, 0]).toString()).toBe(
      '.source.ruby .keyword.other.special-method'
    )
  })

  it('tokenizes keyword predicates', async () => {
    const editor = await atom.workspace.open('foo.rb')

    editor.setText(dedent`
      defined?(:thing)
      block_given?
      iterator?
    `)

    expect(editor.scopeDescriptorForBufferPosition([0, 0]).toString()).toBe(
      '.source.ruby .keyword.control'
    )
    expect(editor.scopeDescriptorForBufferPosition([1, 0]).toString()).toBe(
      '.source.ruby .keyword.control'
    )
    expect(editor.scopeDescriptorForBufferPosition([2, 0]).toString()).toBe(
      '.source.ruby .keyword.control'
    )
  })

  it('tokenizes alias definitions', async () => {
    const editor = await atom.workspace.open('foo.rb')

    editor.setText(dedent`
      alias_method :name, :full_name
      alias name full_name
    `)

    expect(editor.scopeDescriptorForBufferPosition([0, 0]).toString()).toBe(
      '.source.ruby .keyword.control'
    )
    expect(editor.scopeDescriptorForBufferPosition([1, 0]).toString()).toBe(
      '.source.ruby .keyword.control'
    )
  })

  it('tokenizes keywords', async () => {
    const editor = await atom.workspace.open('foo.rb')

    editor.setText(dedent`
      super
      undef foo
    `)

    expect(editor.scopeDescriptorForBufferPosition([0, 0]).toString()).toBe(
      '.source.ruby .keyword.control'
    )

    expect(editor.scopeDescriptorForBufferPosition([1, 0]).toString()).toBe(
      '.source.ruby .keyword.control'
    )
  })

  it('tokenizes variable in assignment expressions', async () => {
    const editor = await atom.workspace.open('foo.rb')
    editor.setText(dedent`
      a = 10
    `)

    expect(editor.scopeDescriptorForBufferPosition([0, 0]).toString()).toBe(
      '.source.ruby .variable'
    )
  })

  it('does not tokenizes method call in assignment expressions', async () => {
    const editor = await atom.workspace.open('foo.rb')
    editor.setText(dedent`
      foo() = 10
    `)

    expect(editor.scopeDescriptorForBufferPosition([0, 0]).toString()).not.toBe(
      '.source.ruby .variable'
    )
  })
})
