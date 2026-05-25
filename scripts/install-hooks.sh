#!/usr/bin/env bash
# Install git hooks — optional local gate before commit/push.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL="${1:-all}"

install_hook() {
  local name="$1"
  local cmd="$2"
  local HOOK="$ROOT/.git/hooks/$name"
  cat > "$HOOK" << EOF
#!/usr/bin/env bash
set -euo pipefail
echo "$name: $cmd"
$cmd
EOF
  chmod +x "$HOOK"
  echo "Installed $HOOK"
}

case "$INSTALL" in
  pre-commit) install_hook "pre-commit" "npm test" ;;
  pre-push)   install_hook "pre-push" "npm run release" ;;
  all)
    install_hook "pre-commit" "npm test"
    install_hook "pre-push" "npm run release"
    ;;
  *) echo "Usage: npm run setup:hooks [pre-commit|pre-push|all]"; exit 1 ;;
esac

echo "Skip once with: git commit --no-verify  or  git push --no-verify"
