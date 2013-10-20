<?php
/*
 * TextMate support library
 * Authors: Ciarán Walsh
 */

/* Since the below functions all rely on txmt:// to be of any use,
 * they aren't useful unless you are accessing the same system as the server.
 * Perhaps there are more situations to handle (i.e. network mounts)
 * But since I don't use them I'll need an example case from someone to implement it
 */
if (isset($_SERVER['REMOTE_ADDR']) && $_SERVER['REMOTE_ADDR'] != '127.0.0.1') return;

/*
 * Print the error linking javascript at the end of the page
 * If error_get_last() is available (PHP 5 >= 5.2.0) then it is checked
 * and javascript will be printed only if there has been an error
 * 
 * If TEXTMATE_NO_ERRORS is defined then the javascript will never be printed
 */

/*
 * Print the javascript to parse and link errors
 */
function textmate_print_error_handler() {
    @include(dirname(__FILE__) . "/textmate_error_handler.html");
}

/*
 * If TEXTMATE_ERRORS is defined then this will set up a shutdown function
 * to automatically print the javascript error parser at the end of the page
 * If error_get_last() is available (PHP 5 >= 5.2.0) then the javascript
 * will be printed only if an error has occured (since printing at the end
 * of the page will invalidate it)
 */
if (defined('TEXTMATE_ERRORS')) {
    register_shutdown_function(create_function('', '
        if (!function_exists("error_get_last") || error_get_last())
            textmate_print_error_handler();'
    ));
}

/*
 * textmate_backtrace()
 * 
 * Dumps a backtrace in the same format as debug_print_backtrace(), adding links
 * to files & lines using the txmt://open schema
 * 
 * Regexing the output of debug_print_backtrace() would be easier but we can't use
 * output buffering in case it's already being used
 */
function textmate_backtrace() {
    echo '<pre class="backtrace">';
    foreach (debug_backtrace() as $number => $trace) {
        echo "#{$number}  ";
        if (isset($trace['class'])) echo $trace['class'], '::';
        echo $trace['function'], '(';
        if (isset($trace['args'])) echo implode(', ', $trace['args']);
        echo ') called at [';
        $file = $line = '';
        if (strpos($trace['file'], 'eval') !== false) {
            $matches = array();
            if (preg_match('/^(.+)\((\d+)\) : eval/', $trace['file'], $matches))
                list($dummy, $file, $line) = $matches;
        } else {
            $file = $trace['file'];
            $line = $trace['line'];
        }
        echo '<a href="txmt://open?url=file://', $file, '&line=', $line, '">', $trace['file'], ':', $trace['line'], "</a>]\n";
    }
    echo '</pre>';
}
?>