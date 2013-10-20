#!/System/Library/Frameworks/Ruby.framework/Versions/1.8/usr/bin/ruby -wKU

# Generate grammar selectors from the PHP docs JSON file produced by generate.php
#
# Note: this file is ran automatically by generate.php - you should not need to run
# it manually.
#
# Usage: generate.rb jsonFile

require 'rubygems'
require 'json'
require File.dirname(File.dirname(__FILE__)) + '/lib/Builder'
require '/Applications/TextMate.app/Contents/SharedSupport/Support/lib/osx/plist'

data = JSON.parse(File.read(ARGV[0]))
classes = data['classes']
sections = data['sections']

# ==================
# = Syntax writing =
# ==================
#  process_list
#  Created by Allan Odgaard on 2005-11-28.
#  http://macromates.com/svn/Bundles/trunk/Bundles/Objective-C.tmbundle/Support/list_to_regexp.rb
#
#  Read list and output a compact regexp
#  which will match any of the elements in the list
#  Modified by Ciarån Walsh to accept a plain string array
def process_list(list)
  buckets = { }
  optional = false

  list.map! { |term| term.unpack('C*') }

  list.each do |str|
    if str.empty? then
      optional = true
    else
      ch = str.shift
      buckets[ch] = (buckets[ch] or []).push(str)
    end
  end

  unless buckets.empty? then
    ptrns = buckets.collect do |key, value|
      [key].pack('C') + process_list(value.map{|item| item.pack('C*') }).to_s
    end

    if optional == true then
      "(" + ptrns.join("|") + ")?"
    elsif ptrns.length > 1 then
      "(" + ptrns.join("|") + ")"
    else
      ptrns
    end
  end
end

def pattern_for(name, list)
  return unless list = process_list(list)
  {
    'name'  => name,
    'match' => "(?i)\\b#{ list }\\b"
  }
end

def pattern_for_classes(name, list)
  return unless list = process_list(list)
  {
    'name'     => name,
    'match'    => "(?i)(\\\\)?\\b#{ list }\\b",
    'captures' => { '1' => {'name' => 'punctuation.separator.inheritance.php'} }
  }
end

GrammarPath = File.dirname(__FILE__) + '/../../Syntaxes/PHP.plist'

grammar = OSX::PropertyList.load(File.read(GrammarPath))

patterns = []

sections.sort.each do |(section, funcs)|
  patterns << pattern_for('support.function.' + section + '.php', funcs)
end
patterns << pattern_for('support.function.alias.php', %w{is_int is_integer})

class_patterns = [pattern_for_classes('support.class.builtin.php', classes)]

grammar['repository']['support'] = { 'patterns' => patterns }
grammar['repository']['class-builtin'] = { 'patterns' => class_patterns }

File.open(GrammarPath, 'w') do |file|
  file << grammar.to_plist
end
