#!/System/Library/Frameworks/Ruby.framework/Versions/1.8/usr/bin/ruby
require ENV['TM_SUPPORT_PATH'] + "/lib/exit_codes"
require "#{ENV['TM_SUPPORT_PATH']}/lib/escape"
require "zlib"
require "set"
require "#{ENV['TM_SUPPORT_PATH']}/lib/ui"


class ExternalSnippetizer
  
  def initialize(options = {})
    @star = options[:star] || false
    @arg_name = options[:arg_name] || false
    @tm_C_pointer = options[:tm_C_pointer] || " *"
  end
  
def snippet_generator(cand, start)

  cand = cand.strip
  oldstuff = cand[0..-1].split("\t")
  stuff = cand[start..-1].split("\t")
  stuffSize = stuff[0].size
  if oldstuff[0].count(":") == 1
    out = "${0:#{stuff[6]}}"
  elsif oldstuff[0].count(":") > 1

    name_array = stuff[0].split(":")
    out = "${1:#{stuff[-name_array.size - 1]}} "
    unless name_array.empty?
    begin      
      stuff[-(name_array.size)..-1].each_with_index do |arg,i|
          out << name_array[i] + ":${#{i+2}:#{arg}} "
      end
    rescue NoMethodError
      out = "$0"
    end
  end
  else
    out = "$0"
  end
  return out.chomp.strip
end

def construct_arg_name(arg)
  a = arg.match(/(NS|AB|CI|CD)?(Mutable)?(([AEIOQUYi])?[A-Za-z_0-9]+)/)
  unless a.nil?
    (a[4].nil? ? "a": "an") + a[3].sub!(/\b\w/) { $&.upcase }
  else
    ""
  end
end

def type_declaration_snippet_generator(dict)

  arg_name = @arg_name && dict['noArg']
  star = @star && dict['pure']
  pointer = @tm_C_pointer
  pointer = " *" unless pointer

  if arg_name
    name = "${2:#{construct_arg_name dict['match']}}"
    if star
      name = ("${1:#{pointer}#{name}}")
    else
      name = " " + name
    end

  else
    name = pointer.rstrip if star
  end
  #  name = name[0..-2].rstrip unless arg_name
  name + "$0"
end

def cfunction_snippet_generator(c)
  c = c.split"\t"
  i = 0
  "("+c[1][1..-2].split(",").collect do |arg| 
    "${"+(i+=1).to_s+":"+ arg.strip + "}" 
  end.join(", ")+")$0"
end

def run(res)
  if res['type'] == "methods"
    r = snippet_generator(res['cand'], res['match'].size)
  elsif res['type'] == "functions"
    r = cfunction_snippet_generator(res['cand'])
  elsif res['pure'] && res['noArg']
    r = type_declaration_snippet_generator res
  else 
    r = "$0"
  end
  return r
end
end

class CCompletion
  def file_names
    ["CLib.txt.gz"]
  end
    
  def candidates_or_exit(methodSearch="")
    candidates = []
    file_names.each do |name|
      zGrepped = %x{ zgrep ^#{e_sh methodSearch } #{e_sh ENV['TM_BUNDLE_SUPPORT']}/#{name} }
      candidates += zGrepped.split("\n")
    end
    TextMate.exit_show_tool_tip "No completion available" if candidates.empty?
    return candidates
  end

  def prettify(candidate)
    ca = candidate.split("\t")
    ca[0]+ca[1]
  end

  def snippet_generator(cand, s)
    c = cand.split"\t"
    i = 0
    middle = c[1][1..-2].split(",").collect do |arg|
      "${"+(i+=1).to_s+":"+ arg.strip + "}" 
    end.join(", ")
    c[0][s..-1]+"("+middle+")$0"
  end

  def pop_up(candidates, searchTerm)
    start = searchTerm.size
    prettyCandidates = candidates.map { |candidate| [prettify(candidate), candidate] }.sort
    if prettyCandidates.size > 1
      require "enumerator"
      pruneList = []  

      prettyCandidates.each_cons(2) do |a| 
        pruneList << (a[0][0] != a[1][0]) # check if prettified versions are the same
      end
      pruneList << true
      ind = -1
      prettyCandidates = prettyCandidates.select do |a| #remove duplicates
        pruneList[ind+=1]  
      end
    end

    if prettyCandidates.size > 1
      #index = start
      #test = false
      #while !test
      #  candidates.each_cons(2) do |a,b|
      #    break if test = (a[index].chr != b[index].chr || a[index].chr == "\t")
      #  end
      #  break if test
      #  searchTerm << candidates[0][index].chr
      #  index +=1
      #end

      pl = prettyCandidates.map do |pretty, full |
         { 'display' => pretty,
           'cand' => full,
           'type' => "functions",
           'match'=> full.split("\t")[0]
         }
       end

       flags = {}
       flags[:extra_chars]= '_'
       flags[:initial_filter]= searchTerm
       #TextMate.exit_show_tool_tip pl.inspect
       begin
         TextMate::UI.complete(pl, flags)  do |hash|
           #{}"kalle kula"
           #hash.inspect
           es = ExternalSnippetizer.new
           
           es.run(hash)
           #hash.inspect
         end
       rescue NoMethodError
         TextMate.exit_show_tool_tip "you have Dialog2 installed but not the ui.rb in review"
       end
      TextMate.exit_discard # create_new_document
    else
      snippet_generator( candidates[0], start )
    end
  end

  def print
    line = ENV['TM_CURRENT_LINE']
    if ENV['TM_INPUT_START_LINE_INDEX']
      caret_placement =ENV['TM_INPUT_START_LINE_INDEX'].to_i -1
    else
      caret_placement =ENV['TM_LINE_INDEX'].to_i - 1
    end

    backContext = line[1+caret_placement..-1].match /^[a-zA-Z0-9_]/

    if backContext
      TextMate.exit_discard
    end


    alpha_and_caret = /[a-zA-Z_][_a-zA-Z0-9]*\(?$/
    if k = line[0..caret_placement].match(alpha_and_caret)
      candidates = candidates_or_exit(k[0])
      res = pop_up(candidates, k[0])
    else
      res = ""
    end
  end
end

class CppCompletion < CCompletion
  def file_names
    super << "C++Lib.txt.gz"
  end
end