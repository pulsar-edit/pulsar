#!/usr/bin/env bash
#
# Verifies two things about the native modules we've just built:
#
# 1. They don't reference `glibc` or `libstdc++` symbols newer than the floor
#    we promise to support.
# 2. None of them carries its own copy of the C++ runtime.
#
# We build our Linux binaries in an old OS image (`manylinux_2_28`) so that
# they keep working on old distros, with a much newer GCC from Red Hat's
# `gcc-toolset`, because Electron's V8 requires a compiler that understands
# C++20. (See `.github/workflows/build.yml` for the full story.)
#
# Both checks guard against failures that are invisible in CI. The build goes
# green and the tests pass on the modern runner we test on, and then:
#
# * if (1) is violated, the binary refuses to load on the older distro it was
#   supposed to support, with an error like
#
#       /lib/x86_64-linux-gnu/libstdc++.so.6: version `GLIBCXX_3.4.29' not found
#
# * if (2) is violated, the module loads fine but its private C++ runtime
#   fights with the system one that GTK, Mesa, etc. have already loaded, and
#   the renderer segfaults the first time the module uses an iostream. Pulsar
#   1.133.0 shipped like this (pulsar-edit/pulsar#1685), having passed (1)
#   with flying colors — a statically linked runtime has no version
#   requirements to violate.
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

  # A module that _defines_ the C++ exception personality routine or the
  # internals of `std::locale` has a C++ runtime linked into it; a module that
  # uses the system's `libstdc++` merely references them (`*UND*`).
  if objdump -T "$binary" 2>/dev/null | grep -v '\*UND\*' | grep -qE '__gxx_personality_v0|_ZNSt6locale'; then
    violations=$((violations + 1))
    echo "FAIL ${binary}"
    echo "    contains its own copy of the C++ runtime (statically linked libstdc++)"
    continue
  fi

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

# A guard that silently passes because it looked in the wrong place is worse
# than no guard at all. If we found nothing to check, that's a bug in how we
# were invoked, not a clean bill of health.
if [ "$checked" -eq 0 ]; then
  echo "error: found no *.node files under '${ROOT}'; expected at least one." >&2
  echo "       (Has the build run yet? Is the path right?)" >&2
  exit 1
fi

if [ "$violations" -gt 0 ]; then
  cat >&2 <<'EOF'

error: one or more native modules either require a newer C/C++ runtime than
we support (they would fail to load on older Linux distributions) or contain
their own copy of the C++ runtime (they would crash Pulsar's renderer).

The usual causes:

  * Something linked a module with `-static-libstdc++`. Don't: our toolchain
    (`gcc-toolset`) already reconciles a new compiler with the system
    `libstdc++`, and a second runtime in the process crashes it.
  * A build step used a compiler other than the image's `gcc-toolset` — e.g.,
    because CC/CXX were overridden — so the module wants that compiler's newer
    `libstdc++` at runtime.
  * A third-party prebuilt binary was built against a newer `glibc` or
    `libstdc++` than we support.

Fix the build rather than raising MAX_GLIBC_VERSION / MAX_GLIBCXX_VERSION —
raising them drops support for distros we currently ship to.
EOF
  exit 1
fi

echo "All native modules are within the supported ABI floor."
