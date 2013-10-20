#!/usr/bin/env python

import sys
import re

def cleanup_whitespace(filename = None):
   re_blanks = re.compile(r"^\s*$")
   re_indent = re.compile(r"^[ \t]*")
   
   if filename is None:
      lines = sys.stdin.readlines()
   else:
      f = open(filename)
      lines = f.readlines()
      f.close()
   
   for linenum in xrange(len(lines)-1):
      this_line = lines[linenum]
      if re_blanks.search(this_line):
         # search forward for next non-blank line and get its indent
         replacement = None
         for next_line in lines[linenum+1:]:
            match = re_indent.search(next_line)
            if match:
               replacement = match.group(0) + "\n"
               break
         if replacement is None: continue
      else:
         replacement = this_line.rstrip() + "\n"
      if this_line != replacement:
         lines[linenum] = replacement
   
   if filename is None:
      sys.stdout.writelines(lines)
   else:
      f = open(filename, "w")
      f.writelines(lines)
      f.close()

if __name__ == "__main__":
   if len(sys.argv) == 2 and sys.argv[1] != "-":
      cleanup_whitespace(sys.argv[1])
   else:
      cleanup_whitespace()