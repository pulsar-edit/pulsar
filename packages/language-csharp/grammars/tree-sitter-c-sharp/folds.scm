[
	(block)
	(declaration_list)
	(accessor_list)
] @fold


(preproc_region) @fold.start
(preproc_endregion) @fold.end

"#if" @fold.start
["#elif" "#else"] @fold.end @fold.start
"#endif" @fold.end
