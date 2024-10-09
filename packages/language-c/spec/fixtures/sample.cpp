#include <string>
#include <iostream>

// THIS IS A COMMENT
// <- comment.line.double-slash
// <- punctuation.definition.comment

/* This is also a comment. */
// <- comment.block
// <- punctuation.definition.comment.begin
                        // ^^ punctuation.definition.comment.end

using std::string;
// <- keyword.control.using

#define FOO true
// <- keyword.control.directive.define
     // ^ constant.preprocessor.cpp
         // ^ constant.language.boolean.true

int table[4];
// <- support.storage.type.builtin
  //^ variable.other.declaration.cpp
      // ^ punctuation.definition.array.begin.bracket.square

int *ptr;   // ptr can point to an address which holds int data

class vulkan_instance {
// <- storage.type.class-type.cpp
//    ^ entity.name.class

public:
// <- storage.modifier.public
  int myNum;        // Attribute (int variable)
//^ support.storage.type.builtin.cpp
   // ^ variable.other.declaration.member
  string myString;  // Attribute (string variable)
  something foo;
  //^ support.storage.other.type
  int32_t bar;
  //^ support.storage.type.builtin.stdint

  ~vulkan_instance();
  // <- keyword.operator.destructor.cpp

  void some_function();
    // ^ entity.name.function.method
};
// <- punctuation.definition.block.end.bracket.curly
 // <- punctuation.terminator.statement
struct queue_family_indices {
//^ storage.type.struct.cpp
    // ^ entity.name.type.struct
};

int main() {
// <- support.storage.type.builtin
//  ^ entity.name.function.cpp
    std::cout << "Hello, \" World!";
    // ^ keyword.operator.accessor.namespace
           // ^ keyword.operator.bitwise.cpp
                      // ^ constant.character.escape.cpp
    return 0;
 // ^ keyword.control.return.cpp
        // ^ constant.numeric
}

int foo(int &bar) {
         // ^ keyword.operator.pointer
  // something
  bool x = true;
  bool y = false;
  if (x and y) {
     // ^ keyword.operator.logical.cpp
   //^ punctuation.definition.expression.begin.bracket.round.cpp
    // something

  }
  std::cout << myMax<int>(3, 7) << endl;
            // ^ support.other.function.cpp

  std::cout << foo::myMax<int>(3, 7) << endl;
                 // ^ support.other.function.cpp

  foo::bar();
    // ^ support.other.function.cpp
       // ^ punctuation.definition.begin.bracket.round
  return rand();
      // ^ support.function.c99.cpp
}

const char get_char() {
  return 'x';
      // ^ punctuation.definition.string.begin
      // ^^^ string.quoted.single.cpp
}

const char *get_string() {
  return "Hello, world!";
      // ^ punctuation.definition.string.begin
      // ^^^^^^^^^^^^^^^ string.quoted.double.cpp
}

void vulkan_instance::some_function () {
  // ^ support.other.namespace.cpp
                   // ^ entity.name.function
}

void foo::bar::baz () {
  // ^ support.other.namespace.cpp
       // ^ support.other.namespace.cpp
            // ^ entity.name.function

  vulkan_instance::some_function();
}

enum Color {
// <- storage.type.enum
  // ^ entity.name.type.enum.cpp
  red,
  // <- variable.declaration.enum
  green,
  // ^ meta.block.enum.cpp
  blue
};
Color r = red;
