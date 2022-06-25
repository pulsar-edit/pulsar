# Removes '-' characters from named groups to make 
# Oniguruma expressions compatible with PCRE engine.
import re

def read(filename):
  with open(filename, 'rt', encoding='utf8') as file:
    return file.read()

def write(filename, content):
  with open(filename, 'w', encoding='utf8') as file:
    file.write(content)

def convert(string):
  result = re.sub(r'\?<([a-zA-Z-_]*)>', lambda x: x.group().replace('-', ''), string)
  return re.sub(r'\\\\g<([a-zA-Z-]*)>', lambda x: x.group().replace('-', ''), result)

content = read('../grammars/csharp.cson')
updated = convert(content)
write('../grammars/csharp.cson', updated)
