#!/usr/bin/env bash
# Phase 1: shared/entities로 엔티티 이동
# 전제: tsconfig + vite에서 ~entities가 src/shared/entities를 가리키도록 이미 수정됨
# 실행: ./scripts/migrate-phase1-entities.sh [--dry-run]

set -e
cd "$(dirname "$0")/.."
SRC=src
ENTITIES_SRC="$SRC/entities"
ENTITIES_DEST="$SRC/shared/entities"
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# RFC 6.3: shared로 이동할 엔티티 (교차 도메인 사용)
SHARED_ENTITIES=(
  message
  session
  diff
  timeline-event
  tool-call
  turn-pipeline
  project-todo
  agent-instance
  git-history
  arena
  transaction
  completion-settings
  mcp
  mcp-app
)

run() {
  if $DRY_RUN; then
    echo "[DRY-RUN] $*"
  else
    "$@"
  fi
}

echo "=== Phase 1: shared/entities 이전 ==="

for name in "${SHARED_ENTITIES[@]}"; do
  src="$ENTITIES_SRC/$name"
  if [[ ! -d "$src" ]]; then
    echo "⚠️  건너뜀 (없음): $name"
    continue
  fi
  echo "이동: $name"
  run git mv "$src" "$ENTITIES_DEST/"
done

echo ""
echo "✅ Phase 1 완료. pnpm run build && pnpm run test 로 검증"
