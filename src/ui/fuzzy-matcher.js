const fuzzyNative = require("@lumine-code/fuzzy-native");

/*
  # Name: setCandidates
  # Type: ClassMethod

  Sets the candidates for a new matcher, or sets the candidates for an existing
  matcher. Returns a {Matcher} that can be used to query for candidates.

  * `matcherOrCandidates` - either a {Matcher} returned from a previous call
    from `setCandidates`, or an array of string candidates to be filtered
  * `candidates` - an array of string candidates to be filtered
  * `options` - only used when creating a new {Matcher} (i.e. when
    `matcherOrCandidates` is an array). Supports `ignoreDiacritics` (Boolean)
    to enable accent-insensitive matching. Fixed at construction time.

  ## Examples
  ```js
  const matcher = atom.ui.fuzzyMatcher.setCandidates(["hello", "world"])
  matcher.match('he') // => will return [{value: "hello", score: <number>}]
  atom.ui.fuzzyMatcher.setCandidates(matcher, ["hello", "hope"])
  matcher.match('he') // => will now return "hope" too, but it'll be at
                     // second position with a lower score
  ```
*/
function setCandidates(matcherOrCandidates, candidates, options) {
  if (Array.isArray(candidates)) {
    // Reuse an existing {Matcher}. Construction-time options (e.g.
    // `ignoreDiacritics`) already live on it and don't need re-passing.
    matcherOrCandidates.fuzzyMatcher.setCandidates(
      [...Array(candidates.length).keys()],
      candidates,
    );
    return matcherOrCandidates;
  } else {
    // Create a new {Matcher}. Here `candidates` (the second arg) is actually
    // the options object, if any.
    const opts = candidates || {};
    return new Matcher(
      new fuzzyNative.Matcher(
        [...Array(matcherOrCandidates.length).keys()],
        matcherOrCandidates,
        opts,
      ),
    );
  }
}

/*
  # Name: Matcher
  # Type: Class

  The result from a call to {fuzzyMatcher.setCandidates}.
*/
class Matcher {
  constructor(fuzzyMatcher) {
    // Some heuristics to get the default number of CPUs to make the filter
    this.numCpus = Math.max(1, Math.round(4 * 0.8));
    this.fuzzyMatcher = fuzzyMatcher;
  }

  /*
    # Name: match
    # Type: InstanceMethod

    Matches the current candidates to a query. Query must be a string

    * `query` A string query to filter the pre-defined candidates
    * `options` Key/map to customize the details of the search. All keys are
      optional, meaning they all have defaults
      * `algorithm` Either "fuzzaldrin" or "command-t". Defaults to "fuzzaldrin"
        (the **opposite** of @lumine-code/fuzzy-native)
      * `maxResults` The number of results to return. Defaults to `Infinity`,
        meaning that it'll return _all results_ that did match. Note
        that this has no effect on filtering speed
      * `recordMatchIndexes` If `true`, also returns `matchIndexes`, an array
        of numbers where each number is the index (0-based) of the character
        that was matched. Defaults to `false`
      * `numThreads` The number of threads to filter. Defaults to 80% of the
        current CPUs
      * `maxGap` (only "command-t") The number of maximum "character gap" between
        consecutive letters. A smaller gap means a faster result. Defaults to
        Infinite

    Returns: an object containing:

    * `id` The index of the candidate
    * `value` The original (string) value of the filtered candidate
    * `score` A number in the range 0 to 1. Higher scores are more relevant.
      0 denotes "no match" and will never be returned.
    * `matchIndexes` (optional) Will be returned only if `recordMatchIndexes`
      is set to true. It's an array of integer for each character index in
      `value` for each character in `query`. This can be expensive to calculate.
  */
  match(query, options = {}) {
    let { numThreads, algorithm } = options;
    numThreads ||= this.numCpus;
    algorithm ||= "fuzzaldrin";
    return this.fuzzyMatcher.match(query, { ...options, numThreads, algorithm });
  }

  /*
    # Name: setCandidates
    # Type: InstanceMethod

    Exactly the same as {setCandidates}, passing this {Matcher} as the first parameter
  */
  setCandidates(candidates) {
    return setCandidates(this, candidates);
  }
}

/*
  Essential: The {fuzzyMatcher} API, the same used in the autocomplete,
  fuzzy file search, command palette, etc.
  An instance of this API is available via the `atom.ui.fuzzyMatcher` global.

  This API have two parts - the filtering of an array of candidates, and the
  scoring. Scoring is done via the {fuzzyMatcher.score}, and filtering is
  done by returning a new {Matcher} using the {fuzzyMatcher.setCandidates}
  method, then calling {Matcher#match}. You can _also use_ the
  {fuzzyMatcher.match} to match a single candidate - it uses the same API and
  options as {Matcher#match}.
*/
const fuzzyMatcher = {
  setCandidates: setCandidates,

  // Same as {setCandidates} passing a single candidate, and returning only
  // the score. It can return `0` if there's no match.
  score(candidate, query, _opts = {}) {
    return this.match(candidate, query)?.score || 0;
  },

  // The same as {setCandidates} with a single candidate. Returns just the
  // match, if there's one (can return `undefined`).
  //
  // Accepts `ignoreDiacritics` in `opts` to fold accents before matching
  // (e.g. "cafe" matches "café"); indexes are reported against the original.
  match(candidate, query, opts = {}) {
    const matcher = setCandidates([candidate], {
      ignoreDiacritics: opts.ignoreDiacritics,
    });
    return matcher.match(query, opts)[0];
  },
};

module.exports = fuzzyMatcher;
