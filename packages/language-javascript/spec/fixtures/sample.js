/* eslint-disable */
function diff(obj1, obj2, pathConverter) {
// ^ storage.type.function
      // ^ entity.name.function.definition
  if (!obj1 || typeof obj1 != 'object' || !obj2 || typeof obj2 != 'object') {
// ^ keyword.control.conditional.if
                                                // ^ keyword.operator.unary.typeof
    throw new Error('both arguments must be objects or arrays');
 // ^^^^^ keyword.control.trycatch.throw
       // ^ keyword.operator.new.js
                 // ^ punctuation.definition.string.begin
                 // ^ string.quoted.single
  }

  pathConverter ||
             // ^^ keyword.operator.logical
    (pathConverter = function (arr) {
                            // ^ variable.parameter
      return arr;
    });

  function getDiff({obj1, obj2, basePath, basePathForRemoves, diffs}) {
    var obj1Keys = Object.keys(obj1);
    //             ^ support.object.builtin
    //                    ^ support.function.builtin
    var obj1KeysLength = obj1Keys.length;
    //                 ^ keyword.operator.assignment
    var obj2Keys = Object.keys(obj2);
    var obj2KeysLength = obj2Keys.length;
    var path;

    var lengthDelta = obj1.length - obj2.length;
    //  ^ variable.other.assignment

    if (trimFromRight(obj1, obj2)) {
    // ^ punctuation.definition.begin.bracket.round
      for (var i = 0; i < obj1KeysLength; i++) {
        var key = Array.isArray(obj1) ? Number(obj1Keys[i]) : obj1Keys[i];
        if (!(key in obj2)) {
          path = basePathForRemoves.concat(key);
          diffs.remove.push({
            op: 'remove',
            path: pathConverter(path),
          });
        }
      }

      for (var i = 0; i < obj2KeysLength; i++) {
                                          // ^ punctuation.definition.end.bracket.round
        var key = Array.isArray(obj2) ? Number(obj2Keys[i]) : obj2Keys[i];
                                  //  ^ keyword.operator.ternary
                                                        //  ^ keyword.operator.ternary
        pushReplaces({
          key,
        // ^ entity.other.attribute-name.shorthand
          obj1,
          obj2,
          path: basePath.concat(key),
          // ^ entity.other.attribute-name.js
          pathForRemoves: basePath.concat(key),
          diffs,
        });
      }
    } else {
      // trim from left, objects are both arrays
      for (var i = 0; i < lengthDelta; i++) {
        path = basePathForRemoves.concat(i);
        diffs.remove.push({
          op: 'remove',
          path: pathConverter(path),
        });
      }

      // now make a copy of obj1 with excess elements left trimmed and see if there any replaces
      // ^ comment.line.double-slash.js
      var obj1Trimmed = obj1.slice(lengthDelta);
      for (var i = 0; i < obj2KeysLength; i++) {
        pushReplaces({
          key: i,
          obj1: obj1Trimmed,
          obj2,
          path: basePath.concat(i),
          // since list of removes are reversed before presenting result,
          // we need to ignore existing parent removes when doing nested removes
          pathForRemoves: basePath.concat(i + lengthDelta),
          diffs,
        });
      }
    }
  }
  var diffs = {remove: [], replace: [], add: []};
  getDiff({
    obj1,
    obj2,
    basePath: [],
    basePathForRemoves: [],
    diffs,
  });

  // reverse removes since we want to maintain indexes
  return diffs.remove
    .reverse()
    .concat(diffs.replace)
    .concat(diffs.add);

  function pushReplaces({key, obj1, obj2, path, pathForRemoves, diffs}) {
    var obj1AtKey = obj1[key];
    var obj2AtKey = obj2[key];

    let { bar, baz = 3 } = foo;
    //    ^ variable.other.assignment.destructuring
    //         ^ variable.other.assignment.destructuring

    if (!(key in obj1) && (key in obj2)) {
    //  ^ keyword.operator.logical
      var obj2Value = obj2AtKey;
      diffs.add.push({
        op: 'add',
        path: pathConverter(path),
        value: obj2Value,
      });
    } else if (obj1AtKey !== obj2AtKey) {
      if (Object(obj1AtKey) !== obj1AtKey ||
        Object(obj2AtKey) !== obj2AtKey || differentTypes(obj1AtKey, obj2AtKey)
                                        // ^ support.other.function
      ) {
        pushReplace(path, diffs, obj2AtKey);
      } else {
        if (!Object.keys(obj1AtKey).length &&
          !Object.keys(obj2AtKey).length &&
          String(obj1AtKey) != String(obj2AtKey)) {
          pushReplace(path, diffs, obj2AtKey);
        } else {
          getDiff({
            //    ^ punctuation.definition.object.begin.bracket.curly
            obj1: obj1[key],
            obj2: obj2[key],
            basePath: path,
            basePathForRemoves: pathForRemoves,
            diffs});
            //   ^ punctuation.definition.object.end.bracket.curly
        }
      }
    }
  }

  function pushReplace(path, diffs, newValue) {
    diffs.replace.push({
      op: 'replace',
      path: pathConverter(path),
      value: newValue,
    });
  }
}

let { three: alias = 3 } = foo;
          // ^ variable.other.assignment.destructuring
          // ^ !variable.parameter

function foo(bar, { three: alias = "foo" } = {}) {
         // ^ punctuation.definition.parameters.begin.bracket.round
                  // ^ entity.other.attribute-name
                          // ^ variable.parameter.destructuring.value
                          // ^ !variable.other.assignment
                                // ^ string.quoted.double
}

/* This is a block comment/ */
// <- punctuation.definition.comment.begin
// <- comment.block
                         // ^ punctuation.definition.comment.end

  /**
   * Does something very important.
   * @extends AnotherClass
   */
// ^ comment.block.documentation
class SomeClass extends AnotherClass {
   // ^ entity.name.type.class
                     // ^ entity.other.inherited-class
  instances = 0
//^ variable.other.assignment.property.public

  #wrappers = new Set()
//^ variable.other.assignment.property.private
               // ^ support.class.builtin.instance

  constructor() {
  // ^ entity.name.function.method.definition
    this.instances++;
 // ^ variable.language.this
     // ^ keyword.operator.accessor
       // ^ variable.other.assignment.property
               // ^ keyword.operator.increment
  }

  #foo() {
// ^ entity.name.function.method.private.definition
    let foo = 3;
    return `this is a template string with an interpolation ${foo} inside it`
        // ^ punctuation.definition.string.begin
        //  ^ string.quoted.template.js
                                                         // ^ punctuation.section.embedded.begin.js
                                                         //      ^ punctuation.section.embedded.end.js
  }

  *each () {
//^ storage.modifier.generator
// ^ entity.name.function.method.definition
    try {

    } catch (err) {
   // ^^^^^ keyword.control.trycatch.catch
          // ^^^ variable.other.assignment.catch
      debugger;
   // ^ keyword.other.debugger
    } finally {
   // ^ keyword.control.trycatch.finally
    }
  }
}

const PATH = path.dirname(__dirname);
// <- storage.type.const
          // ^ support.other.object
                       // ^ support.object.builtin.dirname

let cache = null;
         // ^ constant.language.null
const UNDEF = undefined;
           // ^ constant.language.undefined
module.exports = diff;
//^ support.object.builtin.module
                  // ^ punctuation.terminator.statement

/* eslint-enable */
