#!/usr/bin/env bash
# Phase 0: 디렉터리 생성
# 실행: ./scripts/migrate-phase0.sh [--dry-run]

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

echo "=== Phase 0: 디렉터리 생성 ==="

# shared 확장
run mkdir -p "$SRC/shared/entities"
run mkdir -p "$SRC/shared/bootstrap"

# domains 루트
run mkdir -p "$SRC/domains"

echo "생성된 구조:"
$DRY_RUN && run true || true
find "$SRC/shared/entities" "$SRC/shared/bootstrap" "$SRC/domains" -type d 2>/dev/null | sort || true

echo ""
echo "✅ Phase 0 완료. 다음: tsconfig.json, vite.config.ts에 alias 추가"
echo "   - ~entities/* → src/shared/entities/* (Phase 1 직전)"
echo "   - ~domains/* → src/domains/*"
