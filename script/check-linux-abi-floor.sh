#!/usr/bin/env bash
#
# Verifies that the native modules we've just built don't reference `glibc` or
# `libstdc++` symbols newer than the floor we promise to support.
#
# We build our Linux binaries in an old Debian image specifically so that they
# keep working on old distros. But the compiler we use for the
# `electron-rebuild` step is *not* the one that ships with that image — it's a
# much newer GCC, vendored from conda-forge, because Electron's V8 requires a
# compiler that understands C++20. (See `.github/workflows/build.yml` for the
# full story.)
#
# That combination is exactly the kind of thing that fails silently: the build
# goes green, the tests pass on the modern runner we test on, and then the
# binary refuses to load on the older distro it was supposed to support, with
# an error like:
#
#     /lib/x86_64-linux-gnu/libstdc++.so.6: version `GLIBCXX_3.4.29' not found
#
# So instead of trusting that our `-static-libstdc++` and `-I/usr/include`
# flags did their job, we check.
#
# Usage:
#   script/check-linux-abi-floor.sh [root-directory]
#
# Environment:
#   MAX_GLIBC_VERSION    Highest permitted GLIBC_* symbol version   (e.g. 2.31)
#   MAX_GLIBCXX_VERSION  Highest permitted GLIBCXX_* symbol version (e.g. 3.4.28)

set -euo pipefail

ROOT="${1:-node_modules}"
MAX_GLIBC_VERSION="${MAX_GLIBC_VERSION:-2.31}"
MAX_GLIBCXX_VERSION="${MAX_GLIBCXX_VERSION:-3.4.28}"

if ! command -v objdump > /dev/null 2>&1; then
  echo "error: objdump not found; install binutils." >&2
  exit 1
fi

# Returns success if $1 is greater than $2, comparing as dotted version
# numbers. `sort -V` does the actual work; we just check whether the larger of
# the two is the one we were asked about.
version_gt() {
  [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -n1)" = "$1" ]
}

echo "Checking native modules under '${ROOT}'…"
echo "  glibc floor:     ${MAX_GLIBC_VERSION}"
echo "  libstdc++ floor: ${MAX_GLIBCXX_VERSION}"
echo

checked=0
violations=0

while IFS= read -r -d '' binary; do
  checked=$((checked + 1))

  # Undefined symbols in the dynamic table carry the version of the library
  # they expect, e.g. `GLIBC_2.34` or `GLIBCXX_3.4.29`. Those versions are the
  # actual runtime requirement — anything statically linked doesn't show up
  # here at all, which is the whole point.
  symbols="$(objdump -T "$binary" 2>/dev/null | grep -oE '(GLIBC|GLIBCXX)_[0-9][0-9.]*' | sort -u || true)"
  [ -z "$symbols" ] && continue

  offenders=""
  while IFS= read -r symbol; do
    [ -z "$symbol" ] && continue
    case "$symbol" in
      GLIBCXX_*)
        version="${symbol#GLIBCXX_}"
        max="$MAX_GLIBCXX_VERSION"
        ;;
      GLIBC_*)
        version="${symbol#GLIBC_}"
        max="$MAX_GLIBC_VERSION"
        ;;
      *)
        continue
        ;;
    esac

    if version_gt "$version" "$max"; then
      offenders="${offenders}    ${symbol} (floor is ${max})"$'\n'
    fi
  done <<< "$symbols"

  if [ -n "$offenders" ]; then
    violations=$((violations + 1))
    echo "FAIL ${binary}"
    printf '%s' "$offenders"
  fi
done < <(find "$ROOT" -name '*.node' -type f -print0)

echo
echo "Checked ${checked} native module(s)."

if [ "$violations" -gt 0 ]; then
  cat >&2 <<'EOF'

error: one or more native modules require a newer C/C++ runtime than we
support. These binaries would fail to load on older Linux distributions.

The usual causes:

  * The vendored conda-forge toolchain was used without
    `-static-libstdc++ -static-libgcc` in LDFLAGS, so the module now wants
    that toolchain's newer libstdc++ at runtime.
  * A build step compiled against the conda environment's headers instead of
    the system ones in /usr/include, raising the glibc requirement.
  * A dependency grew a new build configuration that ignores our CFLAGS.

Fix the flags rather than raising MAX_GLIBC_VERSION / MAX_GLIBCXX_VERSION —
raising them drops support for distros we currently ship to.
EOF
  exit 1
fi

echo "All native modules are within the supported ABI floor."
