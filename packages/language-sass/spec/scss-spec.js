const dedent = require('dedent');

describe('Language sass', () => {
  beforeEach(async () => {
    atom.config.set('core.useTreeSitterParsers', false);
;
    await atom.packages.activatePackage('language-sass');
  });

  it('Should tokenize - as selector', async () => {
    const editor = await atom.workspace.open('foo.scss');

    editor.setText(dedent`
      .foo {
        @extend .foo-bar-baz;
      }`);

    expect(editor.scopeDescriptorForBufferPosition([1, 14]).toString()).toBe(
      '.source.css.scss .meta.property-list.scss .meta.at-rule.extend.scss .entity.other.attribute-name.class.css'
    );
  });
});
