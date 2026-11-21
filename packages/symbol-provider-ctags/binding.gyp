{
  # Builds Exuberant Ctags 5.8 as a standalone executable (not a Node addon).
  # node-gyp is used only because every Pulsar build environment already has
  # it and a working C toolchain; it also builds for the right architecture.
  #
  # Output: build/Release/ctags (ctags.exe on Windows).
  'targets': [
    {
      'target_name': 'ctags',
      'type': 'executable',
      'include_dirs': ['vendor/ctags/src'],
      # Mirrors SOURCES in ctags 5.8's source.mak.
      'sources': [
        'vendor/ctags/src/args.c',
        'vendor/ctags/src/ant.c',
        'vendor/ctags/src/asm.c',
        'vendor/ctags/src/asp.c',
        'vendor/ctags/src/awk.c',
        'vendor/ctags/src/basic.c',
        'vendor/ctags/src/beta.c',
        'vendor/ctags/src/c.c',
        'vendor/ctags/src/cobol.c',
        'vendor/ctags/src/dosbatch.c',
        'vendor/ctags/src/eiffel.c',
        'vendor/ctags/src/entry.c',
        'vendor/ctags/src/erlang.c',
        'vendor/ctags/src/flex.c',
        'vendor/ctags/src/fortran.c',
        'vendor/ctags/src/get.c',
        'vendor/ctags/src/html.c',
        'vendor/ctags/src/jscript.c',
        'vendor/ctags/src/keyword.c',
        'vendor/ctags/src/lisp.c',
        'vendor/ctags/src/lregex.c',
        'vendor/ctags/src/lua.c',
        'vendor/ctags/src/main.c',
        'vendor/ctags/src/make.c',
        'vendor/ctags/src/matlab.c',
        'vendor/ctags/src/ocaml.c',
        'vendor/ctags/src/options.c',
        'vendor/ctags/src/parse.c',
        'vendor/ctags/src/pascal.c',
        'vendor/ctags/src/perl.c',
        'vendor/ctags/src/php.c',
        'vendor/ctags/src/python.c',
        'vendor/ctags/src/read.c',
        'vendor/ctags/src/rexx.c',
        'vendor/ctags/src/routines.c',
        'vendor/ctags/src/ruby.c',
        'vendor/ctags/src/scheme.c',
        'vendor/ctags/src/sh.c',
        'vendor/ctags/src/slang.c',
        'vendor/ctags/src/sml.c',
        'vendor/ctags/src/sort.c',
        'vendor/ctags/src/sql.c',
        'vendor/ctags/src/strlist.c',
        'vendor/ctags/src/tcl.c',
        'vendor/ctags/src/tex.c',
        'vendor/ctags/src/verilog.c',
        'vendor/ctags/src/vhdl.c',
        'vendor/ctags/src/vim.c',
        'vendor/ctags/src/yacc.c',
        'vendor/ctags/src/vstring.c'
      ],
      'conditions': [
        ['OS=="mac"', {
          'defines': ['HAVE_CONFIG_H'],
          'include_dirs': ['vendor/ctags/config/darwin']
        }],
        ['OS=="linux"', {
          'defines': ['HAVE_CONFIG_H'],
          'include_dirs': ['vendor/ctags/config/linux']
        }],
        ['OS=="win"', {
          # Mirrors REGEX_DEFINES/DEFINES/INCLUDES in ctags 5.8's mk_mvc.mak.
          # MSVC has no regcomp(), so use the bundled GNU regex.
          'defines': [
            'WIN32',
            'HAVE_REGCOMP',
            '__USE_GNU',
            'bool=int',
            'false=0',
            'true=1',
            'strcasecmp=stricmp'
          ],
          'include_dirs': ['vendor/ctags/src/gnu_regex'],
          'sources': ['vendor/ctags/src/gnu_regex/regex.c']
        }]
      ]
    }
  ]
}
