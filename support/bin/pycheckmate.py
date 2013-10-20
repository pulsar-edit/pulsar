#!/usr/bin/env python
#
# PyCheckMate, a PyChecker output beautifier for TextMate.
# Copyright (c) Jay Soffian, 2005. <jay at soffian dot org>
# Inspired by Domenico Carbotta's PyMate.
#
# Contributions by Travis Jeffery <travisjeffery at gmail dot com>
#
# License: Artistic.
#
# Usage:
# - Out of the box, pycheckmate.py will perform only a basic syntax check
#   by attempting to compile the python code.
# - Install PyChecker or PyFlakes for more extensive checking. If both are
#   installed, PyChecker will be used.
# - TM_PYCHECKER may be set to control which checker is used. Set it to just
#   "pychecker", "pyflakes", "pep8", "flake8", or "pylint" to locate these
#   programs in the default python bin directory or to a full path if the
#   checker program is installed elsewhere.
# - If for some reason you want to use the built-in sytax check when either
#   pychecker or pyflakes are installed, you may set TM_PYCHECKER to
#   "builtin".
#
# Notice to contributors:
#   Before sending updates to this code, please make sure you have the latest
#   version: http://macromates.com/wiki/pmwiki?n=Main.SubversionCheckout

__version__ = "1.1"

import sys
import os
import re
import traceback
from cgi import escape
from select import select
from urllib import quote

###
### Constants
###

PYCHECKER_URL = "http://pychecker.sourceforge.net/"
PYFLAKES_URL = "http://divmod.org/projects/pyflakes"
PYLINT_URL = "http://www.logilab.org/857"
PEP8_URL = "http://pypi.python.org/pypi/pep8"
FLAKE8_URL = "http://pypi.python.org/pypi/flake8/"

# patterns to match output of checker programs
PYCHECKER_RE = re.compile(r"^(.*?\.pyc?):(\d+):\s+(.*)$")

# careful editing these, they are format strings
TXMT_URL1_FORMAT = r"txmt://open?url=file://%s&line=%s"
TXMT_URL2_FORMAT = r"txmt://open?url=file://%s&line=%s&col=%s"
HTML_HEADER_FORMAT = r"""<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>PyCheckMate %s</title>
<style type="text/css">
<!--

body {
  background-color: #D8E2F1;
  margin: 0;
}

div#body {
  border-style: dotted;
  border-width: 1px 0;
  border-color: #666;
  margin: 10px 0;
  padding: 10px;
  background-color: #C9D9F0;
}

div#output{
  padding: 0;
  margin: 0;
  font-family: Monaco;
  font-size: 8pt;
}

strong.title { font-size: 11pt; }
span.stderr { color: red; }
p {margin: 0; padding: 2px 0; }

-->
</style>
</head>
<body>
<div id="body">
<p><strong class="title">%s</strong></p><br>
<div id="output">
"""

HTML_FOOTER = """</div>
</div>
</body>
</html>
"""

###
### Helper classes
###

class Error(Exception):
    pass

class MyPopen:
    """Modifed version of standard popen2.Popen class that does what I need.

    Runs command with stdin redirected from /dev/null and monitors its stdout
    and stderr. Each time poll() is called a tuple of (stdout, stderr) is
    returned where stdout and stderr are lists of zero or more lines of output
    from the command. status() should be called before calling poll() and if
    it returns other than -1 then the child has terminated and poll() will
    return no additional output. At that point drain() should be called to
    return the last bit of output.

    As a simplication, readlines() can be called until it returns (None, None)
    """

    try:
        MAXFD = os.sysconf('SC_OPEN_MAX')
    except (AttributeError, ValueError):
        MAXFD = 256

    def __init__(self, cmd):
        stdout_r, stdout_w = os.pipe()
        stderr_r, stderr_w = os.pipe()
        self._status = -1
        self._drained = 0
        self._pid = os.fork()
        if self._pid == 0:
            # child
            devnull = open("/dev/null")
            os.dup2(devnull.fileno(), 0)
            os.dup2(stdout_w, 1)
            os.dup2(stderr_w, 2)
            devnull.close()
            self._run_child(cmd)
        else:
            # parent
            os.close(stdout_w)
            os.close(stderr_w)
            self._stdout = stdout_r
            self._stderr = stderr_r
            self._stdout_buf = ""
            self._stderr_buf = ""

    def _run_child(self, cmd):
        if isinstance(cmd, basestring):
            cmd = ['/bin/sh', '-c', cmd]
        for i in range(3, self.MAXFD):
            try:
                os.close(i)
            except OSError:
                pass
        try:
            os.execvp(cmd[0], cmd)
        finally:
            os._exit(1)

    def status(self):
        """Returns exit status of child or -1 if still running."""
        if self._status < 0:
            try:
                pid, this_status = os.waitpid(self._pid, os.WNOHANG)
                if pid == self._pid:
                    self._status = this_status
            except os.error:
                pass
        return self._status

    def poll(self, timeout=None):
        """Returns (stdout, stderr) from child."""
        bufs = {self._stdout:self._stdout_buf, self._stderr:self._stderr_buf}
        fds, dummy, dummy = select(bufs.keys(), [], [], timeout)
        for fd in fds:
            bufs[fd] += os.read(fd, 4096)
        self._stdout_buf = ""
        self._stderr_buf = ""
        stdout_lines = bufs[self._stdout].splitlines()
        stderr_lines = bufs[self._stderr].splitlines()
        if stdout_lines and not bufs[self._stdout].endswith("\n"):
            self._stdout_buf = stdout_lines.pop()
        if stderr_lines and not bufs[self._stderr].endswith("\n"):
            self._stderr_buf = stderr_lines.pop()
        return (stdout_lines, stderr_lines)

    def drain(self):
        stdout, stderr = [self._stdout_buf], [self._stderr_buf]
        while 1:
            data = os.read(self._stdout, 4096)
            if not data:
                break
            stdout.append(data)
        while 1:
            data = os.read(self._stderr, 4096)
            if not data:
                break
            stderr.append(data)
        self._stdout_buf = ""
        self._stderr_buf = ""
        self._drained = 1
        stdout_lines = ''.join(stdout).splitlines()
        stderr_lines = ''.join(stderr).splitlines()
        return (stdout_lines, stderr_lines)

    def readlines(self):
        if self._drained:
            return None, None
        elif self.status() == -1:
            return self.poll()
        else:
            return self.drain()

    def close(self):
        os.close(self._stdout)
        os.close(self._stderr)

###
### Program code
###

def check_syntax(script_path):
    f = open(script_path, 'r')
    source = ''.join(f.readlines()+["\n"])
    f.close()
    try:
        print "Syntax Errors...<br><br>"
        compile(source, script_path, "exec")
        print "None<br>"
    except SyntaxError, e:
        href = TXMT_URL2_FORMAT % (quote(script_path), e.lineno, e.offset)
        print '<a href="%s">%s:%s</a> %s' % (
            href,
            escape(os.path.basename(script_path)), e.lineno,
            e.msg)
    except:
        for line in apply(traceback.format_exception, sys.exc_info()):
            stripped = line.lstrip()
            pad = "&nbsp;" * (len(line) - len(stripped))
            line = escape(stripped.rstrip())
            print '<span class="stderr">%s%s</span><br>' % (pad, line)

def find_checker_program():
    checkers = ["pychecker", "pyflakes", "pylint", "pep8", "flake8"]
    tm_pychecker = os.getenv("TM_PYCHECKER")

    opts = filter(None, os.getenv('TM_PYCHECKER_OPTIONS', '').split())

    if tm_pychecker == "builtin":
        return ('', None, "Syntax check only")

    if tm_pychecker is not None:
        checkers.insert(0, tm_pychecker)

    for checker in checkers:
        basename = os.path.split(checker)[1]
        if checker == basename:
            # look for checker in same bin directory as python (might be
            # symlinked)
            bindir = os.path.split(sys.executable)[0]
            checker = os.path.join(bindir, basename)
            if not os.path.isfile(checker):
                # look where python is installed
                checker = os.path.join(sys.prefix, "bin", basename)
            if not os.path.isfile(checker):
                # search the PATH
                p = os.popen("/usr/bin/which '%s'" % basename)
                checker = p.readline().strip()
                p.close()

        if not os.path.isfile(checker):
            continue

        if basename == "pychecker":
            p = os.popen('"%s" -V 2>/dev/null' % (checker))
            version = p.readline().strip()
            status = p.close()
            if status is None and version:
                version = "PyChecker %s" % version
                return (checker, opts, version)

        elif basename == "pylint":
            p = os.popen('"%s" --version 2>/dev/null' % (checker))
            version = p.readline().strip()
            status = p.close()
            if status is None and version:
                version = re.sub('^pylint\s*', '', version)
                version = re.sub(',$', '', version)
                version = "Pylint %s" % version
                opts += ('--output-format=parseable',)
                return (checker, opts, version)

        elif basename == "pyflakes":
            # pyflakes doesn't have a version string embedded anywhere,
            # so run it against itself to make sure it's functional
            p = os.popen('"%s" "%s" 2>&1 >/dev/null' % (checker, checker))
            output = p.readlines()
            status = p.close()
            if status is None and not output:
                return (checker, opts, "PyFlakes")

        elif basename == "pep8":
            p = os.popen('"%s" --version 2>/dev/null' % (checker))
            version = p.readline().strip()
            status = p.close()
            if status is None and version:
                version = "PEP 8 %s" % version
                global PYCHECKER_RE
                PYCHECKER_RE = re.compile(r"^(.*?\.pyc?):(\d+):(?:\d+:)?\s+(.*)$")
                return (checker, opts, version)

        elif basename == "flake8":
            p = os.popen('"%s" --version 2>/dev/null' % (checker))
            version = p.readline().strip()
            status = p.close()
            if status is None and version:
                version = "flake8 %s" % version
                PYCHECKER_RE = re.compile(r"^(.*?\.pyc?):(\d+):(?:\d+:)?\s+(.*)$")
                return (checker, opts, version)

    return ('', None, "Syntax check only")

def run_checker_program(checker_bin, checker_opts, script_path):
    basepath = os.getenv("TM_PROJECT_DIRECTORY")
    cmd = []
    cmd.append(checker_bin)
    if checker_opts:
        cmd.extend(checker_opts)
    cmd.append(script_path)
    p = MyPopen(cmd)
    while 1:
        stdout, stderr = p.readlines()
        if stdout is None:
            break
        for line in stdout:
            line = line.rstrip()
            match = PYCHECKER_RE.search(line)
            if match:
                filename, lineno, msg = match.groups()
                href = TXMT_URL1_FORMAT % (quote(os.path.abspath(filename)),
                                           lineno)
                if basepath is not None and filename.startswith(basepath):
                    filename = filename[len(basepath)+1:]
                # naive linewrapping, but it seems to work well-enough
                if len(filename) + len(msg) > 80:
                    add_br = "<br>&nbsp;&nbsp;"
                else:
                    add_br = " "
                line = '<a href="%s">%s:%s</a>%s%s' % (
                       href, escape(filename), lineno, add_br,
                       escape(msg))
            else:
                line = escape(line)
            print "%s<br>" % line
        for line in stderr:
            # strip whitespace off front and replace with &nbsp; so that
            # we can allow the browser to wrap long lines but we don't lose
            # leading indentation otherwise.
            stripped = line.lstrip()
            pad = "&nbsp;" * (len(line) - len(stripped))
            line = escape(stripped.rstrip())
            print '<span class="stderr">%s%s</span><br>' % (pad, line)
    print "<br>Exit status: %s" % p.status()
    p.close()

def main(script_path):
    checker_bin, checker_opts, checker_ver = find_checker_program()
    version_string = "PyCheckMate %s &ndash; %s" % (__version__, checker_ver)
    warning_string = ""
    if not checker_bin:
        href_format = \
            "<a href=\"javascript:TextMate.system('open %s', null)\">%s</a>"
        pychecker_url = href_format % (PYCHECKER_URL, "PyChecker")
        pyflakes_url  = href_format % (PYFLAKES_URL, "PyFlakes")
        pylint_url  = href_format % (PYLINT_URL, "Pylint")
        pep8_url = href_format % (PEP8_URL, "PEP 8")
        flake8_url = href_format % (FLAKE8_URL, "flake8")
        warning_string = \
            "<p>Please install %s, %s, %s, %s or %s for more extensive code checking." \
            "</p><br>" % (pychecker_url, pyflakes_url, pylint_url, pep8_url, flake8_url)

    basepath = os.getenv("TM_PROJECT_DIRECTORY")
    if basepath:
        project_dir = os.path.basename(basepath)
        script_name = os.path.basename(script_path)
        title = "%s &mdash; %s" % (escape(script_name), escape(project_dir))
    else:
        title = escape(script_path)

    print HTML_HEADER_FORMAT % (title, version_string)
    if warning_string:
        print warning_string
    if checker_bin:
        run_checker_program(checker_bin, checker_opts, script_path)
    else:
        check_syntax(script_path)
    print HTML_FOOTER
    return 0

if __name__ == "__main__":
    if len(sys.argv) == 2:
        sys.exit(main(sys.argv[1]))
    else:
        print "pycheckmate.py <file.py>"
        sys.exit(1)
