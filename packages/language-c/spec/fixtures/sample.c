#include <stdio.h>
// <- keyword.control.directive.include
      // ^ string.quoted.other.lt-gt.include

#define FOO true
// <- keyword.control.directive.define
     // ^ constant.preprocessor.c
         // ^ constant.language.boolean.true

int table[4];
// <- support.storage.type.builtin
  //^ variable.other.declaration.c
      // ^ punctuation.definition.array.begin.bracket.square

// THIS IS A COMMENT
// <- comment.line.double-slash
// <- punctuation.definition.comment

/* This is also a comment. */
// <- comment.block
// <- punctuation.definition.comment.begin
                        // ^^ punctuation.definition.comment.end

int main() {
// <- support.storage.type.builtin
  //^ entity.name.function
  printf("Hello,\" World!");
             // ^ constant.character.escape.c
  // <- support.function.c99
      // ^ string.quoted.double.c

  int32_t foo;
  // <- support.storage.type.builtin.stdint

  int valueA = 2;
  int valueB = 4;
          // ^ keyword.operator.assignment

  valueA++;
  //    ^ keyword.operator.increment.c

  int product = valueA * valueB;
   // ^ variable.other.declaration.c
                    // ^ keyword.operator.arithmetic

  return 0;
  // <- keyword.control.return
      // ^ constant.numeric.c
}
// <- punctuation.definition.block.end.bracket.curly

int foo() {
  // something
  bool x = true;
  bool y = false;
  if (x && y) {
     // ^ keyword.operator.logical.c
    // something
  }

  return rand();
      // ^ support.function.c99.c
}

const char get_char() {
  return 'x';
      // ^ punctuation.definition.string.begin
      // ^^^ string.quoted.single.c
}

const char *get_string() {
  return "Hello, world!";
      // ^ punctuation.definition.string.begin
      // ^^^^^^^^^^^^^^^ string.quoted.double.c
}

enum Color {
// <- storage.type.enum
  // ^ entity.name.type.enum.c
  red,
  // <- variable.declaration.enum
  green,
  // ^ meta.block.enum.c
  blue
};
enum Color r = red;

struct MyStructure {
// <- storage.type.struct.c
    // ^ entity.name.type.struct.c
  int myNum;
  char myLetter;
};
