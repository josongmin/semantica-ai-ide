/**
 * 브라우저 개발 모드 메뉴 브릿지.
 *
 * 네이티브 메뉴바가 없는 환경(vite dev, 테스트)에서 사용.
 * 빌드/업데이트는 no-op, 액션 이벤트는 콘솔 로그만 출력.
 */
import { logger } from "../../../shared/lib/logger";
import type { ActionId, MenuBarDef, MenuState } from "../types";
import type { MenuBridge } from "./types";

export class DevMenuBridge implements MenuBridge {
  build(_def: MenuBarDef, _state: MenuState): Promise<void> {
    logger.debug("[DevMenuBridge] Menu bar built (no-op in browser)");
    return Promise.resolve();
  }

  async update(_def: MenuBarDef, _state: MenuState): Promise<void> {
    // no-op
  }

  onAction(_cb: (actionId: ActionId) => void): () => void {
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- intentional no-op cleanup for dev bridge
    return () => {};
  }

  dispose(): void {
    // no-op
  }
}
