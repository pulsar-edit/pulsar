/*
 * Hand-written replacement for the `config.h` that Exuberant Ctags 5.8's
 * `./configure` generates, for Linux (glibc).
 *
 * Same as config/darwin/config.h, minus:
 *
 * - `CASE_INSENSITIVE_FILENAMES`, since Linux filesystems are case-sensitive.
 * - `HAVE_SYS_DIR_H`, which no ctags source file consults.
 *
 * As on macOS, `REGCOMP_BROKEN` is deliberately NOT defined; see the darwin
 * config for why configure gets that wrong on modern compilers.
 */

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
#define HAVE_SYS_STAT_H 1
#define HAVE_SYS_TIMES_H 1
#define HAVE_SYS_TYPES_H 1
#define HAVE_TIME_H 1
#define HAVE_TRUNCATE 1
#define HAVE_UNISTD_H 1
