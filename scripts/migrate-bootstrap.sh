#!/usr/bin/env bash
# Bootstrap 이전: shared/bootstrap으로 크로스커팅 feature 이동
# RFC 4.2 기준. 실행: ./scripts/migrate-bootstrap.sh [--dry-run]

set -e
cd "$(dirname "$0")/.."
SRC=src
FEATURES_SRC="$SRC/features"
BOOTSTRAP_DEST="$SRC/shared/bootstrap"
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# bootstrapFeatures.ts에서 import하는 feature들 (shared/bootstrap으로 이동)
BOOTSTRAP_FEATURES=(
  theme-settings
  session-lifecycle
  scope-guard
  approval-gate
  session-shortcuts
  send-message
  diff-review
  slash-command
  keyboard-navigation
  background-agent
  terminal-bridge
  resource-monitor
  intent-tracking
  semantic-diff
  transactional-edit
  workspace-awareness
  workspace-graph
)

# terminal은 bootstrapFeatures에서 useTerminalBootstrap 사용 - features/terminal
BOOTSTRAP_FEATURES+=( terminal )

run() {
  if $DRY_RUN; then
    echo "[DRY-RUN] $*"
  else
    "$@"
  fi
}

echo "=== Bootstrap 이전 ==="

for name in "${BOOTSTRAP_FEATURES[@]}"; do
  src="$FEATURES_SRC/$name"
  if [[ ! -d "$src" ]]; then
    echo "⚠️  건너뜀 (없음): $name"
    continue
  fi
  echo "이동: $name"
  run git mv "$src" "$BOOTSTRAP_DEST/"
done

echo ""
echo "✅ Bootstrap 이동 완료. bootstrapFeatures.ts import를 ~shared/bootstrap/... 로 수동 수정 필요"
