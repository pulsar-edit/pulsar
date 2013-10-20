<?php

use foo,
    abc
    
// comment here

use foo; // blah

use foo as blah, 
    foo
    as other;

use foo as blah, // blah
    /* 
    foo
    , blah
    */
    // for stuff
    more, // for other stuff
    oneForHash, # test
    onemore,
    // one more
    last;

class Foo extends blah /* blah */ implements asdf, /* stuff */ another_one /* test */
    // foo
{
    function foo()
    {
        //assdf,asdf
    }
}

class Foo implements
    asdf, // more, goes, here
    /* stuff */
    another_one /* test */
    // foo
{
    function foo()
    {
        //assdf,asdf
    }
}
class Foo implements asdf
// comments
{
    function foo()
    {
        //assdf,asdf
    }
}

function foo(/* blah */ $bar, /* one */ array $foo, /* blah */ stdClass $another/*, ... */)
{
    // blah
}

function foo($bar/*, ... */) {
    // blah
}

function foo($bar = 12 /* test */) {}
function foo(array $bar = null/*, blah*/) {}
function foo(array $bar = array(1, 2, /* test */ 3) /* test */) {}

function foo(
    $bar // blah
) {
    // blah
}

function foo(
    $bar # blah
) {
    // blah
}

function foo(
    $foo, // blah
    $x = 2,               // for other stuff
    array $foo = array(), // for stuff
    stdClass $obj = null, // more
    stdClass $obj = null  # more
) {
    // stuff goes here
    do_stuff();
}