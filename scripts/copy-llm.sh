#!/usr/bin/env bash
# Fast clipboard copy — no Node on the default path.
#   npm run copy:llm
#   npm run copy:llm -- --fresh
#   npm run copy:llm -- --full
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUNDLE="$ROOT/tests/exports/llm-paste-bundle.txt"
JSON="$ROOT/tests/exports/verification-report.json"

fresh=false
full=false
for arg in "$@"; do
  case "$arg" in
    --fresh) fresh=true ;;
    --full)  full=true ;;
  esac
done

if $full; then
  node "$ROOT/scripts/export-verification.mjs"
elif $fresh || [[ ! -f "$BUNDLE" ]]; then
  if $fresh || [[ ! -f "$JSON" ]]; then
    node "$ROOT/scripts/export-verification.mjs" --quick
  else
    node "$ROOT/scripts/build-llm-bundle.mjs"
  fi
fi

if [[ ! -f "$BUNDLE" ]]; then
  echo "Missing $BUNDLE — run: npm run export:verification:quick" >&2
  exit 1
fi

if wl-copy < "$BUNDLE" 2>/dev/null; then
  via=wl-copy
elif xclip -selection clipboard < "$BUNDLE" 2>/dev/null; then
  via=xclip
elif xsel --clipboard --input < "$BUNDLE" 2>/dev/null; then
  via=xsel
else
  echo "No clipboard tool found (install wl-clipboard, xclip, or xsel)." >&2
  exit 1
fi

kb="$(du -k "$BUNDLE" | cut -f1)"
echo "Copied to clipboard via $via (${kb} KB)"
if ! $fresh && ! $full; then
  echo "(cached bundle — use --fresh to refresh behaviors, --full for all gates)"
fi
