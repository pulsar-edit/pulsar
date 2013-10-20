#!/usr/bin/env python
# kumar.mcmillan at gmail

import os
import sys
import pydoc
import time
from urllib2 import urlopen, URLError
from traceback import format_exc

PORT=9877
URL='http://localhost:%d/' % PORT
UID='pydoc_server_%d' % PORT
OUT_LOG = file('/tmp/%s.log' % UID, 'a+')
ERR_LOG = file('/tmp/%s_error.log' % UID, 'a+', 0)

def browse_docs():
    cmd = 'open %s' % URL
    if os.system(cmd) is not 0:
        raise OSError("failed: %s" % cmd)

def is_serving():
    try:
        urlopen(URL)
        return True
    except URLError:
        return False

def start_serv():
    # Redirect standard file descriptors.
    dev_null = file('/dev/null', 'r')
    sys.stdout.flush()
    sys.stderr.flush()
    
    os.dup2(OUT_LOG.fileno(), sys.stdout.fileno())
    os.dup2(ERR_LOG.fileno(), sys.stderr.fileno())
    os.dup2(dev_null.fileno(), sys.stdin.fileno())
    
    pydoc.serve(PORT)

def info():
    def dd(term, d):
        return '<dt>%s</dt><dd>%s</dd>' % (term, d)
        
    return """
<style type="text/css">
body { color: #fff; }
h2, dt { padding: 1em 0.3em 0.3em 0.3em; }
h2 { background: #7799ee; }
dl { margin: 0; }
dt { text-align: right; width: 5em; background: #ee77aa; float: left; }
dd { background: #ffc8d8; padding-top: 1em; }
dd a { margin-left: 0.5em; }
h2, dd { margin-bottom: 3px; }
dd:after {
    content: "."; 
    display: block; 
    height: 0; 
    clear: both; 
    visibility: hidden;
}
</style>

<h2>Pydoc Server</h2>
<dl>
%s
</dl>""" % "\n".join([
    dd('url', '<a href="%(url)s">%(url)s</a>' % {'url':URL}),
    dd('log', '<a href="file://%(url)s">%(url)s</a>' % {'url':OUT_LOG.name}),
    dd('error log', '<a href="file://%(url)s">%(url)s</a>' % {'url':ERR_LOG.name})])

def wait_for_server(finished):
    timeout, interval, elapsed = 10,1,0
    while not is_serving():
        time.sleep(interval)
        elapsed = elapsed + interval
        if elapsed >= timeout:
            raise RuntimeError('timed out waiting for server!')
    finished()

def main():
    def onserve():
        print info()
        browse_docs()
        
    try:
        if is_serving(): 
            onserve()
            sys.exit(0)
        
        # daemonize with the magical two forks, lifted from:
        # http://aspn.activestate.com/ASPN/Cookbook/Python/Recipe/66012
        try:
            pid = os.fork()
            if pid > 0:
                wait_for_server(onserve)
                sys.exit(0)
        except OSError, e: 
            print >>sys.stderr, "fork #1 failed: %s" % (e) 
            raise
    
        os.chdir('/')
        os.setsid()
        os.umask(0)
    
        try:
            pid = os.fork()
            if pid > 0:
                # this is the server's pid
                sys.exit(0)
        except OSError, e: 
            print >>sys.stderr, "fork #2 failed: %s" % (e)
            raise
    
        start_serv()
    except SystemExit, e:
        # don't want this printing a <pre> tag in the TM thread
        raise
    except:
        ERR_LOG.write(format_exc())
        print "<pre>" # so we can read the traceback in the TM thread :)
        raise

if __name__ == '__main__':
    main()