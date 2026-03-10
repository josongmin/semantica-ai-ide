#!/usr/bin/env bash
# Phase 2: chat 도메인 파일럿 이전
# 실행: ./scripts/migrate-phase2-chat.sh [--dry-run]
#
# 전제: Phase 1 완료, ~domains/* alias 설정됨
# 주의: 이동 후 import 경로 수동 정리 필요 (codemod 또는 IDE 리팩터)

set -e
cd "$(dirname "$0")/.."
SRC=src
DOMAIN=chat
DEST="$SRC/domains/$DOMAIN"
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# RFC 5장: chat 도메인 관련 / pages 흡수
# 이동 순서: structure → surface → pages → features → widgets

CHAT_FEATURES=(
  send-message
  streaming
  prompt-history
  clear-conversation
  auto-compact
  arena-mode
  multi-agent-debate
  copy-conversation
  edit-message
  # 추가: ChatSubheader, ChatPage 등에서 참조하는 feature
)

CHAT_WIDGETS=(
  message-list
  message-row
  prompt-box
  turn-container
  turn-toc
  turn-metrics
  turn-bookmark
  arena-view
  user-input-card
  agent-command-card
  header-bar
  feature-bar
  approval-banner
  # ChatFooter, ChatSubheader 등에서 참조 - 일부는 shared로 갈 수 있음
)

run() {
  if $DRY_RUN; then
    echo "[DRY-RUN] $*"
  else
    "$@"
  fi
}

echo "=== Phase 2: chat 도메인 이전 ==="

# 1. 도메인 구조 생성
echo "1. 도메인 구조 생성"
for sub in entities features widgets pages pages/arena pages/sessions; do
  run mkdir -p "$DEST/$sub"
done

# 2. surfaces/chat → domains/chat
echo "2. surfaces/chat 이동"
if [[ -d "$SRC/surfaces/$DOMAIN" ]]; then
  for f in "$SRC/surfaces/$DOMAIN"/*; do
    [[ -e "$f" ]] || continue
    run cp -r "$f" "$DEST/"
  done
  # 원본 삭제은 import 정리 후에
  echo "   (원본 surfaces/chat은 import 정리 후 제거)"
fi

# 3. pages 흡수
echo "3. pages 흡수"
[[ -d "$SRC/pages/$DOMAIN" ]] && run cp -r "$SRC/pages/$DOMAIN"/* "$DEST/pages/" || true
[[ -d "$SRC/pages/arena" ]]    && run cp -r "$SRC/pages/arena" "$DEST/pages/" || true
[[ -d "$SRC/pages/session-list" ]] && run cp -r "$SRC/pages/session-list" "$DEST/pages/sessions" || true

# 4. features 이동 (실제 존재하는 것만)
echo "4. chat features 이동"
for name in "${CHAT_FEATURES[@]}"; do
  src="$SRC/features/$name"
  if [[ -d "$src" ]]; then
    run cp -r "$src" "$DEST/features/" || true
    echo "   + $name"
  fi
done

# 5. widgets 이동
echo "5. chat widgets 이동"
for name in "${CHAT_WIDGETS[@]}"; do
  src="$SRC/widgets/$name"
  if [[ -d "$src" ]]; then
    run cp -r "$src" "$DEST/widgets/" || true
    echo "   + $name"
  fi
done

# 6. domains/chat/index.ts 생성 (registerSurface)
if [[ ! -f "$DEST/index.ts" ]] && ! $DRY_RUN; then
  cat > "$DEST/index.ts" << 'EOF'
import { lazy } from "react";
import { registerSurface } from "../../surfaces/surfaceRegistry";

registerSurface({
  id: "chat",
  label: "Chat",
  icon: "comment-discussion",
  persistence: "session",
  priority: 10,
  component: lazy(() =>
    import("./ChatSurface").then((m) => ({ default: m.ChatSurface })),
  ),
});

export { ChatSurface } from "./ChatSurface";
EOF
  echo "6. domains/chat/index.ts 생성"
fi

echo ""
echo "⚠️  주의: cp 사용. import 경로 정리 후 git mv로 원본 제거"
echo "   bootstrapFeatures.ts: import '../surfaces/chat' → import '~domains/chat'"
echo "   App.tsx 등: pages/chat → domains/chat/pages"
