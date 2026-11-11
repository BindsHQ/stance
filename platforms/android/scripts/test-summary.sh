#!/bin/sh
# Prints test totals from Gradle's JUnit XML reports. Usage: scripts/test-summary.sh [dir ...]
for dir in "$@"; do
  find "$dir" -name 'TEST-*.xml' 2>/dev/null | xargs grep -ho '<testsuite [^>]*' 2>/dev/null |
    awk -v d="$dir" '{
      for (i = 1; i <= NF; i++) {
        if ($i ~ /^tests=/) { gsub(/[^0-9]/, "", $i); t += $i }
        if ($i ~ /^failures=/) { gsub(/[^0-9]/, "", $i); f += $i }
        if ($i ~ /^errors=/) { gsub(/[^0-9]/, "", $i); e += $i }
        if ($i ~ /^skipped=/) { gsub(/[^0-9]/, "", $i); s += $i }
      }
    } END { printf "%s: %d tests, %d failures, %d errors, %d skipped\n", d, t, f, e, s }'
done
