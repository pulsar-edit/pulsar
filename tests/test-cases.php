<?php

/**
 * Code snippets designed to stress the PHP grammar
 *
 * This is admittedly a mess, and many of the lines aren't actually valid. I'm just trying to test
 * that certain things happen in a more sane fashion than others. This will definitely be cleaned up
 * in the future.
 */

//
// Namespaces & Classes
//
namespace blah;
namespace one_two;
namespace one_two\three_four;
namespace blah\one\two;

// Respond sanely here, despite the parse error
namespace noend

// Handle blocks
namespace block {

}

namespace block
{

}

namespace 123; // Invalid namespace

use 123\123; // Invalid
use foo as 123; // Invalid
use foo\bar; use bar\foo;

// Invalid (missing semicolon)
use \foo\bar

use \foo\bar\baz;

use \foo\bar,
    \bar\foo,
    blah_foo\foo,
    one\more_time\forKicks;

use \foo\bar as blah, // test
    // Test
    \bar\foo as asdf, // test
    /* Test */
    blah_foo\foo as fdsa,
    one\more_time\forKicks as lkajsdf; // test


namespace one\more
{
    use \foo\bar;
}

class Foo
{
    public $bar;
    protected $_blah;
    private $_test;
    public static $bar;
    protected static $_blah;
    private static $_test;
    static public $bar;
    static protected $_blah;
    static private $_test;
    static $bar;
    static $_blah;
    static $_test;
}

class Foo extends Bar
{
}

class Foo extends foo\Bar
{
}

class Foo implements Bar
{
}

class Foo implements foo\Bar
{
}

class Foo extends foo\Bar implements foo\Bar
{
    public static $blah;

    public function blah()
    {
        shouldNotShowInSymbols();
    }

    public static function blah()
    {

    }

    static protected function blah()
    {

    }
}

abstract class Foo;
abstract class Foo {}

abstract class Foo extends Bar;
abstract class Foo extends Bar {}

abstract class Foo extends foo\Bar;
abstract class Foo extends foo\Bar {}

interface Foo
{
}

interface Foo extends Bar
{
}

interface Foo extends foo\blah\Bar
{
}

// =============
// = Functions =
// =============
function test()
function test($foo, $foo = 1, &$foo = array(), &$foo = array(1, "2", "3", 4))
function test(array $foo = array(1, "2", "3", 4), array &$foo = array(), array $foo = null, array $foo = invalid)
function test(array $foo)
function test(stdClass $foo)
function test(foo\bar\blah $foo)
function test(stdClass $foo = null)
function &test(stdClass $foo = invalid)

$blah = function (stdClass $foo = invalid, array $blah = array()) {

};

$blah = function (stdClass $foo = invalid, array $blah) use (&$foo, $bar) {
    $test = 'test';
};

$arr = array(
    'blah' => function (stdClass $foo = invalid, array $blah) use (&$foo, $bar) {
        $test = 'test';
    }
);

$blah();
$blah(1, 2, 3);
blah(1, 2, 3);

$blah = new Foo();
$blah = new Foo;
$blah = new \blah\Foo();
$blah = new blah\Foo();
$blah = new $foo();
$blah = new $foo;
$blah = new blah\$Foo();

Foo::bar(new test());
Foo::bar(new test);
blah\Foo::bar(new blah\test());

// ========================
// = String interpolation =
// ========================
'$foo'
'\''
'\\'
"1\1111"
"1\x111"
"$foo"
"$foo[bar]" // 'bar' is treated as a string automatically by PHP
"{$foo[bar]}" // 'bar' is treated as a *constant*
"$foo[0]"
"$foo[$bar]"
"$foo->bar"
"$foo->bar(" // Should show as access to property ->bar, not as a call to ->bar()
"$foo->$bar" // Should not show as an object property access, but as two separate variables
"{$foo->$bar}"
"{$foo->{$bar}}"
"{$foo->${bar}}"
"{$foo->{$bar . $baz}}"
"{$foo->bar}"
"{$foo->bar[0]->baz}"
"{$foo->bar(12, $foo)}"
"{$foo(12, $foo)}"

$foo = $foo->{'foo' . 'bar'};
$foo = $foo->{"foo{$bar}"};

$beer = 'Heineken';
echo "$beer's taste is great"; // works; "'" is an invalid character for variable names
echo "He drank some $beers";   // won't work; 's' is a valid character for variable names but the variable is "$beer"
echo "He drank some ${beer}s"; // works
echo "He drank some {$beer}s"; // works

// The text "($str[1" should *not* be highlighted as a syntax error.
$str = array("Foo", "Bar");
echo 'Name: ' . $str[($str[1]) ? 1 : 0]; // Should echo "Name: Bar"
echo "Name: {$str[($str[1]) ? 1 : 0]}"; // Should echo "Name: Bar"

echo "{\$";
echo "$foo";
echo "$_SERVER[foo]";
echo "{$_SERVER['foo']}";
echo "{$foo}";
echo "${foo}"; // 'foo' should be variable.other.php
echo "$foo->${bar}"; // '->' should not be keyword.operator.class.php
echo "This works: " . $arr['foo'][3];
echo "This works too: {$obj->values[3]->name}";
echo "This is the value of the var named $name: {${$name}}";
echo "This is the value of the var named by the return value of getName(): {${getName()}}";
echo "Blah: {${Foo::bar()}}";

$blah = $foo[123];
$blah = $foo[$bar];
$blah = $foo[bar()];
$blah = $foo->bar(123);
$blah = ${'foo'};

$blah = $foo[123];
$blah = $_POST['blah'];
$blah = new $_POST['blah'];
$blah = new $foo;
$blah = new $foo->{$bar};
$blah = new $foo->{$bar . '123'};
$blah = new $foo->{${bar()}};

$bar = array(
    '123' => '321',
);
$x = 2;

echo 'foo ' . $bar['1' . $x . '3'];
echo 'foo ' . $bar["1{$x}3"];
echo "foo {$bar["1{$x}3"]}";

// Heredoc
$foo = <<<BLAH
Blah blah $foo blah {$foo->bar}
Stuff goes here
BLAH;

// Nowdoc (no interpolation should occur here)
$foo = <<<'BLAH'
Blah blah $foo blah {$foo->bar}
Stuff goes here
BLAH;

namespace foo\bar;

E_ERROR
E_DEPRECATED
E_NOTICE
E_COMPILE_ERROR
E_PARSE
E_USER_DEPRECATED
__FILE__
__DIR__
__NAMESPACE__
CURRENCY_SYMBOL
\CURRENCY_SYMBOL
foo\CURRENCY_SYMBOL
E_ERROR
\E_ERROR
foo\E_ERROR

array_map();
array_map($test, 'foo', MY_CONST);
\array_map();
blah\array_map();
namespace\array_map($test, 'foo');

// `namespace` should not be highlighted as a namespace component but rather as an operator like
// `self` or `static`
\foo\blah();
namespace\foo();
$blah = new foo();
$blah = new foo\bar();
$blah = new foo\bar\();
$blah = new namespace\Foo();
$blah = new self\Foo();
$foo->bar();

// `self` and `static` should be storage.type.php
self::foo();
static::foo();
    static::foo();
    parent::foo();
Blah::foo();
\foo\Blah::foo();

$foo = self::BAR;
$foo = static::BAR;
$foo = self::$bar;
$foo = static::$bar;

static::${$test} = 'test';
Blah::${$test} = 'test';
\foo\Blah::${$test} = 'test';
${$test} = 'test';

new self(); // `self` should highlight differently
new static(); // `static` should highlight differently
new Blah();

goto foo;

foo:

goto blah;

blah: {

}


// =======
// = SQL =
// =======

// This looks like a mess, but there are quite a few ways you can trick the grammar here, and the
// following lines know all the tricks.

'SELECT * from foo WHERE bar = \'foo \\ ' . $foo . ' AND blah';
'SELECT * from foo WHERE bar = \'foo \\ ' . $foo . " AND blah";
'SELECT * from foo WHERE bar = "foo" asdas' . $foo . '" asdasd';

"SELECT \"$foo\" FROM bar";
"SELECT `$foo` FROM bar";
"SELECT '$foo' FROM bar";
'SELECT \'$foo\' FROM bar';
'SELECT `$foo` FROM bar';
'SELECT "$foo" FROM bar';
"SELECT * from foo WHERE bar = 'asd $foo $foo->bar {$foo->bar[12]} asda'  'unclosed string";
"SELECT * from foo WHERE bar = \"dsa$foo\" \"unclosed string";
'SELECT * from foo WHERE bar = "unclosed string';

'SELECT * from foo WHERE bar = ' . $foo . ' bar" AND foo = 1';
'SELECT * from foo WHERE bar = ' . ' bar" AND foo = 1';

'SELECT * from foo WHERE bar = "foo \" ' . $foo . ' bar" AND foo = 1';

'SELECT * FROM `foo' . $bar . '` WHERE foo = 1' . fasdf('asdf') . ' AND other = "blah"';
"SELECT * FROM `foo" . $bar . "` WHERE foo = 1";
"SELECT * FROM `foo` WHERE foo = 'blah" . $x . "' AND other = 'stuff'";
"SELECT * FROM `foo` WHERE foo = '{$xblah}" . "' AND other = 'stuff'";
// Something

'SELECT * FROM \` blah';
"SELECT * FROM `foo` WHERE foo = \"blah" . $x . "\" AND other = 'stuff'";
'SELECT * FROM `foo` WHERE foo = "blah' . '" AND other = "stuff"';
'SELECT * FROM `foo` WHERE foo = "blah' . $x . '" AND other = "stuff"';
"SELECT * FROM \``foo" . $bar . "` WHERE foo = 'blah'";
"SELECT * FROM \"foo" . $bar . "baz\" WHERE foo = 'blah'";
"SELECT * FROM `foo" . $bar . "baz` WHERE foo = 'blah'";
"SELECT * FROM 'foo" . $bar . "baz' WHERE foo = 'blah'";
'SELECT * FROM \'foo' . $bar . 'baz\' WHERE foo = "blah"';
'SELECT * FROM `foo' . $bar . 'baz` WHERE foo = "blah"';
'SELECT * FROM "foo' . $bar . 'baz" WHERE foo = "blah"';
'SELECT * FROM "foo' . ($bar) . 'baz" WHERE foo = "blah"';
('SELECT * FROM "foo') . ($bar) . 'baz" WHERE foo = "blah"';
'SELECT * FROM foo' . $bar + 1 . 'baz WHERE foo = "blah"');
'SELECT * FROM foo WHERE blah = "blah"';
'SELECT * FROM `foo` WHERE blah = "blah"';
'SELECT * FROM `f\`' . 'oo` WHERE blah = "blah"';
'SELECT * FROM `f\` asd`f \` asdf`' . 'oo` WHERE blah = "blah"';
'SELECT * FROM `foo` WHERE blah = "bl\"' . 'ah"';
"SELECT * FROM foo WHERE blah = 'blah'";
"SELECT * FROM foo WHERE blah = 'bl\'" . "ah'";
"SELECT * FROM `foo` WHERE blah = 'blah'";
"SELECT * FROM `f\`" . "oo` WHERE blah = 'blah'";
// Comments

'SELECT * FROM # foo bar \' asdassdsaas';
'SELECT * FROM -- foo bar \' asdassdsaas';
"SELECT * FROM # foo bar \" asdassdsaas";
"SELECT * FROM -- foo bar \" asdassdsaas";


$foo = new Bar();

$mode = PDO::FETCH_ASSOC;
$mode = \PDO::FETCH_ASSOC;
$mode = namespace\PDO::FETCH_ASSOC;
$blah = \stuff\PDO::FETCH_ASSOC;
$more = stuff\PDO::FETCH_ASSOC;
$blah = \stuff\more\PDO::FETCH_ASSOC;
$more = stuff\more\PDO::FETCH_ASSOC;
$blah = $blah::FETCH_ASSOC;
$blah = \blah\$blah::FETCH_ASSOC;
$blah = \blah\$blah\foo\$blah::FETCH_ASSOC;

$mode = PDO::$prop;
$mode = \PDO::$prop;
$mode = namespace\PDO::$prop;
$blah = \stuff\PDO::$prop;
$more = stuff\PDO::$prop;
$blah = \stuff\more\PDO::$prop;
$more = stuff\more\PDO::$prop;

$mode = PDO::staticMethod();
$mode = \PDO::staticMethod();
$mode = namespace\PDO::staticMethod();
$blah = \stuff\PDO::staticMethod();
$more = stuff\PDO::staticMethod();
$blah = \stuff\more\PDO::staticMethod();
$more = stuff\more\PDO::staticMethod();
$blah = $foo::staticMethod();
$blah = ($foo::staticMethod());
$blah = ( $foo::staticMethod());

$mode = funcCall();
$mode = \funcCall();
$mode = namespace\funcCall();
$blah = \stuff\funcCall();
$more = stuff\funcCall();
$blah = \stuff\more\funcCall();
$more = stuff\more\funcCall();

$blah = $foo->test;
$blah = foo->test;
$blah = ${'foo'}->test;

// When type hinting:
class Test {
    public function __construct(\My\Namespace\MyClass $myClass) {
        // ..
    }
}
class Test {
    public function __construct(namespace\MyClass $myClass) {
        // ..
    }
}

// Assuming this is in the same area as type hinting, in catch blocks:

try {
    // ..
} catch (PDOException $e) {
    // ..
}
try {
    // ..
} catch (asdf\PDOException $e) {
    // ..
}
try {
    // ..
} catch (\asdf\foo\PDOException $e) {
    // ..
}
try {
    // ..
} catch (namespace\PDOException $e) {
    // ..
}

// Also while technically not an issue, the namespace keyword isn't actually interpreted as a library keyword and rather as if it was a user defined namespace. (http://www.php.net/manual/en/language.namespaces.nsconstants.php)

$keyword = new \MyClass();
$keyword = new namesace\MyClass();
$blah = new namespace\MyClass();
$blah = new \namespace\MyClass();
$blah = new foo\namespace\MyClass();

$blah = new blah();
$blah = new blah\blah();
$blah = new blah\$blah\$blah\blah();

if ($test == 1) {

} else if (123 === $foo) {

} elseif (CONST) {

} else {

}

if ($blah instanceof MyClass) {

}

if ($blah instanceof foo\MyClass) {

}

if ($blah instanceof namespace\foo\MyClass) {

}

if ($blah instanceof $b) {

}

foo(&$blah); // Ampersand should be invalid.deprecated.call-time-pass-by-reference.php
foo(&$blah, array(), &$blah); // Ampersand should be invalid.deprecated.call-time-pass-by-reference.php
foo(array($blah, &$foo)); // Ampersand should be storage.modifier.reference.php

$foo = <<<TEST
blah
blah {$x+1}
TEST;

$foo = <<<'TEST'
blah
blah {$x+1}
TEST;

$blah =<<<HTML
<html lang="en">
</head>
HTML;

// test

$blah =<<<CSS
.test {
    width: 120px;
}
CSS;

$blah =<<<JSON
{ "blah": { "foo": 123, "bar": 321 } }
JSON;

require 'foo';
require_once 'blah';
include 'lkajsdf';

$foo = array(1, 2, 3);
$foo = array(
    // One
    1,
    // Two
    2,
);

// Built-in classes

throw new Exception('Bad thing happened!');
throw new ErrorException('Bad thing happened!');

$x = new SplDoublyLinkedList();
$x = new SplFileInfo();
$x = new SplTempFileObject();
$x = new RecursiveDirectoryIterator();
$x = new GlobIterator();
$x = new stdClass;

// SPL Exceptions
throw new BadFunctionCallException();
throw new BadMethodCallException();
throw new DomainException();
throw new InvalidArgumentException();
throw new LengthException();
throw new LogicException();
throw new OutOfBoundsException();
throw new OutOfRangeException();
throw new OverflowException();
throw new RangeException();
throw new RuntimeException();
throw new UnderflowException();
throw new UnexpectedValueException();

// Built-in functions

call_user_method();
call_user_method_array();
define_syslog_variables();
dl();
ereg();
ereg_replace();
eregi();
eregi_replace();
set_magic_quotes_runtime();
session_register();
session_unregister();
session_is_registered();
set_socket_blocking();
split();
spliti();
sql_regcase();
mysql_db_query();
mysql_escape_string();

// Multi-line declarations
function foo(
    $asdf,
    $name = '',
    array $stuff = array()
) {
    $blah = 123;
    return true;
}

function foo(
    $asdf,
    $name = '',
    array $stuff = array(),
    Some_Type $something = null
) {
    $blah = 123;
    return true;
}

$foo->test()
    /* something */
    ->blah()
    // test
    ->oneMore();

$blah = "INSERT INTO foo SET blah = '12"; // Unclosed single quote should not be a problem
$blah = "INSERT INTO `catalogue` SET
 `model`='{$_POST["page_row{$count}_model"]}',
 `type`='{$_POST["page_row{$count}_type"]}'
;");

$str = 'foo' . 'bar';
$str .= 'foo';

$x = 0;
$x++;
$y--;
$x += 1;
$x -= 1;
$y = 2;

$x = $x + $y;
$x = $x - $y;
$x = $x / $y;
$x = $x * $y;
$x = $x % $y;
$x = $x << $y;
$x = $x >> $y;
$x = $x ~ $y;
$x = $x ^ $y;
$x = $x & $y;
$x = $x | $y;

$bar =& foo();
$bar = &foo();
$baz =& $bar;
$baz = &$bar;

foo(&$bar);

$x = $x || $y;
$x = $x && $y;
$x = $x and $y;
$x = $x or $y;
$x = $x xor $y;
$x = $x as $y;

if ($x == 0) { }
if ($x === 0) { }
if ($x != 0) { }
if ($x !== 0) { }
if ($x < 0) { }
if ($x <= 0) { }
if ($x > 0) { }
if ($x >= 0) { }
if ($x <= 0) { }
if ($x <> 0) { }

$arr = array(1, 2, 3);
$arr = array(array(1, 2, 3), array(1, 2, 3));

$foo();
$$foo();

if (true and false) {}
if (true or (true and false)) {}

$blah = (binary) $foo;
$blah = (int) $foo;
$blah = (integer) $foo;
$blah = (bool) $foo;
$blah = (boolean) $foo;
$blah = (float) $foo;
$blah = (double) $foo;
$blah = (real) $foo;
$blah = (string) $foo;
$blah = (array) $foo;
$blah = (object) $foo;
$blah = (unset) $foo;

?>