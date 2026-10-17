// Test
// <- punctuation.definition.comment.begin
// ^^^^ comment.line

/* Test */
// <- punctuation.definition.comment.begin
// ^^^^^^ comment.block
//      ^^ punctuation.definition.comment.end

public class Test {
  public static void main(String[] args) {
    String test = """
    """;
//  ^^^ string.quoted.triple.block.java
//  ^^^ punctuation.definition.string.end
    System.out.println(test);
  }
}
