#!/System/Library/Frameworks/Ruby.framework/Versions/1.8/usr/bin/ruby

require 'set'
require "zlib"

def find_include_lines(io)
  res = []
  in_synopsis = false
  io.each_line do |line|
    if in_synopsis then
      case line
      when /^\.In (\S+)$/:              res << $1
      when /^\.\w+ #include <(\S+)>$/:  res << $1
      when /^\.Sh /:                    break
      end
    elsif line =~ /^\.Sh SYNOPSIS/
      in_synopsis = true
    end
  end
  res
end

MARK = [0xFFFC].pack("U").freeze
def esc (txt); txt.gsub(/[$`\\]/, '\\\\\0'); end
parts = STDIN.read.split(MARK)
src = parts.join

# find all function calls
src.gsub!(/(if|while|for|switch|sizeof|sizeofA)\s*\(/, '')
functions = src.scan(/(?:(?!->).(?!@|\.).|^\s*)\b([a-z]+)(?=\()/).flatten.to_set

# collect paths to all man files involved
paths = functions.collect do |func|
  %x{ man 2>/dev/null -WS2:3 #{func} }.scan(/.+/)
end.flatten.sort.uniq

# harvest includes from man files
includes = Set.new
paths.each do |path|
  if path =~ /\.gz$/
    Zlib::GzipReader.open(path) { |io| includes.merge(find_include_lines(io)) }
  else
    File.open(path) { |io| includes.merge(find_include_lines(io)) }
  end
end

# figure out what we already included
included = src.scan(/^\s*#\s*(?:include|import)\s+<(\S+)>/).flatten.to_set

new_includes = (includes - included).collect do |inc|
  "#include <#{inc}>\n"
end.join

parts[0].sub!(/\A (?:
  ^ \s* (?:
     \/\/ .*                            # line comments
   | \/\* (?m:.*?) \*\/                 # comment blocks
   | \# \s* (?:include|import) \s+ <.*  # system includes
   |                                    # blank lines
  ) \s* $ \n )*/x, '\0' + new_includes)

print parts.collect { |part| esc part }.join('${0}')
