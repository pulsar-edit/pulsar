; (program
;   (_) @source.php
;   (#is-not? test.type text)
;   (#is-not? test.type text_interpolation))


; SUPPORT
; =======

; There are lots of constructs that look like ordinary function calls but are
; actually special language statements.
(array_creation_expression
  "array" @support.function.builtin.array.php
  "(" @punctuation.definition.parameters.begin.bracket.round.php
  ")" @punctuation.definition.parameters.end.bracket.round.php)

(list_literal "list" @support.function.builtin.list.php
  "(" @punctuation.definition.parameters.begin.bracket.round.php
  ")" @punctuation.definition.parameters.end.bracket.round.php)

(unset_statement
  "unset" @support.function.unset.php
  "(" @punctuation.definition.parameters.begin.bracket.round.php
  ")" @punctuation.definition.parameters.end.bracket.round.php)

(print_intrinsic
  ; Don't delimit the parentheses like parameter punctuation; they're optional
  ; for `print`.
  "print" @support.function.print.php)

; The list of standard library methods in `php.cson` is… a lot. This is my
; biased attempt to pare it down to the most important functions.

(function_call_expression
  function: (name) @support.function._TEXT_.php
  (#match? @support.function._TEXT_.php "^(isset|eval|empty)$")
  (#set! capture.final))

(function_call_expression
  function: (name) @support.function.array.php
  (#match? @support.function.array.php "^(shuffle|sizeof|sort|next|nat(case)?sort|count|compact|current|in_array|usort|uksort|uasort|pos|prev|end|each|extract|ksort|key(_exists)?|krsort|list|asort|arsort|rsort|reset|range|array(_(shift|sum|splice|search|slice|chunk|change_key_case|count_values|column|combine|(diff|intersect)(_(u)?(key|assoc))?|u(diff|intersect)(_(u)?assoc)?|unshift|unique|pop|push|pad|product|values|keys|key_exists|filter|fill(_keys)?|flip|walk(_recursive)?|reduce|replace(_recursive)?|reverse|rand|multisort|merge(_recursive)?|map)?))$"))

(function_call_expression
  function: (name) @support.function.basic-functions.php
  (#match? @support.function.basic-functions.php "^(show_source|sys_getloadavg|sleep|highlight_(file|string)|constant|connection_(aborted|status)|time_(nanosleep|sleep_until)|ignore_user_abort|die|define(d)?|usleep|uniqid|unpack|__halt_compiler|php_(check_syntax|strip_whitespace)|pack|eval|exit|get_browser)$"))

(function_call_expression
  function: (name) @support.function.bcmath.php
  (#match? @support.function.bcmath.php "^(bc(scale|sub|sqrt|comp|div|pow(mod)?|add|mod|mul))$"))

(function_call_expression
  function: (name) @support.function.class-obj.php
  (#match? @support.function.class-obj.php "^(class_alias|all_user_method(_array)?|is_(a|subclass_of)|__autoload|(class|interface|method|property|trait)_exists|get_(class(_(vars|methods))?|(called|parent)_class|object_vars|declared_(classes|interfaces|traits)))$"))

(function_call_expression
  function: (name) @support.function.construct.output.php
  (#match? @support.function.construct.output.php "^(print|echo)$"))

(function_call_expression
  function: (name) @support.function.curl.php
  (#match? @support.function.curl.php "^(curl_(share_(close|init|setopt)|strerror|setopt(_array)?|copy_handle|close|init|unescape|pause|escape|errno|error|exec|version|file_create|reset|getinfo|multi_(strerror|setopt|select|close|init|info_read|(add|remove)_handle|getcontent|exec)))$"))

(function_call_expression
  function: (name) @support.function.datetime.php
  (#match? @support.function.datetime.php "^(strtotime|str[fp]time|checkdate|time|timezone_name_(from_abbr|get)|idate|timezone_((location|offset|transitions|version)_get|(abbreviations|identifiers)_list|open)|date(_(sun(rise|set)|sun_info|sub|create(_(immutable_)?from_format)?|timestamp_(get|set)|timezone_(get|set)|time_set|isodate_set|interval_(create_from_date_string|format)|offset_get|diff|default_timezone_(get|set)|date_set|parse(_from_format)?|format|add|get_last_errors|modify))?|localtime|get(date|timeofday)|gm(strftime|date|mktime)|microtime|mktime)$"))

(function_call_expression
  function: (name) @support.function.dir.php
  (#match? @support.function.dir.php "^(scandir|chdir|chroot|closedir|opendir|dir|rewinddir|readdir|getcwd)$"))

(function_call_expression
  function: (name) @support.function.ereg.php
  (#match? @support.function.ereg.php "^(split(i)?|sql_regcase|ereg(i)?(_replace)?)$"))

(function_call_expression
  function: (name) @support.function.errorfunc.php
  (#match? @support.function.errorfunc.php "^((restore|set)_(error_handler|exception_handler)|trigger_error|debug_(print_)?backtrace|user_error|error_(log|reporting|get_last))$"))

(function_call_expression
  function: (name) @support.function.exec.php
  (#match? @support.function.exec.php "^(shell_exec|system|passthru|proc_(nice|close|terminate|open|get_status)|escapeshell(arg|cmd)|exec)$"))

(function_call_expression
  function: (name) @support.function.file.php
  (#match? @support.function.file.php "^(symlink|stat|set_file_buffer|chown|chgrp|chmod|copy|clearstatcache|touch|tempnam|tmpfile|is_(dir|(uploaded_)?file|executable|link|readable|writ(e)?able)|disk_(free|total)_space|diskfreespace|dirname|delete|unlink|umask|pclose|popen|pathinfo|parse_ini_(file|string)|fscanf|fstat|fseek|fnmatch|fclose|ftell|ftruncate|file(size|[acm]time|type|inode|owner|perms|group)?|file_(exists|(get|put)_contents)|f(open|puts|putcsv|passthru|eof|flush|write|lock|read|gets(s)?|getc(sv)?)|lstat|lchown|lchgrp|link(info)?|rename|rewind|read(file|link)|realpath(_cache_(get|size))?|rmdir|glob|move_uploaded_file|mkdir|basename)$"))

(function_call_expression
  function: (name) @support.function.fileinfo.php
  (#match? @support.function.fileinfo.php "^(finfo_(set_flags|close|open|file|buffer)|mime_content_type)$"))

(function_call_expression
  function: (name) @support.function.filter.php
  (#match? @support.function.filter.php "^(filter_(has_var|input(_array)?|id|var(_array)?|list))$"))

(function_call_expression
  function: (name) @support.function.funchand.php
  (#match? @support.function.funchand.php "^(call_user_(func|method)(_array)?|create_function|unregister_tick_function|forward_static_call(_array)?|function_exists|func_(num_args|get_arg(s)?)|register_(shutdown|tick)_function|get_defined_functions)$"))

(function_call_expression
  function: (name) @support.function.gmp.php
  (#match? @support.function.gmp.php "^gmp_(scan[01]|strval|sign|sub|setbit|sqrt(rem)?|hamdist|neg|nextprime|com|clrbit|cmp|testbit|intval|init|invert|import|or|div(exact)?|div_(q|qr|r)|jacobi|popcount|pow(m)?|perfect_square|prob_prime|export|fact|legendre|and|add|abs|root(rem)?|random(_(bits|range))?|gcd(ext)?|xor|mod|mul)$"))

(function_call_expression
  function: (name) @support.function.hash.php
  (#match? @support.function.hash.php "^(hash(_(hmac(_file)?|copy|init|update(_(file|stream))?|pbkdf2|equals|file|final|algos))?)$"))

(function_call_expression
  function: (name) @support.function.iconv.php
  (#match? @support.function.iconv.php "^(iconv(_(str(pos|len|rpos)|substr|(get|set)_encoding|mime_(decode(_headers)?|encode)))?|ob_iconv_handler)$"))

(function_call_expression
  function: (name) @support.function.info.php
  (#match? @support.function.info.php "^(sys_get_temp_dir|set_(time_limit|include_path|magic_quotes_runtime)|cli_(get|set)_process_title|ini_(alter|get(_all)?|restore|set)|zend_(thread_id|version|logo_guid)|dl|php(credits|info|version)|php_(sapi_name|ini_(scanned_files|loaded_file)|uname|logo_guid)|putenv|extension_loaded|version_compare|assert(_options)?|restore_include_path|gc_(collect_cycles|disable|enable(d)?)|getopt|get_(cfg_var|current_user|defined_constants|extension_funcs|include_path|included_files|loaded_extensions|magic_quotes_(gpc|runtime)|required_files|resources)|get(env|lastmod|rusage|my(inode|[gup]id))|memory_get_(peak_)?usage|main|magic_quotes_runtime )$"))

(function_call_expression
  function: (name) @support.function.json.php
  (#match? @support.function.json.php "^(json_(decode|encode|last_error(_msg)?))$"))

(function_call_expression
  function: (name) @support.function.math.php
  (#match? @support.function.math.php "^((a)?(cos|sin|tan)(h)?|sqrt|srand|hypot|hexdec|ceil|is_(nan|(in)?finite)|octdec|dec(hex|oct|bin)|deg2rad|pi|pow|exp(m1)?|floor|f(mod|div)|lcg_value|log(1(p|0))?|atan2|abs|round|rand|rad2deg|getrandmax|mt_(srand|rand|getrandmax)|max|min|bindec|base_convert|intdiv)$"))

(function_call_expression
  function: (name) @support.function.mbstring.php
  (#match? @support.function.mbstring.php "^(mb_(str(cut|str|to(lower|upper)|istr|ipos|imwidth|pos|width|len|rchr|richr|ripos|rpos)|substitute_character|substr(_count)?|split|send_mail|http_(input|output)|check_encoding|convert_(case|encoding|kana|variables)|internal_encoding|output_handler|decode_(numericentity|mimeheader)|detect_(encoding|order)|parse_str|preferred_mime_name|encoding_aliases|encode_(numericentity|mimeheader)|ereg(i(_replace)?)?|ereg_(search(_(get(pos|regs)|init|regs|(set)?pos))?|replace(_callback)?|match)|list_encodings|language|regex_(set_options|encoding)|get_info))$"))

(function_call_expression
  function: (name) @support.function.mysql.php
  (#match? @support.function.mysql.php "^(mysql_(stat|set_charset|select_db|num_(fields|rows)|connect|client_encoding|close|create_db|escape_string|thread_id|tablename|insert_id|info|data_seek|drop_db|db_(name|query)|unbuffered_query|pconnect|ping|errno|error|query|field_(seek|name|type|table|flags|len)|fetch_(object|field|lengths|assoc|array|row)|free_result|list_(tables|dbs|processes|fields)|affected_rows|result|real_escape_string|get_(client|host|proto|server)_info))$"))

(function_call_expression
  function: (name) @support.function.mysqli.php
  (#match? @support.function.mysqli.php "^(mysqli_(ssl_set|store_result|stat|send_(query|long_data)|set_(charset|opt|local_infile_(default|handler))|stmt_(store_result|send_long_data|next_result|close|init|data_seek|prepare|execute|fetch|free_result|attr_(get|set)|result_metadata|reset|get_(result|warnings)|more_results|bind_(param|result))|select_db|slave_query|savepoint|next_result|change_user|character_set_name|connect|commit|client_encoding|close|thread_safe|init|options|(enable|disable)_(reads_from_master|rpl_parse)|dump_debug_info|debug|data_seek|use_result|ping|poll|param_count|prepare|escape_string|execute|embedded_server_(start|end)|kill|query|field_seek|free_result|autocommit|rollback|report|refresh|fetch(_(object|fields|field(_direct)?|assoc|all|array|row))?|rpl_(parse_enabled|probe|query_type)|release_savepoint|reap_async_query|real_(connect|escape_string|query)|more_results|multi_query|get_(charset|connection_stats|client_(stats|info|version)|cache_stats|warnings|links_stats|metadata)|master_query|bind_(param|result)|begin_transaction))$"))

(function_call_expression
  function: (name) @support.function.network.php
  (#match? @support.function.network.php "^(syslog|socket_(set_(blocking|timeout)|get_status)|set(raw)?cookie|http_response_code|openlog|headers_(list|sent)|header(_(register_callback|remove))?|checkdnsrr|closelog|inet_(ntop|pton)|ip2long|openlog|dns_(check_record|get_(record|mx))|define_syslog_variables|(p)?fsockopen|long2ip|get(servby(name|port)|host(name|by(name(l)?|addr))|protoby(name|number)|mxrr))$"))

(function_call_expression
  function: (name) @support.function.output.php
  (#match? @support.function.output.php "^(output_(add_rewrite_var|reset_rewrite_vars)|flush|ob_(start|clean|implicit_flush|end_(clean|flush)|flush|list_handlers|gzhandler|get_(status|contents|clean|flush|length|level)))$"))

(function_call_expression
  function: (name) @support.function.pgsql.php
  (#match? @support.function.pgsql.php "^(pg_(socket|send_(prepare|execute|query(_params)?)|set_(client_encoding|error_verbosity)|select|host|num_(fields|rows)|consume_input|connection_(status|reset|busy)|connect(_poll)?|convert|copy_(from|to)|client_encoding|close|cancel_query|tty|transaction_status|trace|insert|options|delete|dbname|untrace|unescape_bytea|update|pconnect|ping|port|put_line|parameter_status|prepare|version|query(_params)?|escape_(string|identifier|literal|bytea)|end_copy|execute|flush|free_result|last_(notice|error|oid)|field_(size|num|name|type(_oid)?|table|is_null|prtlen)|affected_rows|result_(status|seek|error(_field)?)|fetch_(object|assoc|all(_columns)?|array|row|result)|get_(notify|pid|result)|meta_data|lo_(seek|close|create|tell|truncate|import|open|unlink|export|write|read(_all)?)))$"))

; TODO: Set up regex injections?
(function_call_expression
  function: (name) @support.function.pcre.php
  (#match? @support.function.pcre.php "^(preg_(split|quote|filter|last_error|replace(_callback)?|grep|match(_all)?))$"))

(function_call_expression
  function: (name) @support.function.posix.php
  (#match? @support.function.posix.php "^(posix_(strerror|set(s|e?u|[ep]?g)id|ctermid|ttyname|times|isatty|initgroups|uname|errno|kill|access|get(sid|cwd|uid|pid|ppid|pwnam|pwuid|pgid|pgrp|euid|egid|login|rlimit|gid|grnam|groups|grgid)|get_last_error|mknod|mkfifo))$"))

(function_call_expression
  function: (name) @support.function.readline.php
  (#match? @support.function.readline.php "^(readline(_(completion_function|clear_history|callback_(handler_(install|remove)|read_char)|info|on_new_line|write_history|list_history|add_history|redisplay|read_history))?)$"))

(function_call_expression
  function: (name) @support.function.session.php
  (#match? @support.function.session.php "^(session_(status|start|set_(save_handler|cookie_params)|save_path|name|commit|cache_(expire|limiter)|is_registered|id|destroy|decode|unset|unregister|encode|write_close|abort|reset|register(_shutdown)?|regenerate_id|get_cookie_params|module_name))$"))

(function_call_expression
  function: (name) @support.function.socket.php
  (#match? @support.function.socket.php "^(socket_(shutdown|strerror|send(to|msg)?|set_((non)?block|option)|select|connect|close|clear_error|bind|create(_(pair|listen))?|cmsg_space|import_stream|write|listen|last_error|accept|recv(from|msg)?|read|get(peer|sock)name|get_option))$"))

(function_call_expression
  function: (name) @support.function.sqlite.php
  (#match? @support.function.sqlite.php "^(sqlite_(single_query|seek|has_(more|prev)|num_(fields|rows)|next|changes|column|current|close|create_(aggregate|function)|open|unbuffered_query|udf_(decode|encode)_binary|popen|prev|escape_string|error_string|exec|valid|key|query|field_name|factory|fetch_(string|single|column_types|object|all|array)|lib(encoding|version)|last_(insert_rowid|error)|array_query|rewind|busy_timeout))$"))

(function_call_expression
  function: (name) @support.function.string.php
  (#match? @support.function.string.php "^(money_format|md5(_file)?|metaphone|bin2hex|sscanf|sha1(_file)?|str(str|c?spn|n(at)?(case)?cmp|chr|coll|(case)?cmp|to(upper|lower)|tok|tr|istr|pos|pbrk|len|rchr|ri?pos|rev)|str_(getcsv|ireplace|pad|repeat|replace|rot13|shuffle|split|word_count)|strip(c?slashes|os)|strip_tags|similar_text|soundex|substr(_(count|compare|replace))?|setlocale|html(specialchars(_decode)?|entities)|html_entity_decode|hex2bin|hebrev(c)?|number_format|nl2br|nl_langinfo|chop|chunk_split|chr|convert_(cyr_string|uu(decode|encode))|count_chars|crypt|crc32|trim|implode|ord|uc(first|words)|join|parse_str|print(f)?|echo|explode|v?[fs]?printf|quoted_printable_(decode|encode)|quotemeta|wordwrap|lcfirst|[lr]trim|localeconv|levenshtein|addc?slashes|get_html_translation_table)$"))

(function_call_expression
  function: (name) @support.function.url.php
  (#match? @support.function.url.php "^(http_build_query|(raw)?url(decode|encode)|parse_url|get_(headers|meta_tags)|base64_(decode|encode))$"))

(function_call_expression
  function: (name) @support.function.var.php
  (#match? @support.function.var.php "^(strval|settype|serialize|(bool|double|float)val|debug_zval_dump|intval|import_request_variables|isset|is_(scalar|string|null|numeric|callable|int(eger)?|object|double|float|long|array|resource|real|bool)|unset|unserialize|print_r|empty|var_(dump|export)|gettype|get_(defined_vars|resource_type))$"))

(function_call_expression
  function: (name) @support.function.xml.php
  (#match? @support.function.xml.php "^(utf8_(decode|encode)|xml_(set_((notation|(end|start)_namespace|unparsed_entity)_decl_handler|(character_data|default|element|external_entity_ref|processing_instruction)_handler|object)|parse(_into_struct)?|parser_((get|set)_option|create(_ns)?|free)|error_string|get_(current_((column|line)_number|byte_index)|error_code)))$"))


; FUNCTIONS
; =========

(function_definition
  name: (name) @entity.name.function.php)

(method_declaration
  name: (name) @entity.name.function.magic.constructor.php
  (#eq? @entity.name.function.magic.constructor.php "__construct")
  (#set! capture.final true))

(method_declaration
  name: (name) @entity.name.function.magic.php
  (#match? @entity.name.function.magic.php "^__(?:call|callStatic|get|set|isset|unset|sleep|wakeup|serialize|unserialize|toString|invoke|set_state|clone|debuginfo)$")
  (#set! capture.final true))

(method_declaration
  (static_modifier)
  name: (name) @entity.name.function.method.static.php
  (#set! capture.final true))

(method_declaration
  name: (name) @entity.name.function.method.php)

; Function calls not caught by anything in the support section.
(function_call_expression
  function: [(qualified_name (name)) (name)] @support.other.function.php
  (#set! capture.shy true))


; NAMESPACES
; ==========

; The "Foo" in `use Bar as Foo;`
(namespace_aliasing_clause
  (name) @entity.name.type.namespace.alias.php)

; The "Bar" in `use Bar as Foo;`
(namespace_use_clause
  (name) @entity.name.type.namespace.aliased.php
  . (namespace_aliasing_clause)
  (#set! capture.final true)
)

; The "Foo" and "Bar" in `use Foo\Bar\Baz;`.
(namespace_name_as_prefix
  (namespace_name) @support.other.namespace.php)

; The last segment of a namespace; the "Baz" in `Foo\Bar\Baz;`.
(qualified_name (name) @entity.name.type.namespace.php)

; The "Foo" in `namespace Foo;`
(namespace_definition
  name: (namespace_name
    (name) @entity.name.type.namespace.php)
    (#set! isNamespaceDefinition true))

; The "Foo" in `use Foo;`
(namespace_use_clause (name) @entity.name.type.namespace.php)


; The "Foo" in `Foo\Bar::method();`
(namespace_name
  (name) @support.other.namespace.php
  (#is-not? test.descendantOfType "namespace_use_clause")
  (#is-not? test.rangeWithData isNamespaceDefinition))


; CLASSES
; =======

(class_declaration (name) @entity.name.type.class.php)

(class_declaration (base_clause (name) @entity.other.inherited-class.php))
(class_declaration (class_interface_clause (name) @entity.other.implemented-interface.php))

; The "Foo" and "Bar" in `use Bar, Foo;`
(use_declaration (name) @support.other.trait.php)

; The "Foo" in `Baz::thud insteadof Foo;`
(use_instead_of_clause (name) @support.other.trait.php .
  (#set! capture.final true))

; In `use` lists, the "bar" in `Foo::bar` is a method, not a constant.
(use_list
  (_
    (class_constant_access_expression (name) @support.other.function.method.php .)
  )
  (#set! capture.final true))

; The "Foo" and "bar" in `Foo::bar`.
(class_constant_access_expression . (name) @support.class.php)
(class_constant_access_expression (name) @support.other.property.php .)

; The "Foo" in `Foo::bar()` and `Foo::$bar()`.
(scoped_call_expression
  scope: (name) @support.class.php)

; The "bar" in `Foo::bar()`.
(scoped_call_expression
  name: (name) @support.other.function.method.static.php)

; The "$bar" in `Foo::$bar()`.
(scoped_call_expression
  name: (variable_name) @variable.other.method.static.php)

; The "Foo" and "$bar" in `Foo::$bar`.
(scoped_property_access_expression
  scope: (name) @support.class.php)
(scoped_property_access_expression
  name: (variable_name) @variable.other.property.static.php
  (#set! capture.final true))

; The "bar" in `$foo->bar()`.
(member_call_expression
  name: (name) @support.other.function.method.php)

; The "bar" in `$foo->bar`.
(member_access_expression
  name: (name) @support.other.property.php
  (#set! capture.final true))

; The "$bar" in `$foo->$bar()`.
(member_call_expression
  name: (variable_name) @variable.other.method.php
  (#set! capture.final true))

; The "$bar" in `$foo->$bar`.
(member_access_expression
  name: (variable_name) @variable.other.property.php
  (#set! capture.final true))

; The "Foo" in `new Foo();`.
(object_creation_expression
  (name) @support.class.php)


; TRAITS
; ======

(trait_declaration (name) @entity.name.type.trait.php)


; INTERFACES
; ==========

(interface_declaration (name) @entity.name.type.interface.php)


; TYPES
; =====

; Primitive types are value types, hence are placed in `support.storage.type`.
(primitive_type) @support.storage.type.builtin.php
(cast_type) @support.storage.type.builtin.php

(named_type (name) @support.storage.type.php)
(named_type (qualified_name) @support.storage.type.php)

; Acts as a modifier on all variables, regardless of value type, hence `storage.modifier`.
"global" @storage.modifier.global.php

; Core language constructs go in `storage.type`.
["enum" "interface" "trait" "class"] @storage.type._TYPE_.php
(enum_case "case" @storage.type.case.php)
"function" @storage.type.function.php
"fn" @storage.type.function.arrow.php


; ENUMS
; =====

(enum_declaration
  name: (name) @entity.name.type.enum.php)

(enum_declaration_list
  (enum_case
    name: (name) @constant.other.enum.php))

; VARIABLES
; =========

; All usages of "$this".
((variable_name) @variable.language.builtin.this.php
  (#eq? @variable.language.builtin.this.php "$this")
  (#set! capture.final true))

; The `self` builtin (for referring to the current class) and the `parent`
; builtin (for referring to the parent class).
(relative_scope) @variable.language.builtin._TEXT_.php

(object_creation_expression
  (name ["self" "parent" "static"] @variable.language.builtin._TEXT_.php)
  (#set! capture.final true))

; The "$foo" in `function bar($foo) {`.
(formal_parameters
  (simple_parameter
    (variable_name
      "$" @punctuation.definition.variable.php
    ) @variable.parameter.php))

((variable_name
  ("$" @punctuation.definition.variable.php)
    (name) @_IGNORE_) @variable.other.php
  (#set! capture.final true))

; The `${foo}` in `"${foo}"`.
(dynamic_variable_name) @meta.embedded.line.interpolation.php @variable.other.interpolated.php

((dynamic_variable_name) @punctuation.definition.variable.begin.php
  (#set! adjust.endAfterFirstMatchOf "^\\$\\{"))

((dynamic_variable_name) @punctuation.definition.variable.begin.php
  (#set! adjust.startBeforeFirstMatchOf "^\\}$"))

; ((name) @constant.other.php
;   (#match? @constant.other.php "^_?[A-Z][A-Z\\d_]+$"))

(const_declaration (const_element) @variable.other.constant.php)

((name) @constant.language.php
 (#match? @constant.language.php "^__[A-Z][A-Z\d_]+__$"))

(argument
  name: (_) @variable.other.named-argument.php
  ":" @punctuation.separator.key-value.php)


; STRINGS

(string
  "'" @punctuation.definition.string.begin.php
  (string_value)?
  "'" @punctuation.definition.string.end.php) @string.quoted.single.php

(encapsed_string
  "\"" @punctuation.definition.string.begin.php
  (string_value)?
  "\"" @punctuation.definition.string.end.php) @string.quoted.double.php

(encapsed_string
  (escape_sequence) @constant.character.escape.php)

[(heredoc) (nowdoc)] @string.unquoted.heredoc.php


[
  "as"
  "break"
  "catch"
  "const"
  "continue"
  "declare"
  "default"
  "do"
  "echo"
  "else"
  "elseif"
  "enddeclare"
  "endforeach"
  "endif"
  "endswitch"
  "endwhile"
  "finally"
  "foreach"
  "if"
  "include_once"
  "include"
  "insteadof"
  "new"
  "require_once"
  "require"
  "return"
  "switch"
  "throw"
  "try"
  "use"
  "while"
] @keyword.control._TYPE_.php

(case_statement "case" @keyword.control.case.php)

[
  "abstract"
  "extends"
  "final"
  "implements"
  "namespace"
  "private"
  "protected"
  "public"
  "readonly"
  "static"
] @storage.modifier._TYPE_.php

(expression_statement (name) @keyword.control.exit.php
  (#eq? @keyword.control.exit.php "exit"))

; CONSTANTS
; =========

(boolean) @constant.language.boolean._TEXT_.php
(null) @constant.language.null.php

(integer) @constant.numeric.decimal.integer.php
(float) @constant.numeric.decimal.float.php

; COMMENTS
; ========

((comment) @comment.line.double-slash.php
  (#match? @comment.line.double-slash.php "^//"))

((comment) @punctuation.definition.comment.php
  (#match? @comment.line.double-slash.php "^//")
  (#set! adjust.startAndEndAroundFirstMatchOf "^//"))

((comment) @comment.line.number-sign.php
  (#match? @comment.line.number-sign.php "^#"))

((comment) @punctuation.definition.comment.php
  (#match? @punctuation.definition.comment.php "^#")
  (#set! adjust.startAndEndAroundFirstMatchOf "^#"))

; All block comments get re-highlighted whenever a change takes place inside
; them.
((comment) @_IGNORE_
  (#match? @_IGNORE_ "^/\\*")
  (#set! highlight.invalidateOnChange true))

; Capture these because the PHPDoc injection won't process them…
((comment) @comment.block.documentation.php
  (#match? @comment.block.documentation.php "^/\\*\\*\\*")
  (#set! highlight.invalidateOnChange true))

; …but otherwise leave this style of comment to be handled by PHPDoc.
((comment) @_IGNORE_
  (#match? @_IGNORE_ "^/\\*\\*")
  (#set! capture.final true))

((comment) @comment.block.php
  (#match? @comment.block.php "^/\\*(?!\\*)"))

((comment) @punctuation.definition.comment.begin.php
  (#match? @punctuation.definition.comment.begin.php "^/\\*(?!\\*)")
  (#set! adjust.startAndEndAroundFirstMatchOf "^/\\*"))

((comment) @punctuation.definition.comment.end.php
  (#match? @punctuation.definition.comment.end.php "^/\\*(?!\\*)")
  (#set! adjust.startAndEndAroundFirstMatchOf "\\*/$"))


; OPERATORS
; =========

(binary_expression "." @keyword.operator.string.php)

(optional_type "?" @keyword.operator.nullable-type.php)
(union_type "|" @keyword.operator.union-type.php)

[
  "&&"
  "||"
  "??"
] @keyword.operator.logical.php

["="] @keyword.operator.assignment.php

(conditional_expression
  ["?" ":"] @keyword.operator.ternary.php)

(unary_op_expression "@" @keyword.operator.error-control.php)

[
  "=="
  "==="
  "!="
  "!=="
  ">"
  "<"
  "<="
  ">="
  "<>"
  "<=>"
] @keyword.operator.comparison.php

[
  "+"
  "-"
  "*"
  "/"
  "**"
  "%"
] @keyword.operator.arithmetic.php

[
  "&"
  "|"
  "^"
  "~"
  "<<"
  ">>"
] @keyword.operator.bitwise.php

[
  "+="
  "-="
  "*="
  "/="
  "%="
  "**="
  "&="
  "|="
  "^="
  "<<="
  ">>="
  ".="
  "??="
] @keyword.operator.assignment.compound.php

"->" @keyword.operator.class.php
"=>" @punctuation.separator.key-value.php

"\\" @keyword.operator.namespace.php
"::" @keyword.operator.accessor.php

";" @punctuation.terminator.statement.php;

(unary_op_expression "!" @keyword.operator.unary.php)

; PUNCTUATION
; ===========

(formal_parameters
  "(" @punctuation.definition.parameters.begin.bracket.round.php
  ")"@punctuation.definition.parameters.end.bracket.round.php
  (#set! capture.final true))

"{" @punctuation.definition.block.begin.bracket.curly.php
"}" @punctuation.definition.block.end.bracket.curly.php
("(" @punctuation.definition.begin.bracket.round.php
  (#set! capture.shy true))
(")" @punctuation.definition.end.bracket.round.php
  (#set! capture.shy true))
"[" @punctuation.definition.begin.bracket.square.php
"]" @punctuation.definition.end.bracket.square.php

(php_tag) @punctuation.section.embedded.begin.php
"?>" @punctuation.section.embedded.end.php
