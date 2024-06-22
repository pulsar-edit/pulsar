const BodyParser = require('../lib/snippet-body-parser');

function expectMatch (input, tree) {
  expect(BodyParser.parse(input)).toEqual(tree);
}

describe("Snippet Body Parser", () => {
  it("parses a snippet with no special behavior", () => {
    const bodyTree = BodyParser.parse('${} $ n $}1} ${/upcase/} \n world ${||}');
    expect(bodyTree).toEqual([
      '${} $ n $}1} ${/upcase/} \n world ${||}'
    ]);
  });

  describe('for snippets with variables', () => {
    it('parses simple variables', () => {
      expectMatch('$f_o_0', [{variable: 'f_o_0'}]);
      expectMatch('$_FOO', [{variable: '_FOO'}]);
    });

    it('parses verbose variables', () => {
      expectMatch('${foo}', [{variable: 'foo'}]);
      expectMatch('${FOO}', [{variable: 'FOO'}]);
    });

    it('parses variables with placeholders', () => {
      expectMatch(
        '${f:placeholder}',
        [{variable: 'f', content: ['placeholder']}]
      );

      expectMatch(
        '${f:foo$1 $VAR}',
        [
          {
            variable: 'f',
            content: [
              'foo',
              {index: 1, content: []},
              ' ',
              {variable: 'VAR'}
            ]
          }
        ]
      );

      // Allows a colon as part of the placeholder value.
      expectMatch(
        '${TM_SELECTED_TEXT:foo:bar}',
        [
          {
            variable: 'TM_SELECTED_TEXT',
            content: [
              'foo:bar'
            ]
          }
        ]
      );
    });

    it('parses simple transformations like /upcase', () => {
      const bodyTree = BodyParser.parse("lorem ipsum ${CLIPBOARD:/upcase} dolor sit amet");
      expectMatch(
        "lorem ipsum ${CLIPBOARD:/upcase} dolor sit amet",
        [
          "lorem ipsum ",
          {
            variable: 'CLIPBOARD',
            substitution: {flag: 'upcase'}
          },
          " dolor sit amet"
        ]
      );
    });

    it('parses variables with transforms', () => {
      expectMatch('${f/.*/$0/}', [
        {
          variable: 'f',
          substitution: {
            find: /.*/,
            replace: [
              {backreference: 0}
            ]
          }
        }
      ]);
    });
  });


  describe('for snippets with tabstops', () => {
    it('parses simple tabstops', () => {
      expectMatch('hello$1world$2', [
        'hello',
        {index: 1, content: []},
        'world',
        {index: 2, content: []}
      ]);
    });

    it('parses verbose tabstops', () => {
      expectMatch('hello${1}world${2}', [
        'hello',
        {index: 1, content: []},
        'world',
        {index: 2, content: []}
      ]);
    });

    it('skips escaped tabstops', () => {
      expectMatch('$1 \\$2 $3 \\\\$4 \\\\\\$5 $6', [
        {index: 1, content: []},
        ' $2 ',
        {index: 3, content: []},
        ' \\',
        {index: 4, content: []},
        ' \\$5 ',
        {index: 6, content: []}
      ]);
    });

    describe('for tabstops with placeholders', () => {
      it('parses them', () => {
        expectMatch('hello${1:placeholder}world', [
          'hello',
          {index: 1, content: ['placeholder']},
          'world'
        ]);
      });

      it('allows escaped back braces', () => {
        expectMatch('${1:{}}', [
          {index: 1, content: ['{']},
          '}'
        ]);
        expectMatch('${1:{\\}}', [
          {index: 1, content: ['{}']}
        ]);
      });
    });

    it('parses tabstops with transforms', () => {
      expectMatch('${1/.*/$0/}', [
        {
          index: 1,
          content: [],
          substitution: {
            find: /.*/,
            replace: [{backreference: 0}]
          }
        }
      ]);
    });

    it('parses tabstops with choices', () => {
      expectMatch('${1|on}e,t\\|wo,th\\,ree|}', [
        {index: 1, content: ['on}e'], choice: ['on}e', 't|wo', 'th,ree']}
      ]);
    });

    it('parses if-else syntax', () => {
      expectMatch(
        '$1 ${1/(?:(wat)|^.*$)$/${1:+hey}/}',
        [
          {index: 1, content: []},
          " ",
          {
            index: 1,
            content: [],
            substitution: {
              find: /(?:(wat)|^.*$)$/,
              replace: [
                {
                  backreference: 1,
                  iftext: "hey",
                  elsetext: ""
                }
              ],
            },
          },
        ]
      );

      expectMatch(
        '$1 ${1/(?:(wat)|^.*$)$/${1:?hey:nah}/}',
        [
          {index: 1, content: []},
          " ",
          {
            index: 1,
            content: [],
            substitution: {
              find: /(?:(wat)|^.*$)$/,
              replace: [
                {
                  backreference: 1,
                  iftext: "hey",
                  elsetext: "nah"
                }
              ],
            },
          },
        ]
      );

      // else with `:` syntax
      expectMatch(
        '$1 ${1/(?:(wat)|^.*$)$/${1:fallback}/}',
        [
          {index: 1, content: []},
          " ",
          {
            index: 1,
            content: [],
            substitution: {
              find: /(?:(wat)|^.*$)$/,
              replace: [
                {
                  backreference: 1,
                  iftext: "",
                  elsetext: "fallback"
                }
              ],
            },
          },
        ]
      );


      // else with `:-` syntax; should be same as above
      expectMatch(
        '$1 ${1/(?:(wat)|^.*$)$/${1:-fallback}/}',
        [
          {index: 1, content: []},
          " ",
          {
            index: 1,
            content: [],
            substitution: {
              find: /(?:(wat)|^.*$)$/,
              replace: [
                {
                  backreference: 1,
                  iftext: "",
                  elsetext: "fallback"
                }
              ],
            },
          },
        ]
      );

    });

    it('parses alternative if-else syntax', () => {
      expectMatch(
        '$1 ${1/(?:(wat)|^.*$)$/(?1:hey:)/}',
        [
          {index: 1, content: []},
          " ",
          {
            index: 1,
            content: [],
            substitution: {
              find: /(?:(wat)|^.*$)$/,
              replace: [
                {
                  backreference: 1,
                  iftext: ["hey"],
                  elsetext: ""
                }
              ],
            },
          },
        ]
      );


      expectMatch(
        '$1 ${1/(?:(wat)|^.*$)$/(?1:\\u$1:)/}',
        [
          {index: 1, content: []},
          " ",
          {
            index: 1,
            content: [],
            substitution: {
              find: /(?:(wat)|^.*$)$/,
              replace: [
                {
                  backreference: 1,
                  iftext: [
                    {escape: 'u'},
                    {backreference: 1}
                  ],
                  elsetext: ""
                }
              ],
            },
          },
        ]
      );

      expectMatch(
        '$1 ${1/(?:(wat)|^.*$)$/(?1::hey)/}',
        [
          {index: 1, content: []},
          " ",
          {
            index: 1,
            content: [],
            substitution: {
              find: /(?:(wat)|^.*$)$/,
              replace: [
                {
                  backreference: 1,
                  iftext: "",
                  elsetext: ["hey"]
                }
              ],
            },
          },
        ]
      );

      expectMatch(
        'class ${1:${TM_FILENAME/(?:\\A|_)([A-Za-z0-9]+)(?:\\.rb)?/(?2::\\u$1)/g}} < ${2:Application}Controller\n  $3\nend',
        [
          'class ',
          {
            index: 1,
            content: [
              {
                variable: 'TM_FILENAME',
                substitution: {
                  find: /(?:\A|_)([A-Za-z0-9]+)(?:\.rb)?/g,
                  replace: [
                    {
                      backreference: 2,
                      iftext: '',
                      elsetext: [
                        {escape: 'u'},
                        {backreference: 1}
                      ]
                    }
                  ]
                }
              }
            ]
          },
          ' < ',
          {
            index: 2,
            content: ['Application']
          },
          'Controller\n  ',
          {index: 3, content : []},
          '\nend'
        ]
      );
    });

    it('recognizes escape characters in if/else syntax', () => {

      expectMatch(
        '$1 ${1/(?:(wat)|^.*$)$/${1:?hey\\:hey:nah}/}',
        [
          {index: 1, content: []},
          " ",
          {
            index: 1,
            content: [],
            substitution: {
              find: /(?:(wat)|^.*$)$/,
              replace: [
                {
                  backreference: 1,
                  iftext: "hey:hey",
                  elsetext: "nah"
                }
              ],
            },
          },
        ]
      );

      expectMatch(
        '$1 ${1/(?:(wat)|^.*$)$/${1:?hey:n\\}ah}/}',
        [
          {index: 1, content: []},
          " ",
          {
            index: 1,
            content: [],
            substitution: {
              find: /(?:(wat)|^.*$)$/,
              replace: [
                {
                  backreference: 1,
                  iftext: "hey",
                  elsetext: "n}ah"
                }
              ],
            },
          },
        ]
      );

    });


    it('parses nested tabstops', () => {
      expectMatch(
        '${1:place${2:hol${3:der}}}',
        [
          {
            index: 1,
            content: [
              'place',
              {index: 2, content: [
                'hol',
                {index: 3, content: ['der']}
              ]}
            ]
          }
        ]
      );

      expectMatch(
        '${1:${foo:${1}}}',
        [
          {
            index: 1,
            content: [
              {
                variable: 'foo',
                content: [
                  {
                    index: 1,
                    content: []
                  }
                ]
              }
            ]
          }
        ]
      );
    });
  });


  it("breaks a snippet body into lines, with each line containing tab stops at the appropriate position", () => {
    const bodyTree = BodyParser.parse(`\
the quick brown $1fox \${2:jumped \${3:over}
}the \${4:lazy} dog\
`
    );

    expect(bodyTree).toEqual([
      "the quick brown ",
      {index: 1, content: []},
      "fox ",
      {
        index: 2,
        content: [
          "jumped ",
          {index: 3, content: ["over"]},
          "\n"
        ],
      },
      "the ",
      {index: 4, content: ["lazy"]},
      " dog"
    ]);
  });


  it('handles a snippet with a transformed variable', () => {
    expectMatch(
      'module ${1:ActiveRecord::${TM_FILENAME/(?:\\A|_)([A-Za-z0-9]+)(?:\\.rb)?/\\u$1/g}}',
      [
        'module ',
        {
          index: 1,
          content: [
            'ActiveRecord::',
            {
              variable: 'TM_FILENAME',
              substitution: {
                find: /(?:\A|_)([A-Za-z0-9]+)(?:\.rb)?/g,
                replace: [
                  {escape: 'u'},
                  {backreference: 1}
                ]
              }
            }
          ]
        }
      ]
    );
  });

  it("skips escaped tabstops", () => {
    const bodyTree = BodyParser.parse("snippet $1 escaped \\$2 \\\\$3");
    expect(bodyTree).toEqual([
      "snippet ",
      {
        index: 1,
        content: []
      },
      " escaped $2 \\",
      {
        index: 3,
        content: []
      }
    ]);
  });

  it("includes escaped right-braces", () => {
    const bodyTree = BodyParser.parse("snippet ${1:{\\}}");
    expect(bodyTree).toEqual([
      "snippet ",
      {
        index: 1,
        content: ["{}"]
      }
    ]);
  });

  it("parses a snippet with transformations", () => {
    const bodyTree = BodyParser.parse("<${1:p}>$0</${1/f/F/}>");
    expect(bodyTree).toEqual([
      '<',
      {index: 1, content: ['p']},
      '>',
      {index: 0, content: []},
      '</',
      {index: 1, content: [], substitution: {find: /f/, replace: ['F']}},
      '>'
    ]);
  });

  it("parses a snippet with transformations and a global flag", () => {
    const bodyTree = BodyParser.parse("<${1:p}>$0</${1/f/F/g}>");
    expect(bodyTree).toEqual([
      '<',
      {index: 1, content: ['p']},
      '>',
      {index: 0, content: []},
      '</',
      {index: 1, content: [], substitution: {find: /f/g, replace: ['F']}},
      '>'
    ]);
  });

  it("parses a snippet with multiple tab stops with transformations", () => {
    const bodyTree = BodyParser.parse("${1:placeholder} ${1/(.)/\\u$1/g} $1 ${2:ANOTHER} ${2/^(.*)$/\\L$1/} $2");
    expect(bodyTree).toEqual([
      {index: 1, content: ['placeholder']},
      ' ',
      {
        index: 1,
        content: [],
        substitution: {
          find: /(.)/g,
          replace: [
            {escape: 'u'},
            {backreference: 1}
          ]
        }
      },
      ' ',
      {index: 1, content: []},
      ' ',
      {index: 2, content: ['ANOTHER']},
      ' ',
      {
        index: 2,
        content: [],
        substitution: {
          find: /^(.*)$/,
          replace: [
            {escape: 'L'},
            {backreference: 1}
          ]
        }
      },
      ' ',
      {index: 2, content: []},
    ]);
  });


  it("parses a snippet with transformations and mirrors", () => {
    const bodyTree = BodyParser.parse("${1:placeholder}\n${1/(.)/\\u$1/g}\n$1");
    expect(bodyTree).toEqual([
      {index: 1, content: ['placeholder']},
      '\n',
      {
        index: 1,
        content: [],
        substitution: {
          find: /(.)/g,
          replace: [
            {escape: 'u'},
            {backreference: 1}
          ]
        }
      },
      '\n',
      {index: 1, content: []}
    ]);
  });

  it("parses a snippet with a format string and case-control flags", () => {
    const bodyTree = BodyParser.parse("<${1:p}>$0</${1/(.)(.*)/\\u$1$2/g}>");
    expect(bodyTree).toEqual([
      '<',
      {index: 1, content: ['p']},
      '>',
      {index: 0, content: []},
      '</',
      {
        index: 1,
        content: [],
        substitution: {
          find: /(.)(.*)/g,
          replace: [
            {escape: 'u'},
            {backreference: 1},
            {backreference: 2}
          ]
        }
      },
      '>'
    ]);
  });

  it("parses a snippet with an escaped forward slash in a transform", () => {
    // Annoyingly, a forward slash needs to be double-backslashed just like the
    // other escapes.
    const bodyTree = BodyParser.parse("<${1:p}>$0</${1/(.)\\/(.*)/\\u$1$2/g}>");
    expect(bodyTree).toEqual([
      '<',
      {index: 1, content: ['p']},
      '>',
      {index: 0, content: []},
      '</',
      {
        index: 1,
        content: [],
        substitution: {
          find: /(.)\/(.*)/g,
          replace: [
            {escape: 'u'},
            {backreference: 1},
            {backreference: 2}
          ]
        }
      },
      '>'
    ]);
  });

  it("parses a snippet with a placeholder that mirrors another tab stop's content", () => {
    const bodyTree = BodyParser.parse("$4console.${3:log}('${2:$1}', $1);$0");
    expect(bodyTree).toEqual([
      {index: 4, content: []},
      'console.',
      {index: 3, content: ['log']},
      '(\'',
      {
        index: 2, content: [
          {index: 1, content: []}
        ]
      },
      '\', ',
      {index: 1, content: []},
      ');',
      {index: 0, content: []}
    ]);
  });

  it("parses a snippet with a placeholder that mixes text and tab stop references", () => {
    const bodyTree = BodyParser.parse("$4console.${3:log}('${2:uh $1}', $1);$0");
    expect(bodyTree).toEqual([
      {index: 4, content: []},
      'console.',
      {index: 3, content: ['log']},
      '(\'',
      {
        index: 2, content: [
          'uh ',
          {index: 1, content: []}
        ]
      },
      '\', ',
      {index: 1, content: []},
      ');',
      {index: 0, content: []}
    ]);
  });
});
