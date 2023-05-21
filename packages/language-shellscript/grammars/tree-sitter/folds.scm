
(compound_statement) @fold
(do_group) @fold

(if_statement "then" @fold.start)
(elif_clause) @fold.end
(elif_clause "then" @fold.start)
(else_clause) @fold.end @fold.start
"fi" @fold.end
