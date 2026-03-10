#!/usr/bin/env bash
# Phase 4: 빈 폴더 제거 및 정리
# 실행: ./scripts/migrate-phase4-cleanup.sh [--dry-run]

set -e
cd "$(dirname "$0")/.."
SRC=src
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

run() {
  if $DRY_RUN; then
    echo "[DRY-RUN] $*"
  else
    "$@"
  fi
}

echo "=== Phase 4: 정리 ==="

# 빈 디렉터리 재귀 제거 (find로 빈 것만)
clean_empty() {
  local dir=$1
  [[ ! -d "$dir" ]] && return
  # 하위 빈 디렉터리부터 제거 (depth-first)
  find "$dir" -depth -type d -empty 2>/dev/null | while read -r d; do
    run rmdir "$d" 2>/dev/null || true
  done
}

for dir in entities features widgets pages surfaces; do
  full="$SRC/$dir"
  if [[ -d "$full" ]]; then
    echo "정리: $full"
    clean_empty "$full"
  fi
done

echo ""
echo "✅ Phase 4 완료. 남은 entities/features/widgets/pages/surfaces 확인"
echo "   REPO-STRUCTURE.md, RFC-010 수동 갱신 필요"
