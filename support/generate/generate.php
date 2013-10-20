#!/usr/bin/env php -q
<?php
/**
 * Prepare the PHP completions/docs for TextMate
 *
 * Usage: php generate.php <lang>
 * Example: php generate.php en
 *
 * This script will produce/modify the following files:
 *  - Support/functions.plist
 *  - Support/function-docs/<lang>.txt
 *  - Preferences/Completions.tmPreferences
 *  - Syntaxes/PHP.plist
 */

if (2 !== $argc) {
    printUsage('Must specify a two-letter language code (e.g., "en")');
} else if (2 !== strlen($argv[1])) {
    printUsage('Language must be a two-letter code (e.g., "en")');
}

$lang = strtolower($argv[1]);

$excludeSections = array(
    'basic.other.geoip',
    'basic.other.judy',
    'basic.other.parsekit',
    'basic.other.yaml',
    'basic.php.apd',
    'basic.php.bcompiler',
    'basic.php.inclued',
    'basic.php.runkit',
    'basic.php.wincache',
    'basic.session.msession',
    'basic.session.session-pgsql',
    'basic.text.bbcode',
    'basic.text.ssdeep',
    'basic.vartype.classkit',
    'compression.lzf',
    'compression.rar',
    'creditcard.mcve',
    'creditcard.spplus',
    'crypto.crack',
    'database.vendors.cubrid',
    'database.vendors.dbase',
    'database.vendors.dbplus',
    'database.vendors.fbsql',
    'database.vendors.filepro',
    'database.vendors.ibm-db2',
    'database.vendors.ifx',
    'database.vendors.ingres',
    'database.vendors.maxdb',
    'database.vendors.msql',
    'database.vendors.ovrimos',
    'database.vendors.paradox',
    'fileprocess.file.dio',
    'fileprocess.file.inotify',
    'fileprocess.file.xattr',
    'fileprocess.file.xdiff',
    'fileprocess.process.expect',
    'fileprocess.process.libevent',
    'international.fribidi',
    'remote.auth.kadm5',
    'remote.auth.radius',
    'remote.mail.cyrus',
    'remote.mail.mailparse',
    'remote.mail.vpopmail',
    'remote.other.chdb',
    'remote.other.fam',
    'remote.other.gearman',
    'remote.other.gupnp',
    'remote.other.hw',
    'remote.other.hwapi',
    'remote.other.java',
    'remote.other.mqseries',
    'remote.other.net-gopher',
    'remote.other.nis',
    'remote.other.notes',
    'remote.other.ssh2',
    'remote.other.stomp',
    'remote.other.svn',
    'remote.other.tcpwrap',
    'remote.other.yaz',
    'search.mnogosearch',
    'search.solr',
    'utilspec.audio.id3',
    'utilspec.audio.openal',
    'utilspec.cmdline.ncurses',
    'utilspec.cmdline.newt',
    'utilspec.image.cairo',
    'utilspec.nontext.fdf',
    'utilspec.nontext.gnupg',
    'utilspec.nontext.ming',
    'utilspec.nontext.pdf',
    'utilspec.nontext.ps',
    'utilspec.nontext.rpmreader',
    'utilspec.nontext.swf',
    'utilspec.windows.printer',
    'utilspec.windows.w32api',
    'utilspec.windows.win32ps',
    'utilspec.windows.win32service',
    'webservice.oauth',
    'xml.qtdom',
);

/**
 * List of new->old sections, to ease with transition
 */
$sectionEquivalents = array(
    'basic.other.misc'            => 'basic_functions',
    'basic.other.spl'             => 'php_spl',
    'basic.other.stream'          => 'streamsfuncs',
    'basic.php.outcontrol'        => 'output',
    'basic.text.pcre'             => 'php_pcre',
    'basic.text.regex'            => 'ereg',
    'basic.text.strings'          => 'string',
    'compression.bzip2'           => 'bz2',
    'compression.zip'             => 'php_zip',
    'database.abstract.uodbc'     => 'php_odbc',
    'database.vendors.ibase'      => 'interbase',
    'database.vendors.mssql'      => 'php_mssql',
    'fileprocess.file.filesystem' => 'file',
    'math.bc'                     => 'bcmath',
    'remote.mail.imap'            => 'php_imap',
    'remote.other.ftp'            => 'php_ftp',
    'utilspec.server.apache'      => 'php_apache',
    'xml.dom'                     => 'php_dom',
);

define('PHP_DOC_DIR', __DIR__ . '/.phpdoc');

if (!is_dir(PHP_DOC_DIR)) {
    mkdir(PHP_DOC_DIR);
}

chdir(PHP_DOC_DIR);

if (!is_dir('doc-base')) {
    runCmd('svn checkout http://svn.php.net/repository/phpdoc/doc-base/trunk ./doc-base');
}

if (!is_dir('phd')) {
    runCmd('svn checkout http://svn.php.net/repository/phd/trunk ./phd');
}

chdir('..');

// We have to generate English no matter what
genDocsForLang('en');

if ($lang !== 'en') {
    genDocsForLang($lang);
}

function genDocsForLang($lang) {
    chdir(PHP_DOC_DIR);

    if (!is_dir($lang)) {
        runCmd("svn checkout http://svn.php.net/repository/phpdoc/{$lang}/trunk ./{$lang}");
    }

    if (!is_file("doc-base/.manual.{$lang}.xml")) {
        chdir('doc-base');
        runCmd("php configure.php --with-lang={$lang} --output=.manual.{$lang}.xml");
        chdir('..');
    }

    if (!is_dir("phd/output-{$lang}")) {
        chdir('phd');
        runCmd("php render.php -d../doc-base/.manual.{$lang}.xml --package IDE --format json --output ./output-{$lang}/");
        chdir('..');
    }

    chdir('..');
}

function printUsage($error = false) {
    echo ($error ? "Error: {$error}\n" : '') . "Usage: php generate.php <lang>\n";
    exit(1);
}

function runCmd() {
    $args = func_get_args();
    
    if (isset($args[0]) && false === $args[0]) {
        array_shift($args);
        $cmd = array_shift($args);
    } else {
        $cmd = false;
    }
    
    if (false !== $cmd) {
        array_unshift($args, $cmd);
    }
    
    $cmd = implode(' ', $args);
    echo "Running: {$cmd}\n";
    exec($cmd, $output, $ret);

    if (0 !== $ret) {
        echo "Command failed. Aborting.\n";
        echo "Output:\n";
        echo implode("\n", $output);
        exit(1);
    }

    echo "Done.\n";
}

$phdOutputDir = realpath(PHP_DOC_DIR . "/phd/output-{$lang}");
$outputDir = realpath(dirname(dirname(__DIR__)));

$phdOutputDir = realpath($phdOutputDir);
$phdIndex = "{$phdOutputDir}/index.sqlite";
$phdJsonOutputDir = "{$phdOutputDir}/ide-json";

if (empty($phdOutputDir) || !is_dir($phdOutputDir)) {
    throw new Exception('Cannot find phd output directory!');
} else if (!is_dir($phdJsonOutputDir)) {
    throw new Exception('Missing JSON data in phd output directory!');
} else if (!file_exists($phdIndex)) {
    throw new Exception('Missing phd SQLite index!');
}

$db = new SQLite3($phdIndex);

$result = $db->query('SELECT docbook_id, parent_id FROM ids');

$parentIds = array();

while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $parentIds[$row['docbook_id']] = $row['parent_id'];
}

function getSectionName($id, $raw = false) {
    global $parentIds, $sectionEquivalents;

    $orig = $id;
    $suffix = '';

    while (isset($parentIds[$id]) && $parentId = $parentIds[$id]) {
        $id = $parentId;

        if ('book.' === substr($parentId, 0, 5)) {
            $suffix = '.' . substr($parentId, 5);
        } else if ('refs.' === substr($parentId, 0, 5)) {
            $sect = substr($parentId, 5) . $suffix;
            
            if ($raw) {
                return $sect;
            }
            
            if (array_key_exists($sect, $sectionEquivalents)) {
                return $sectionEquivalents[$sect];
            }
            
            $sect = explode('.', $sect);
            
            return array_pop($sect);
        }
    }

    die("Could not determine section name for {$orig}");
}

function parseInfo($info) {
    $params = array();

    foreach ($info->params as $param) {
        $param->name = trim($param->name);

        $str  = $param->type;
        $str .= ('...' !== $param->name && '$' !== substr($param->name, 0, 1) ? ' $' : ' ') . $param->name;

        $param->optional = is_bool($param->optional) ? !!$param->optional : ('true' === $param->optional);

        if ($param->optional) {
            if (isset($param->initializer)) {
                $str .= ' = ' . (!empty($param->initializer) ? $param->initializer : "''");
            }

            $str = "[{$str}]";
        }

        $params[] = $str;
    }

    $info->pArgs = $params;

    foreach ($info->pArgs as $argNum => &$arg) {
        $arg = str_replace('\\', '\\\\', $arg);
        $arg = addslashes(trim($arg));
        $arg = str_replace('$', '\\\\\$', $arg);
        $arg = '${' . ($argNum + 1) . ':' . $arg . '}';
    }

    $info->pArgs = implode(', ', $info->pArgs);

    $params = implode(', ', $params);

    if ($info->constructor) {
        $returnType = 'object';
    } else {
        $returnType = (empty($info->return->type) ? 'void' : $info->return->type);
    }

    $info->prototype = "{$returnType} {$info->name}({$params})";
    return $info;
}

$dir = new DirectoryIterator($phdJsonOutputDir);

$sections = array();
$functionsTxtLines = array();
$functionsPlistLines = array();

// phd's IDE-JSON docs don't include these classes and functions, so we add them manually
// Note: this shortcut doesn't support functions with multiple arguments, so if you need to
// add functions with multiple arguments, that functionality will need to be written
$extraFunctions = array(
    'include%bool include(string $path)%Includes and evaluates the specified file',
    'include_once%bool include_once(string $path)%Includes and evaluates the specified file',
    'require%bool require(string $path)%Includes and evaluates the specified file, erroring if the file cannot be included',
    'require_once%bool require_once(string $path)%Includes and evaluates the specified file, erroring if the file cannot be included',
);

$classes = array(
    'stdClass',
    'Traversable',
    'IteratorAggregate',
    'Iterator',
    'ArrayAccess',
    'Serializable',
    'RecursiveIterator',
    'OuterIterator',
    'Countable',
    'SeekableIterator',
    'SplObserver',
    'SplSubject',
    'Reflector',
);

$exceptionClasses = array(
    'ErrorException',
    'Exception',
    'LogicException',
    'BadFunctionCallException',
    'BadMethodCallException',
    'DomainException',
    'InvalidArgumentException',
    'LengthException',
    'OutOfRangeException',
    'RuntimeException',
    'OutOfBoundsException',
    'OverflowException',
    'RangeException',
    'UnderflowException',
    'UnexpectedValueException',
);

foreach ($exceptionClasses as $name) {
    $classes[] = $name;
    $extraFunctions[] = implode('%', array(
        $name,
        'object ' . $name . '([string $message = ""], [int $code = 0], [Exception $previous = NULL])',
        "Create a new {$name}",
    ));
}

foreach ($extraFunctions as $line) {
    list($name, $prototype, $description) = explode('%', $line);
    $functionsTxtLines[$name] = $line;

    if (preg_match('/.*?\((.*?)\)/', $prototype, $matches)) {
        $arg = str_replace('$', '\\\\\$', $matches[1]);
        $arg = "\${1:{$arg}}";
        $functionsPlistLines[$name] = "\t{display = '{$name}'; insert = '({$arg})';}";
    }
}

foreach ($dir as $fileinfo) {
    if ($fileinfo->isDot() || !preg_match('/\.json$/', $fileinfo->getBasename())) {
        continue;
    }

    $info = json_decode(file_get_contents($fileinfo->getRealPath()));

    $section = getSectionName($info->manualid, true);

    if (!$section) {
        echo "Missing section: {$info->name} -- {$info->manualid}";
    } else if (in_array($section, $excludeSections)) {
        // echo "Skipping: {$section} -- {$info->name} -- {$info->manualid}\n";
        continue;
    }

    if (false !== strpos($info->name, '.')) {
        $parts = array_map('trim', array_filter(explode('.', $info->name)));
        $classes[] = $parts[0];

        if ($parts[1] !== '__construct') {
            // echo "Skipping non-constructor {$info->name}\n";
            continue;
        }

        $info->name = $parts[0];
        $info->constructor = true;
    } else {
        $info->constructor = false;
    }

    if (!preg_match('/(^function\.)|((\.|--|__)construct$)/', $info->manualid)) {
        // Only allow if it's a function like mysqli_prepare that's both procedural
        // and object-oriented, which is currently best detected by whether or not its
        // name starts with an uppercase letter or not
        if (preg_match('/^[A-Z]/', $info->name)) {
            // echo "Skipping non-constructor (no procedural equivalent to document): {$info->name}\n";
            continue;
        }
    }

    $section = getSectionName($info->manualid);
    $info = parseInfo($info);

    $data = array(
        'name'        => $info->name,
        'prototype'   => $info->prototype,
        'description' => str_replace(array("\n", "\r"), " ", $info->purpose),
    );

    // echo "{$section} -- {$info->name} -- {$info->manualid}\n";

    if (!$info->constructor) {
        $sections[$section][] = $info->name;
    }

    $functionsTxtLines[$info->name] = implode('%', $data);
    $functionsPlistLines[$info->name] = "\t{display = '{$info->name}'; insert = '({$info->pArgs})';}";
}

$classes = array_unique($classes);
sort($classes);
asort($functionsTxtLines);
sort($functionsPlistLines);
ksort($sections);

// echo implode("\n", array_keys($sections)) . "\n";
// die();

$completions = array_unique(array_merge($classes, array_keys($functionsTxtLines)));
sort($completions);

function getCompletionsXml($completions) {
    $compStr  = '        <string>';
    $compStr .= implode("</string>\n        <string>", $completions);
    $compStr .= '</string>';

    $str =<<<XML
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>name</key>
    <string>Completions</string>
    <key>scope</key>
    <string>source.php</string>
    <key>settings</key>
    <dict>
      <key>completions</key>
      <array>
{$compStr}
      </array>
    </dict>
    <key>uuid</key>
    <string>2543E52B-D5CF-4BBE-B792-51F1574EA05F</string>
  </dict>
</plist>

XML;

    return $str;
}

$supportDir = "{$outputDir}/Support";

file_put_contents("{$supportDir}/function-docs/{$lang}.txt", implode("\n", $functionsTxtLines) . "\n");

// Only write the language-agnostic files if we're working with English, otherwise
// we run the risk of getting outdated lists (translations aren't always up-to-date)
if ('en' === $lang) {
    file_put_contents("{$supportDir}/functions.json", json_encode(compact('classes', 'sections')));
    file_put_contents("{$supportDir}/functions.plist",
        "(\n" . implode(",\n", $functionsPlistLines) . "\n)\n"
    );
    file_put_contents("{$outputDir}/Preferences/Completions.tmPreferences", getCompletionsXml($completions));

    runCmd(__DIR__ . '/generate.rb', "{$supportDir}/functions.json");
    unlink("{$supportDir}/functions.json");
}
