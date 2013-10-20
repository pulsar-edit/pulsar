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
      require "#{ENV['TM_SUPPORT_PATH']}/lib/osx/plist"
      pl = {'menuItems' => prettyCandidates.map { |pretty, full | { 'title' => pretty, 'cand' => full} }}
      io = open('|"$DIALOG" -u', "r+")
      io << pl.to_plist
      io.close_write
      res = OSX::PropertyList.load(io.read)
      if res.has_key? 'selectedMenuItem'
        snippet_generator( res['selectedMenuItem']['cand'], start )
      else
        ""
      end
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