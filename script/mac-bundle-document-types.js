/**
  The macOS configuration MUST be passed this exact object structure in order to
  build the plist file as expected and accepted.
  mac.extendInfo.CFBundleDocumentTypes is a plist entry that MUST receive an array.

  This array then accepts objects of the below values, with the required configuration.
  Since the majority of the file repeats itself we can use the below create() builder
  to minimize file size, and changes that must occur if we ever want to add additional
  values or replace existing values.

  But I do not recommend changing the structure of the object without careful testing.

  The Extensions and Names of the files have all been taken from a Known working
  configuration of Atom's plist that was included with the macOS build.

  But as we now build this for ourselves we will take advantage of our new methods
  and ensure we use the wins electron-builder provides by staying on platform.

  @see https://github.com/atom/atom/blob/master/resources/mac/atom-Info.plist
*/

/**
  When creating this document the syntax is as follows:

  `ext` - An array of file extensions to identify, each being a string
          This value is optional, but in most cases will be needed.

  `name` - A string of the friendly file name.
           This value is optional, but generally should have a name unless relating to bundles or folders.

  Then if needed some additional types are available:
    * "CFBundleTypeMIMETypes" - An array of strings, containing the MIME type of the file.
    * "CFBundleTypeOSTypes" - An array of Strings, for the OS types of the file.
    * "LSItemContentTypes" - An array of Strings
*/

const docs = [
  {
    "ext": [ "adb", "ads" ],
    "name": "ADA source"
  },
  {
    "ext": [ "scpt" ],
    "name": "Compile AppleScript"
  },
  {
    "ext": [ "applescript" ],
    "name": "AppleScript source"
  },
  {
    "ext": [ "as" ],
    "name": "ActionScript source"
  },
  {
    "ext": [ "asp", "asa" ],
    "name": "ASP document"
  },
  {
    "ext": [ "aspx", "ascx", "asmx", "ashx" ],
    "name": "ASP.NET document"
  },
  {
    "ext": [ "bib" ],
    "name": "BibTeX bibliography"
  },
  {
    "ext": [ "c" ],
    "name": "C source"
  },
  {
    "ext": [ "cc", "cp", "cpp", "cxx", "c++" ],
    "name": "C++ source"
  },
  {
    "ext": [ "cs" ],
    "name": "C# source"
  },
  {
    "ext": [ "coffee" ],
    "name": "CoffeeScript source"
  },
  {
    "ext": [ "COMMIT_EDITMSG" ],
    "name": "Commit message"
  },
  {
    "ext": [ "cfdg" ],
    "name": "Context Free Design Grammar"
  },
  {
    "ext": [ "clj", "cljs" ],
    "name": "Clojure source"
  },
  {
    "ext": [ "csv" ],
    "name": "Comma separated values"
  },
  {
    "ext": [ "tsv" ],
    "name": "Tab separated values"
  },
  {
    "ext": [ "cgi", "fcgi" ],
    "name": "CGI script"
  },
  {
    "ext": [ "cfg", "conf", "config", "htaccess" ],
    "name": "Configuration file"
  },
  {
    "ext": [ "css" ],
    "name": "Cascading style sheet"
  },
  {
    "ext": [ "diff" ],
    "name": "Differences file"
  },
  {
    "ext": [ "dtd" ],
    "name": "Document Type Definition"
  },
  {
    "ext": [ "dylan" ],
    "name": "Dylan source"
  },
  {
    "ext": [ "erl", "hrl" ],
    "name": "Erlang source"
  },
  {
    "ext": [ "fscript" ],
    "name": "F-Script source"
  },
  {
    "ext": [ "f", "for", "fpp", "f77", "f90", "f95" ],
    "name": "Fortran source"
  },
  {
    "ext": [ "h", "pch" ],
    "name": "Header"
  },
  {
    "ext": [ "hh", "hpp", "hxx", "h++" ],
    "name": "C++ header"
  },
  {
    "ext": [ "go" ],
    "name": "Go source"
  },
  {
    "ext": [ "gtd", "gtdlog" ],
    "name": "GTD document"
  },
  {
    "ext": [ "h", "hls" ],
    "name": "Haskell source"
  },
  {
    "ext": [ "htm", "html", "phtml", "shtml" ],
    "name": "HTML document"
  },
  {
    "ext": [ "inc" ],
    "name": "Include file"
  },
  {
    "ext": [ "ics" ],
    "name": "iCalendar schedule"
  },
  {
    "ext": [ "ini" ],
    "name": "MS Windows initialization file"
  },
  {
    "ext": [ "io" ],
    "name": "Io source"
  },
  {
    "ext": [ "java" ],
    "name": "Java source"
  },
  {
    "ext": [ "bsh" ],
    "name": "BeanShell script"
  },
  {
    "ext": [ "properties" ],
    "name": "Java properties file"
  },
  {
    "ext": [ "js", "htc" ],
    "name": "JavaScript source"
  },
  {
    "ext": [ "jsp" ],
    "name": "Java Server Page"
  },
  {
    "ext": [ "json" ],
    "name": "JSON file"
  },
  {
    "ext": [ "ldif" ],
    "name": "LDAP Data Interchange Format"
  },
  {
    "ext": [ "less" ],
    "name": "Less source"
  },
  {
    "ext": [ "lisp", "cl", "l", "lsp", "mud", "el" ],
    "name": "Lisp source"
  },
  {
    "ext": [ "log" ],
    "name": "Log file"
  },
  {
    "ext": [ "logo" ],
    "name": "Logo source"
  },
  {
    "ext": [ "lua" ],
    "name": "Lua source"
  },
  {
    "ext": [ "markdown", "mdown", "markdn", "md" ],
    "name": "Markdown document"
  },
  {
    "ext": [ "mk" ],
    "name": "Makefile source"
  },
  {
    "ext": [ "wiki", "wikipedia", "mediawiki" ],
    "name": "Mediawiki document"
  },
  {
    "ext": [ "s", "mips", "spim", "asm" ],
    "name": "MIPS assembler source"
  },
  {
    "ext": [ "m3", "cm3" ],
    "name": "Modula-3 source"
  },
  {
    "ext": [ "moinmoin" ],
    "name": "MoinMoin document"
  },
  {
    "ext": [ "m" ],
    "name": "Objective-C source"
  },
  {
    "ext": [ "mm" ],
    "name": "Objective-C++ source"
  },
  {
    "ext": [ "ml", "mli", "mll", "mly" ],
    "name": "OCaml source"
  },
  {
    "ext": [ "mustache", "hbs" ],
    "name": "Mustache document"
  },
  {
    "ext": [ "pas", "p" ],
    "name": "Pascal source"
  },
  {
    "ext": [ "patch" ],
    "name": "Patch file"
  },
  {
    "ext": [ "pl", "pod", "perl" ],
    "name": "Perl source"
  },
  {
    "ext": [ "pm" ],
    "name": "Perl module"
  },
  {
    "ext": [ "php", "php3", "php4", "php5" ],
    "name": "PHP source"
  },
  {
    "ext": [ "ps", "eps" ],
    "name": "PostScript source"
  },
  {
    "ext": [ "dict", "plist", "scriptSuite", "scriptTerminology" ],
    "name": "Property list"
  },
  {
    "ext": [ "py", "rpy", "cpy", "python" ],
    "name": "Python source"
  },
  {
    "ext": [ "r", "s" ],
    "name": "R source"
  },
  {
    "ext": [ "rl", "ragel" ],
    "name": "Ragel source"
  },
  {
    "ext": [ "rem", "remind" ],
    "name": "Remind document"
  },
  {
    "ext": [ "rst", "rest" ],
    "name": "reStructuredText document"
  },
  {
    "ext": [ "rhtml", "erb" ],
    "name": "HTML with embedded Ruby"
  },
  {
    "ext": [ "erbsql" ],
    "name": "SQL with embedded Ruby"
  },
  {
    "ext": [ "rb", "rbx", "rjs", "rxml" ],
    "name": "Ruby source"
  },
  {
    "ext": [ "sass", "scss" ],
    "name": "Sass source"
  },
  {
    "ext": [ "scm", "sch" ],
    "name": "Scheme source"
  },
  {
    "ext": [ "ext" ],
    "name": "Setext document"
  },
  {
    "ext": [ "sh", "ss", "bashrc", "bash_profile", "bash_login", "profile", "bash_logout" ],
    "name": "Shell script"
  },
  {
    "ext": [ "slate" ],
    "name": "Slate source"
  },
  {
    "ext": [ "sql" ],
    "name": "SQL source"
  },
  {
    "ext": [ "sml" ],
    "name": "Standard ML source"
  },
  {
    "ext": [ "strings" ],
    "name": "Strings document"
  },
  {
    "ext": [ "svg" ],
    "name": "Scalable vector graphics"
  },
  {
    "ext": [ "i", "swg" ],
    "name": "SWIG source"
  },
  {
    "ext": [ "tcl" ],
    "name": "Tcl source"
  },
  {
    "ext": [ "tex", "sty", "cls" ],
    "name": "TeX document"
  },
  {
    "ext": [ "text", "txt", "utf8" ],
    "name": "Plain text document",
    "CFBundleTypeMIMETypes": [ "text/plain" ],
    "CFBundleTypeOSTypes": [ "TEXT", "sEXT", "ttro" ]
  },
  {
    "ext": [ "textile" ],
    "name": "Textile document"
  },
  {
    "ext": [ "toml" ],
    "name": "TOML file"
  },
  {
    "ext": [ "xhtml" ],
    "name": "XHTML document"
  },
  {
    "ext": [ "xml", "xsd", "xib", "rss", "tld", "pt", "cpt", "dtml" ],
    "name": "XML document"
  },
  {
    "ext": [ "xsl", "xslt" ],
    "name": "XSL stylesheet"
  },
  {
    "ext": [ "vcf", "vcard" ],
    "name": "Electronic business card"
  },
  {
    "ext": [ "vb" ],
    "name": "Visual Basic source"
  },
  {
    "ext": [ "yaml", "yml" ],
    "name": "YAML document"
  },
  {
    "ext": [ "nfo" ],
    "name": "Text document"
  },
  {
    "ext": [ "g", "vss", "d", "e", "gri", "inf", "mel", "build", "re", "textmate", "fxscript", "lgt" ],
    "name": "Source"
  },
  {
    "ext": [ "cfm", "cfml", "dbm", "dist", "dot", "ics", "ifb", "dwt", "g", "in", "l", "m4", "mp", "mtml", "orig", "pde", "rej", "servlet", "s5", "tmp", "tpl", "tt", "xql", "yy", "*" ],
    "name": "Document"
  },
  {
    "name": "Document",
    "CFBundleTypeOSTypes": [ "****" ],
    "LSItemContentTypes": [ "public.data" ]
  },
  {
    // Adds Folder Support
    "LSItemContentTypes": [ "public.directory", "com.apple.bundle", "com.apple.resolvable" ]
  }
];

function create() {
  let obj = [];

  for (let i = 0; i < docs.length; i++) {
    let tmp = {
      "CFBundleTypeIconFile": "file.icns",
      "CFBundleTypeRole": "Editor",
      "LSHandlerRank": "Alternate"
    };

    if (docs[i].name) {
      tmp["CFBundleTypeName"] = docs[i].name;
    }

    if (docs[i].ext) {
      tmp["CFBundleTypeExtensions"] = docs[i].ext;
    }

    if (docs[i]["CFBundleTypeMIMETypes"]) {
      // If this type is specified
      tmp["CFBundleTypeMIMETypes"] = docs[i]["CFBundleTypeMIMETypes"];
    }

    if (docs[i]["CFBundleTypeOSTypes"]) {
      tmp["CFBundleTypeOSTypes"] = docs[i]["CFBundleTypeOSTypes"];
    }

    if (docs[i]["LSItemContentTypes"]) {
      tmp["LSItemContentTypes"] = docs[i]["LSItemContentTypes"];
    }

    obj.push(tmp);
  }

  return obj;
}

module.exports = {
  create,
};
