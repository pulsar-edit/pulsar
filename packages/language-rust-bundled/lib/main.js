exports.activate = function() {
  for (const nodeType of ['macro_invocation', 'macro_rule']) {
    core.grammars.addInjectionPoint('source.rust', {
      type: nodeType,
      language() {
        return 'rust';
      },
      content(node) {
        return node.lastChild;
      },
      includeChildren: true
    });
  }
};
