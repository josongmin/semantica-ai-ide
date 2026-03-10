#!/usr/bin/env bash
# Phase 0 alias 적용: tsconfig.json + vite.config.ts 수정
# 실행: ./scripts/apply-phase0-alias.sh [--dry-run]
#
# 변경 사항:
# 1. ~entities/* → src/shared/entities/* 로 리매핑
# 2. ~domains/* → src/domains/* 추가

set -e
cd "$(dirname "$0")/.."
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

echo "=== Phase 0: Alias 적용 ==="

apply_tsconfig() {
  local file=tsconfig.json
  if $DRY_RUN; then
    echo "[DRY-RUN] $file 수정"
    grep -A2 '"paths"' "$file" || true
    return
  fi
  # jq로 paths 수정 (jq 없으면 수동 안내)
  if command -v jq &>/dev/null; then
    jq '.compilerOptions.paths["~entities/*"] = ["src/shared/entities/*"] | .compilerOptions.paths["~domains/*"] = ["src/domains/*"]' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    echo "✅ $file 수정됨"
  else
    echo "⚠️  jq 없음. tsconfig.json paths 수동 수정:"
    echo '   "~entities/*": ["src/shared/entities/*"]'
    echo '   "~domains/*": ["src/domains/*"]'
  fi
}

apply_vite() {
  local file=vite.config.ts
  if $DRY_RUN; then
    echo "[DRY-RUN] $file 수정"
    grep "~entities\|~domains" "$file" 2>/dev/null || true
    return
  fi
  if [[ ! -f "$file" ]]; then return; fi
  # ~entities 경로 변경: src/entities → src/shared/entities
  sed -i.bak 's|URL("./src/entities"|URL("./src/shared/entities"|' "$file"
  # ~domains 추가 (~surfaces 다음)
  if ! grep -q '"~domains"' "$file"; then
    # macOS sed: a\ 다음 줄에 추가할 텍스트
    sed -i.bak '/"~surfaces":/a\
      "~domains": fileURLToPath(new URL("./src/domains", import.meta.url)),
' "$file"
  fi
  rm -f "$file.bak"
  echo "✅ $file 수정됨"
}

apply_tsconfig
apply_vite

echo ""
echo "검증: pnpm run build"
