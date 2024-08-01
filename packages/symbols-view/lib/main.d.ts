import type { TextEditor, Point, Range as AtomRange } from 'atom';

type MaybePromise<T> = T | Promise<T>;

// The properties that a provider is allowed to modify on a `SelectList`
// instance during symbol retrieval.
//
// A provider that marks itself as `isExclusive: true` will be allowed to set
// certain UI messages on the `SelectList`. This allows the provider to offer
// UI guidance messages.
//
// For instance, if a project-wide symbol search is taking place, the provider
// could set an `emptyMessage` of “Query must be at least X characters long” to
// explain why no results are present at first.
type ListControllerParams = Partial<{
  errorMessage: string,
  emptyMessage: string,
  loadingMessage: string,
  laodingBadge: string
}>;

type ListControllerParamName = keyof ListControllerParams;

// An object given to the exclusive provider during symbol retrieval. The
// provider can use this to control certain aspects of the symbol list's UI.
type ListController = {
  // Set props on the `SelectList` instance.
  set (params: ListControllerParams): void,

  // Clear any number of props on the `SelectList` instance.
  clear(...propNames: ListControllerParamName[]): void
};

export type SymbolPosition = {
  // An instance of `Point` describing the symbol's location. The `column`
  // value of the point may be ignored, depending on the user's settings. At
  // least one of `position` and `range` must exist.
  position: Point;
};

export type SymbolRange = {
  // An exact range describing the bounds of a given token. If present, might
  // be used to highlight the token when selected by the user, though that
  // depends on the user's settings. At least one of `position` and `range`
  // must exist.
  range: AtomRange
};

export type SymbolDirectoryAndFile = {
  // The name of the file that contains the symbol. Will be shown in the UI.
  file: string,
  // The path of to the directory of the file that contains the symbol. Should
  // not contain the file name.
  directory: string
};

export type SymbolPath = {
  // The full path to the file that contains the symbol.
  path: string
};

// The only required fields in a file symbol are (a) the `name` of the symbol,
// and (b) a reference to its row in the buffer (via either `position` or
// `range`). Other fields are optional, but make for a richer UI presentation.
export type FileSymbol = (SymbolPosition | SymbolRange) & {
  // The name of the symbol. This value will be shown in the UI and will be
  // filtered against if the user types in the text box. Required.
  name: string,

  // A word representing the symbol in some way. Typically this would describe
  // the symbol — function, constant, et cetera — but can be used however the
  // provider sees fit. If present, will be included in the symbol list as a
  // badge.
  tag?: string

  // A _short_ string of explanatory text. Optional. Can be used for text that
  // is contexually significant to the symbol; for instance, a method or field
  // might describe the class that owns it. Symbol consumers will expect this
  // field to be short, and will not devote much space to it in the interface,
  // so this field _should not_ contain unbounded text.
  context?: string

  // POSSIBLE ENHANCEMENTS (UNIMPLEMENTED!):
  //
  // I don't necessarily find these useful myself, or at least not useful
  // enough to warrant their inclusion in a space-constrained list of symbols,
  // but some people might want these to be present.

  // A description of the symbol in code or pseudocode. For functions, this
  // could be a function signature, along with parameter names and (if known)
  // types.
  //
  // This field would receive its own line in a symbol list.
  signature?: string

  // The literal line of code containing the symbol. A symbol consumer could
  // try to retrieve this information itself, but some symbol providers would
  // be able to supply it much more simply.
  //
  // This field would receive its own line in a symbol list.
  source?: string
};

// A project symbol has the additional requirement of specifying the file in
// which each symbol is located, via either the `path` property or both
// `directory` and `file`.
export type ProjectSymbol = FileSymbol & (SymbolDirectoryAndFile | SymbolPath);

// Metadata received by a symbol provider as part of a call to
// `canProvideSymbols` or `getSymbols`.
export type SymbolMeta = {
  // The type of action being performed:
  //
  // * `file`: A symbol search within the current file.
  // * `project`: A project-wide symbol search.
  // * `project-find`: A project-wide attempt to resolve a reference based on
  //    (a) the position of the cursor, (b) the value of the editor's current
  //    text selection, or (c) whatever word was clicked on in the IDE.
  type: 'file' | 'project' | 'project-find',

  // The current text editor.
  editor: TextEditor,

  // The relevant search term, if any.
  //
  // When `type` is `project`, this will represent the text that the user has
  // typed into a search field in order to filter the list of symbols.
  //
  // When `type` is `project-find`, this will represent the text that the IDE
  // wants to resolve.
  //
  // When `type` is `file`, this field will be absent, because file symbols are
  // queried only initially, before the user has typed anything; all winnowing
  // is done on the frontend as the user types.
  query?: string,

  // The relevant range in the buffer.
  //
  // This may be present when `type` is `project-find` and the consumer wants
  // to resolve an arbitrary buffer range instead of the word under the cursor.
  range?: Range,

  // An `AbortSignal` that represents whether the task has been cancelled. This
  // will happen if the user cancels out of the symbol UI while waiting for
  // symbols, or if they type a new character in the query field before the
  // results have returned for the previous typed character. It will also
  // happen if the provider exceeds the amount of time allotted to it (see
  // `timeoutMs` below).
  //
  // If the provider goes async at any point, it should check the signal after
  // resuming. If the signal has aborted, then there is no point in continuing.
  // The provider should immediately return/resolve with `null` and avoid doing
  // unnecessary further work.
  signal: AbortSignal,

  // The amount of time, in milliseconds, the provider has before it must
  // return results. This value is configurable by the user. If the provider
  // doesn't return anything after this amount of time, it will be ignored.
  //
  // The provider is not in charge of ensuring that it returns results within
  // this amount of time; `symbols-view` enforces that on its own. This value
  // is given to providers so that they can act wisely when faced with a choice
  // between “search for more symbols” and “return what we have.”
  //
  // The `timeoutMs` property is only present when the appropriate symbol list
  // UI is not yet present. Its purpose is to show the UI within a reasonable
  // amount of time. If the UI is already present — for instance, when
  // winnowing results in a project-wide symbol search — `timeoutMs` will be
  // omitted, and the provider can take as much time as it deems appropriate.
  timeoutMs?: number
};

type FileSymbolMeta = SymbolMeta & { type: 'file' };
type ProjectSymbolMeta = SymbolMeta & { type: 'project' | 'project-find' };

// Symbol metadata that will be passed to the `canProvideSymbols` method.
export type PreliminarySymbolMeta = Omit<SymbolMeta, 'signal'>;

export interface SymbolProvider {
  // A human-readable name for your provider. This name may be displayed to the
  // user, and it's how they can configure `symbols-view` to prefer
  // certain providers over others.
  name: string,

  // The name of your package. This is present so that the user can find out
  // where a given provider comes from. In the settings for preferring certain
  // providers over others, a package name can be specified instead of a
  // specific provider name — either because that's the value the user
  // remembers, or because the package contains several providers and the user
  // wishes to express a preference for all those providers at once.
  packageName: string,

  // If present, will be called on window teardown, or if `symbols-view`
  // or the provider's own package is disabled.
  destroy?(): void,

  // An optional method. If it exists, the main package will use it to register
  // a callback so that it can clear the cache of this provider's symbols.
  //
  // The main package will automatically clear its cache for these reasons:
  //
  // * when the main package's config changes (entire cache);
  // * when any provider is activated or deactivated (single provider's cache);
  // * when the buffer is modified in any of several ways, including grammar
  //   change, save, or buffer change (entire cache).
  //
  // If your provider may have its cache invalidated for reasons not in this
  // list, you should implement `onShouldClearCache` and invoke any callback
  // that registers for it. The `EventEmitter` pattern found throughout Pulsar
  // is probably how you want to pull this off.
  onShouldClearCache?(callback: () => TextEditor): void,

  // Whether this provider aims to be the main symbol provider for a given
  // file. The “exclusive” provider competes with the other workhorse providers
  // of symbols like `ctags` and Tree-sitter to offer typical symbols like
  // classes, method names, and the like. A maximum of one exclusive provider
  // will be chosen for any task, depending on which one scores highest.
  //
  // “Supplemental” providers are those that contribute more specialized kinds
  // of symbols. These providers generally do not compete with exclusive
  // providers, or with each other, and can add symbols to any exclusive
  // provider’s results.
  isExclusive?: boolean,

  // Indicates whether the provider can provide symbols for a given task. Can
  // return either a boolean or a number; boolean `true` is equivalent to a
  // score of `1`, and boolean `false` is equivalent to a score of `0`.
  //
  // This method receives the same metadata bundle that will be present in the
  // subsequent call to `getSymbols`. The provider can inspect this metadata
  // and decide whether it can fulfill the given symbols request. It _should
  // not_ start the task of gathering symbols; the point of this method is to
  // determine which provider is best for the task without starting the work.
  //
  // Examples:
  //
  // * A provider that can analyze the current file, but not the entire
  //   project, should return `false` for any requests where `type` does not
  //   equal `file`.
  // * A provider that works by analyzing code on disk, rather than looking at
  //   the current unsaved contents of buffers, could return a slightly lower
  //   score if asked to complete symbols for a file that has been modified.
  //   This would indicate that it’d be a slightly worse than usual candidate.
  // * If my provider can do project-wide symbol search but _can't_ do a
  //   go-to-definition lookup, it can still serve as a fallback provider when
  //   `type` is `project-find`. But it should return a lower score to reflect
  //   that it's not the ideal choice.
  //
  // Since language server providers will have to ask their servers about
  // capabilities, this method can go async, though it’s strongly suggested to
  // keep it synchronous if possible. (The `timeoutMs` argument isn't yet
  // enforced on `canProvideSymbols`, but we reserve the right to start
  // enforcing it at any point without a bump in the service's version number.)
  //
  // To avoid a number war, any numeric value greater than `1` returned from
  // `canProvideSymbols` will be clamped to `1`. The user can break ties by
  // choosing their preferred providers in the package settings.
  canProvideSymbols(meta: PreliminarySymbolMeta): MaybePromise<boolean | number>,

  // Returns a list of symbols.
  //
  // If there are no results, you should return an empty array. If the request
  // is invalid or cannot be completed — for instance, if the user cancels the
  // task — you should return `null`.
  //
  // The second argument, `listController`, will be present _only_ for the
  // provider marked with `isExclusive: true`. It allows the provider to set
  // and clear UI messages if needed. Supplemental providers don't receive this
  // argument.
  //
  // This method can go async if needed. Whenever it performs an async task, it
  // should check `meta.signal` afterward to see if it should cancel.
  //
  // The `type` property of `meta` affects which symbols this method should
  // return:
  //
  // * If `type` is `file`, this method should return a full list of symbols
  //   for the current file.
  //
  // * If `type` is `project`, this method should return an _appropriate_ list
  //   of symbols for the project. The ideal approach would be to return only
  //   those results that match `meta.query`; you may choose not to return any
  //   symbols at all until `meta.query` is of a minimum length. But you may
  //   also return a full list of project symbols and rely on `symbols-view` to
  //   do all of the filtering as the user types. (In the latter case,
  //   `getSymbols` will still be called after each new keystroke; a future
  //   version of this service may offer a way to control that behavior.)
  //
  //   If you return an empty list when `meta.query` is too short, you should
  //   use `listController` to set a message in the UI so that users understand
  //   why.
  //
  // * If `type` is `project-find`, the user is trying to find where
  //   `meta.query` is defined (a go-to-definition request). If this provider
  //   knows how to do that, it should find the answer and return it as the
  //   _only_ symbol in the returned list. If it doesn't, it is allowed to
  //   treat this similarly to a project-wide symbol search and return more
  //   than one result.
  //
  getSymbols(meta: FileSymbolMeta, listController?: ListController): MaybePromise<FileSymbol[] | null>
  getSymbols(meta: ProjectSymbolMeta, listController?: ListController): MaybePromise<ProjectSymbol[] | null>
}

export type SymbolProviderMainModule = {
  activate(): void,
  deactivate(): void,

  // No business logic should go in here. If a package wants to provide symbols
  // only under certain circumstances, it should decide those circumstances on
  // demand, rather than return this provider only conditionally.
  //
  // A provider author may argue that they should be allowed to inspect the
  // environment before deciding what (or if) to return — but anything they'd
  // inspect is something that can change mid-session. Too complicated. All
  // provider decisions can get decided at runtime.
  //
  // So, for instance, if a certain provider only works with PHP files, it
  // should return its instance here no matter what, and that instance can
  // respond to `canProvideSymbols` with `false` if the given editor isn't
  // using a PHP grammar. It shouldn't try to get clever and bail out entirely
  // if, say, the project doesn't have any PHP files on load — because, of
  // course, it _could_ add a PHP file at any point, and we're not going to
  // revisit the decision later.
  //
  // Likewise, if a provider depends upon a language server that may or may not
  // be running, it should not try to be clever about what it returns from
  // `provideSymbols`. Instead, it should return early from `canProvideSymbols`
  // when the language server isn't running.
  //
  // A single package can supply multiple providers if need be.
  //
  provideSymbols(): SymbolProvider | SymbolProvider[],
};
