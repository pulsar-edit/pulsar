# coding: utf-8
"""
tmhooks.py for PyMate.

This file monkey-patches sys.excepthook to intercept any unhandled
exceptions, format the exception in fancy html, and write them to
a file handle (for instance, sys.stderr).

Also, sys.stdout and sys.stder are wrapped in a utf-8 codec writer.

"""

import sys, os

# remove TM_BUNDLE_SUPPORT from the path.
if os.environ['TM_BUNDLE_SUPPORT'] in sys.path:
  sys.path.remove(os.environ['TM_BUNDLE_SUPPORT'])

# now import local sitecustomize
try:
  import sitecustomize
  if sys.version_info[0] >= 3:
    from imp import reload
  reload(sitecustomize)
except ImportError: pass

import codecs

from os import environ, path, fdopen, popen
from traceback import extract_tb
from cgi import escape
from urllib import quote

# add utf-8 support to stdout/stderr
sys.stdout = codecs.getwriter('utf-8')(sys.stdout);
sys.stderr = codecs.getwriter('utf-8')(sys.stderr);

def tm_excepthook(e_type, e, tb):
    """
    Catch unhandled exceptions, and write the traceback in pretty HTML
    to the file descriptor given by $TM_ERROR_FD.
    """
    # get the file descriptor.
    error_fd = int(str(environ['TM_ERROR_FD']))
    io = fdopen(error_fd, 'wb', 0)
    io.write("<div id='exception_report' class='framed'>\n")
    if isinstance(e_type, str):
        io.write("<p id='exception'><strong>String Exception:</strong> %s</p>\n" % escape(e_type))
    elif e_type is SyntaxError:
        # if this is a SyntaxError, then tb == None
        filename, line_number, offset, text = e.filename, e.lineno, e.offset, e.text
        url, display_name = '', 'untitled'
        if not offset: offset = 0
        io.write("<pre>%s\n%s</pre>\n" % (escape(e.text).rstrip(), "&nbsp;" * (offset-1) + "↑"))
        io.write("<blockquote><table border='0' cellspacing='0' cellpadding='0'>\n")
        if filename and path.exists(filename):
            url = "&url=file://%s" % quote(filename)
            display_name = path.basename(filename)
        if filename == '<string>': # exception in exec'd string.
            display_name = 'exec'
        io.write("<tr><td><a class='near' href='txmt://open?line=%i&column=%i%s'>" %
                                                    (line_number, offset, url))
        io.write("line %i, column %i" % (line_number, offset))
        io.write("</a></td>\n<td>&nbsp;in <strong>%s</strong></td></tr>\n" %
                                            (escape(display_name)))
        io.write("</table></blockquote></div>")
    else:
        message = ""
        if e.args:
            # For some reason the loop below works, but using either of the lines below
            # doesn't
            # message = ", ".join([str(arg) for arg in e.args])
            # message = ", ".join([unicode(arg) for arg in e.args])
            message = repr(e.args[0])
            if len(e.args) > 1:
                for arg in e.args[1:]:
                    message += ", %s" % repr(arg)
        if isinstance(message, unicode):
            io.write("<p id='exception'><strong>%s:</strong> %s</p>\n" %
                                    (e_type.__name__, escape(message).encode("utf-8")))
        else:
            io.write("<p id='exception'><strong>%s:</strong> %s</p>\n" %
                                    (e_type.__name__, escape(message)))
    if tb: # now we write out the stack trace if we have a traceback
        io.write("<blockquote><table border='0' cellspacing='0' cellpadding='0'>\n")
        for trace in extract_tb(tb):
            filename, line_number, function_name, text = trace
            url, display_name = '', 'untitled'
            if filename and path.exists(filename):
                url = "&url=file://%s" % quote(path.abspath(filename))
                display_name = path.basename(filename)
            io.write("<tr><td><a class='near' href='txmt://open?line=%i%s'>" %
                                                            (line_number, url))
            if filename == '<string>': # exception in exec'd string.
                display_name = 'exec'
            if function_name and function_name != "?":
                if function_name == '<module>':
                    io.write("<em>module body</em>")
                else:
                    io.write("function %s" % escape(function_name))
            else:
                io.write('<em>at file root</em>')
            io.write("</a> in <strong>%s</strong> at line %i</td></tr>\n" %
                                                (escape(display_name).encode("utf-8"), line_number))
            io.write("<tr><td><pre class=\"snippet\">%s</pre></tr></td>" % text)
        io.write("</table></blockquote></div>")
    if e_type is UnicodeDecodeError:
        io.write("<p id='warning'><strong>Warning:</strong> It seems that you are trying to print a plain string containing unicode characters.\
            In many contexts, setting the script encoding to UTF-8 and using plain strings with non-ASCII will work,\
            but it is fragile. See also <a href='http://macromates.com/ticket/show?ticket_id=502C2FDD'>this ticket.</a><p />\
            <p id='warning'>You can fix this by changing the string to a unicode string using the 'u' prefix (e.g. u\"foobar\").</p>")
    io.flush()

sys.excepthook = tm_excepthook
