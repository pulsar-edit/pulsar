import os
import time
import pydoc
import new

def serve_until_quit(self):
    import select
    self.quit = False
    while not self.quit:
        rd, wr, ex = select.select([self.socket.fileno()], [], [], 1)
        if rd:
            self.last_request = time.time()
            self.handle_request()

server = None
def serve(port, timeout=0):
    global started, server
    started = 0
    import threading
    def ready(s):
        global started, server
        server = s
        # monkey-patch the serve_until_quit method.
        server.last_request = time.time()
        server.serve_until_quit = new.instancemethod(serve_until_quit, server, server.__class__)
        started = time.time()
    def quit(event=None):
        global server
        server.quit = 1
    threading.Thread(target=pydoc.serve, args=(port, ready)).start()
    while not started:
        time.sleep(0.1)
    while time.time() < server.last_request + timeout:
        time.sleep(timeout)
    quit()

if __name__ == '__main__':
    import sys
    serve(int(sys.argv[1]), int(sys.argv[2]))
