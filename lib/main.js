exports.activate = function () {
  if (!atom.grammars.addInjectionPoint) return

  atom.grammars.addInjectionPoint('source.c', {
    type: 'preproc_arg',
    language (arg) { return 'c' },
    content (arg) { return arg }
  })

  atom.grammars.addInjectionPoint('source.cpp', {
    type: 'preproc_arg',
    language (arg) { return 'cpp' },
    content (arg) { return arg }
  })
}
