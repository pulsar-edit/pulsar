// @ts-nocheck
/* eslint-disable */

import json from './test.json' with { type: 'json' };
//                             ^^^^ keyword.control.with.ts

type World = "world";
// <- storage.type.ts
//   ^^^^^ support.storage.other.type.ts
//           ^^^^^^^ string.quoted.double.ts


type Greeting = `hello ${World}`;
//              ^^^^^^^^^^^^^^^^ string.quoted.backtick.ts
//                     ^^^^^^^^  meta.embedded.line.interpolation.ts
//                     ^^ punctuation.section.embedded.begin.ts
//                            ^ punctuation.section.embedded.end.ts
