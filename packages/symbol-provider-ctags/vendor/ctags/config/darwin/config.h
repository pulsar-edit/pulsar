/*
 * Hand-written replacement for the `config.h` that Exuberant Ctags 5.8's
 * `./configure` generates, for macOS.
 *
 * Derived from configure's output on macOS (arm64, Xcode clang), with these
 * changes:
 *
 * - `REGCOMP_BROKEN` is NOT defined. configure's test for a working
 *   `regcomp()` doesn't compile under modern clang (implicit `int`, undeclared
 *   `exit()`), so configure wrongly concludes `regcomp()` is broken and builds
 *   ctags without regex support. macOS's `regcomp()` is fine.
 * - `TMPDIR` is a generic fallback; configure bakes in the build machine's
 *   `$TMPDIR`. (ctags prefers `$TMPDIR` from the environment at runtime.)
 * - The empty `PACKAGE_*` strings are omitted; nothing uses them.
 */

#define CASE_INSENSITIVE_FILENAMES 1
#define DEFAULT_FILE_FORMAT 2
#define SYS_INTERPRETER 1
#define STDC_HEADERS 1
#define TMPDIR "/tmp"

#define HAVE_CLOCK 1
#define HAVE_DIRENT_H 1
#define HAVE_FCNTL_H 1
#define HAVE_FGETPOS 1
#define HAVE_FNMATCH 1
#define HAVE_FNMATCH_H 1
#define HAVE_INTTYPES_H 1
#define HAVE_MEMORY_H 1
#define HAVE_MKSTEMP 1
#define HAVE_OPENDIR 1
#define HAVE_REGCOMP 1
#define HAVE_REMOVE 1
#define HAVE_SETENV 1
#define HAVE_STDINT_H 1
#define HAVE_STDLIB_H 1
#define HAVE_STRCASECMP 1
#define HAVE_STRERROR 1
#define HAVE_STRINGS_H 1
#define HAVE_STRING_H 1
#define HAVE_STRNCASECMP 1
#define HAVE_STRSTR 1
#define HAVE_SYS_DIR_H 1
#define HAVE_SYS_STAT_H 1
#define HAVE_SYS_TIMES_H 1
#define HAVE_SYS_TYPES_H 1
#define HAVE_TIME_H 1
#define HAVE_TRUNCATE 1
#define HAVE_UNISTD_H 1
