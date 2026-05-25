#!/usr/bin/env bash
# Install a pre-commit hook that runs npm test. Optional — CI also runs on push.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$ROOT/.git/hooks/pre-commit"

cat > "$HOOK" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "pre-commit: running npm test…"
npm test
EOF

chmod +x "$HOOK"
echo "Installed $HOOK"
echo "Skip once with: git commit --no-verify"
