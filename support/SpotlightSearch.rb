
user_folder = ENV['TM_PROJECT_DIRECTORY'] 

(user_folder = ENV['TM_DIRECTORY']) if user_folder.nil? or user_folder.empty? or user_folder == '/'
(user_folder = nil) if user_folder.nil? or user_folder.empty? or user_folder == '/'

SearchFolders = [user_folder, "/System/Library/Frameworks", "/usr/include"].compact

header = ARGV[0]
fragment_path_to_header = header.split("/")
header_component = fragment_path_to_header.pop

def search( header_name )
	result_paths = Array.new

	# find all candidates
	SearchFolders.each do |folder|
		results = %x{mdfind -onlyin "#{folder}" "kMDItemFSName == \"#{header_name}\" || kMDItemFSName == \"#{header_name}.h\"" }
		results.each_line {|line| result_paths << line}
	end
	
	return result_paths
end

result_paths = search(header_component)

# verify the prefix path, if one is specified,
# e.g. header == sys/errno.h, need to verify that "sys" is the parent directory
if result_paths.size > 0 and fragment_path_to_header.size > 0
	fragment_path_to_header.reverse!
	
	# there's probably a simpler way to do this
	filtered_result_paths = result_paths.reject do |path|
		reject_me = false
		result_path_components = path.split("/")
		result_path_components.pop
	
		fragment_path_to_header.each {|frag| reject_me = true if result_path_components.pop != frag }
		reject_me
	end

	# don't filter the result paths if it means an empty array, on the theory
	# that finding something is better than finding nothing (and might be what
	# the user wanted anyway)
	result_paths = filtered_result_paths if filtered_result_paths.size > 0	
end

puts result_paths.compact.join("\n")
