const dedent = require('dedent');

describe('Tree-sitter HTML grammar', () => {
  beforeEach(async () => {
    atom.config.set('core.useTreeSitterParsers', true);
    atom.config.set('core.useLegacyTreeSitter', true);
    await atom.packages.activatePackage('language-html');
  });

  it('tokenizes punctuation in HTML tags and attributes', async () => {
    const editor = await atom.workspace.open(`test.html`);

    editor.setText(dedent`
      <html lang="en">
        <head>
          <meta charset='utf-8'>
          <meta name='"' content="This'll test single and double quotes.">
        </head>
        <body>
      </html>
    `);

    // Tag punctuation.
    expect(editor.scopeDescriptorForBufferPosition([0, 0]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.definition.tag.begin'
    );

    expect(editor.scopeDescriptorForBufferPosition([0, 15]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.definition.tag.end'
    );

    expect(editor.scopeDescriptorForBufferPosition([6, 0]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.definition.tag.begin'
    );

    expect(editor.scopeDescriptorForBufferPosition([6, 6]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.definition.tag.end'
    );

    // Attribute-value pair punctuation.
    expect(editor.scopeDescriptorForBufferPosition([0, 10]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.separator.key-value.html'
    );

    expect(editor.scopeDescriptorForBufferPosition([2, 18]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.definition.string.begin'
    );

    expect(editor.scopeDescriptorForBufferPosition([2, 24]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.definition.string.end'
    );

    // Ensure an attribute value delimited by single-quotes won't mark a
    // double-quote in the value as punctuation.
    expect(editor.scopeDescriptorForBufferPosition([3, 15]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.definition.string.begin'
    );

    expect(editor.scopeDescriptorForBufferPosition([3, 16]).toString()).toBe(
      '.text.html.basic .source.html .string.html'
    );

    expect(editor.scopeDescriptorForBufferPosition([3, 17]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.definition.string.end'
    );

    // Ensure an attribute value delimited by double-quotes won't mark a
    // single-quote in the value as punctuation.
    expect(editor.scopeDescriptorForBufferPosition([3, 27]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.definition.string.begin'
    );

    expect(editor.scopeDescriptorForBufferPosition([3, 32]).toString()).toBe(
      '.text.html.basic .source.html .string.html'
    );

    expect(editor.scopeDescriptorForBufferPosition([3, 66]).toString()).toBe(
      '.text.html.basic .source.html .punctuation.definition.string.end'
    );
  });
});
