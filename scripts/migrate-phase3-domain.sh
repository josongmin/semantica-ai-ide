#!/usr/bin/env bash
# Phase 3: 단일 도메인 이전
# 실행: ./scripts/migrate-phase3-domain.sh <domain> [--dry-run]
# 예:   ./scripts/migrate-phase3-domain.sh overview --dry-run

set -e
cd "$(dirname "$0")/.."
SRC=src
DRY_RUN=false

DOMAIN="${1:-}"
[[ -z "$DOMAIN" ]] && { echo "사용법: $0 <domain> [--dry-run]"; exit 1; }
[[ "${2:-}" == "--dry-run" ]] && DRY_RUN=true

DEST="$SRC/domains/$DOMAIN"

# 도메인별 페이지 흡수 매핑 (RFC 6.5)
declare -A PAGE_MAP
PAGE_MAP[review]="pages/review"
PAGE_MAP[tasks]="pages/todo-board"
PAGE_MAP[settings]="pages/settings"

run() {
  if $DRY_RUN; then
    echo "[DRY-RUN] $*"
  else
    "$@"
  fi
}

echo "=== Phase 3: $DOMAIN 도메인 이전 ==="

# 1. 도메인 구조 생성
for sub in entities features widgets pages; do
  run mkdir -p "$DEST/$sub"
done

# 2. surfaces/<domain> 이동
if [[ -d "$SRC/surfaces/$DOMAIN" ]]; then
  echo "이동: surfaces/$DOMAIN"
  for f in "$SRC/surfaces/$DOMAIN"/*; do
    [[ -e "$f" ]] || continue
    run cp -r "$f" "$DEST/"
  done
fi

# 3. pages 흡수
PAGE_SRC="${PAGE_MAP[$DOMAIN]:-}"
if [[ -n "$PAGE_SRC" ]]; then
  base=$(dirname "$PAGE_SRC")
  name=$(basename "$PAGE_SRC")
  if [[ -d "$SRC/$PAGE_SRC" ]]; then
    echo "이동: $PAGE_SRC → domains/$DOMAIN/pages/$name"
    run cp -r "$SRC/$PAGE_SRC" "$DEST/pages/"
  fi
fi

echo ""
echo "⚠️  $DOMAIN features/widgets/entities 매핑은 RFC 5장 참고"
echo "   이 스크립트는 구조+surface+pages만 처리. features/widgets는 수동 또는 별도 스크립트"
