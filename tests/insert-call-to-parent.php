<?php

// For "Insert Call to Parent"

// Typing "parent" and pressing tab on the following line should result in no special action

class FooBar
{
    public function test($foo, $bar = 123, array $arr = array(1, 2), Something_Else $blah = null)
    {
        // Typing "parent" and then pressing tab should result in:
        // parent::test($foo, $bar, $arr, $blah);
    }    

    public function &test2($foo2, $bar = 123, array $arr = array(1, 2), Something_Else $blah = null)
    {
        // This closure should not fool the code
        $x = function () { return 'foo'; };
        
        // parent::test2($foo2, $bar, $arr, $blah);
    }    

    public function &test3($foo3,
        $bar = 123,
        array $arr = array(1, 2),
        Something_Else $blah = null
    ) {
        // parent::test3($foo3, $bar, $arr, $blah);
    }    

    public function test4()
    {
        // parent::test4();
    }
}

// Typing "parent" and pressing tab here will generate a parent call for test4(), which is a known
// issue and limitation of the current implementation