import type { ActionId, MenuBarDef, MenuState } from "../types";

/**
 * 플랫폼별 네이티브 메뉴 바인딩 인터페이스.
 *
 * - TauriMenuBridge: Tauri v2 Menu API (macOS/Windows/Linux 네이티브)
 * - DevMenuBridge: 브라우저 개발 모드 (no-op)
 */
export interface MenuBridge {
  /** 메뉴바 초기 구성 */
  build(def: MenuBarDef, state: MenuState): Promise<void>;

  /** 상태 변경 시 메뉴 업데이트 */
  update(def: MenuBarDef, state: MenuState): Promise<void>;

  /** 메뉴 아이템 클릭 이벤트 구독 */
  onAction(cb: (actionId: ActionId) => void): () => void;

  /** 정리 */
  dispose(): void;
}
