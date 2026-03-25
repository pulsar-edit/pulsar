function normalizeSegment(segment) {
    if (!segment.startsWith('.')) return segment;
    return segment.substring(1);
}

function segmentsMatch(
    descriptorSegment,
    selectorSegment,
    { enforceSegmentOrder = false } = {}
) {
    let descriptorParts = normalizeSegment(descriptorSegment).split('.');
    let selectorParts = normalizeSegment(selectorSegment).split('.');

    if (selectorParts.length > descriptorParts.length) {
        return false;
    }

    // Remove all parts from the descriptor scope name that aren't present in the
    // selector scope name.
    for (let i = descriptorParts.length - 1; i >= 0; i--) {
        let part = descriptorParts[i];
        if (!selectorParts.includes(part)) {
            descriptorParts.splice(i, 1);
        }
    }
    // Does order matter? It would if this were a TextMate scope, but Atom has
    // broadly treated `.function.entity` as equivalent to `.entity.function`,
    // even though it causes headaches in some places.
    //
    // We'll assume that order doesn't matter, but the user can opt into strict
    // ordering if they want.
    if (!enforceSegmentOrder) {
        descriptorParts.sort();
        selectorParts.sort();
    }
    return descriptorParts.join('.') === selectorParts.join('.');
}

class ScopeSelector {
    static create(stringOrScopeSelector) {
        if (typeof stringOrScopeSelector === 'string') {
            return new ScopeSelector(stringOrScopeSelector);
        } else if (stringOrScopeSelector instanceof ScopeSelector) {
            return stringOrScopeSelector;
        } else {
            throw new TypeError(`Invalid argument`);
        }
    }

    constructor(selectorString) {
        this.selectorString = selectorString;
        this.variations = selectorString.split(/,\s*/);
    }

    matches(scopeDescriptorOrArray, rawOptions = {}) {
        let options = {
            // Whether to treat (e.g.) `.function.entity` as distinct from
            // `.entity.function`. Defaults to `false` to match prevailing Atom
            // behavior.
            enforceSegmentOrder: false,
            ...rawOptions,
        };
        let scopeList;
        if (Array.isArray(scopeDescriptorOrArray)) {
            scopeList = scopeDescriptorOrArray;
        } else {
            scopeList = scopeDescriptorOrArray.getScopesArray();
        }

        return this.variations.some((variation) =>
            this.matchesVariation(scopeList, variation, options)
        );
    }

    matchesVariation(scopeList, selectorString, options) {
        let parts = selectorString.split(/\s+/);
        if (parts.length > scopeList.length) return false;

        let lastIndex = -1;

        outer: for (let selectorPart of parts) {
            // Find something in the descriptor that matches this selector part.
            for (let [i, descriptorPart] of scopeList.entries()) {
                // Ignore everything before our index cursor; this is what enforces the
                // ordering of the scope selector.
                if (i <= lastIndex) continue;
                let doesMatch = segmentsMatch(
                    descriptorPart,
                    selectorPart,
                    options
                );
                if (doesMatch) {
                    lastIndex = i;
                    continue outer;
                }
            }
            // If we get this far, we searched the entire descriptor list for a
            // selector part and failed to find it; hence this variation doesn't
            // match.
            return false;
        }
        // If we get this far, we made it through the entire gauntlet without
        // hitting the early return. This variation matches!
        return true;
    }
}

// Private: A candidate for possible addition to the {ScopeDescriptor} API.
//
// Tests whether the given scope descriptor matches the given scope selector.
//
// A subset of the full TextMate scope selector syntax is supported:
//
// * Descendant scopes (e.g., `source.python string`); this function will
//   enforce the ordering of segments.
// * Variations (e.g., `comment.block, string.quoted`); this function will
//   return true if any of the variations match.
//
// Not supported:
//
// * Subtraction syntax (e.g., `comment - block`).
// * Left/right edge syntax (e.g., `L:comment.block`).
//
// For example: given the scope descriptor…
//
// [
//   'source.js',
//   'meta.block.function.js',
//   'string.quoted.single.js'
// ]
//
// …here are outcomes of various tests:
//
// scopeDescriptorMatchesSelector(descriptor, `source`) // -> true
// scopeDescriptorMatchesSelector(descriptor, `text`) // -> false
// scopeDescriptorMatchesSelector(descriptor, `source.js`) // -> true
// scopeDescriptorMatchesSelector(descriptor, `source.python`) // -> false
// scopeDescriptorMatchesSelector(descriptor, `source.js meta.block.function.js`) // -> true
// scopeDescriptorMatchesSelector(descriptor, `source meta`) // -> true
// scopeDescriptorMatchesSelector(descriptor, `source meta.block.class`) // -> false
// scopeDescriptorMatchesSelector(descriptor, `source meta string`) // -> true
// scopeDescriptorMatchesSelector(descriptor, `source string`) // -> true
// scopeDescriptorMatchesSelector(descriptor, `source string meta`) // -> false
//
// - `scopeDescriptor` A {ScopeDescriptor} or a scope descriptor {Array}.
// - `selector` A {String} representing a scope selector.
function scopeDescriptorMatchesSelector(scopeDescriptor, selector) {
    let scopeSelector = ScopeSelector.create(selector);
    return scopeSelector.matches(scopeDescriptor);
}

module.exports = {
    scopeDescriptorMatchesSelector,
};
