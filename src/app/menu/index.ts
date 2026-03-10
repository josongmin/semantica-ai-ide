/**
 * App Menu 부트스트랩 진입점.
 *
 * App.tsx에서 1회 호출하여 네이티브 메뉴바를 초기화한다.
 * Tauri 환경이면 TauriMenuBridge, 그 외에는 DevMenuBridge를 사용.
 */
import type { createStore } from "jotai";

import { logger } from "../../shared/lib/logger";
import { DevMenuBridge, TauriMenuBridge } from "./bridge";
import type { MenuBridge } from "./bridge/types";
import { buildMenuBar } from "./definitions";
import { dispatchMenuAction } from "./menuActions";
import { snapshotMenuState } from "./menuState";
import type { ActionId } from "./types";

type Store = ReturnType<typeof createStore>;

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

/**
 * 메뉴 시스템을 초기화한다.
 *
 * @returns cleanup 함수 (App unmount 시 호출)
 */
export async function initAppMenu(store: Store): Promise<() => void> {
  const bridge: MenuBridge = isTauri()
    ? new TauriMenuBridge()
    : new DevMenuBridge();

  const getState = () => snapshotMenuState(store);

  // 1. 초기 빌드
  const initialState = getState();
  await bridge.build(buildMenuBar(initialState), initialState);

  // 2. 상태 변경 시 메뉴 업데이트 (300ms debounce)
  const rebuildMenu = debounce(() => {
    const state = getState();
    bridge.update(buildMenuBar(state), state).catch((e: unknown) => {
       
      logger.warn("[initAppMenu] Menu update failed:", e);
    });
  }, 300);

  // 주요 atom들의 변경을 구독
  const unsubs: (() => void)[] = [];
  try {
    const { currentPageAtom, fileTreePanelVisibleAtom } = await import("../../shared/lib/atoms/uiAtoms");
    const { approvalModeAtom } = await import("~entities/session/settings");

    unsubs.push(store.sub(currentPageAtom, rebuildMenu));
    unsubs.push(store.sub(fileTreePanelVisibleAtom, rebuildMenu));
    unsubs.push(store.sub(approvalModeAtom, rebuildMenu));
  } catch {
    // 구독 실패해도 메뉴는 정적으로 동작
  }

  // 3. 메뉴 액션 → Jotai dispatch
  const unaction = bridge.onAction((actionId: ActionId) => {
    dispatchMenuAction(store, actionId).catch((e: unknown) => {
       
      logger.warn("[initAppMenu] Action dispatch failed:", e);
    });
  });

  // 4. Cleanup
  return () => {
    unsubs.forEach((u) => u());
    unaction();
    bridge.dispose();
  };
}

// Re-exports
export { buildMenuBar } from "./definitions";
export type { ActionId,MenuBarDef, MenuState } from "./types";
export { ACTION_IDS } from "./types";
