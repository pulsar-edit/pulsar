exports.activate = function () {
  if (!atom.grammars.addInjectionPoint) return;

  // TODO: Uncomment when performance is acceptable.
  
  // atom.grammars.addInjectionPoint('source.python', {
  //   type: 'string',
  //   language() {
  //     return 'hyperlink';
  //   },
  //   content(node) {
  //     return node;
  //   }
  // });
}
