/**
 * Jotai store → MenuState 스냅샷 변환.
 *
 * 메뉴 빌드에 필요한 앱 상태만 추출한다.
 * 새 atom이 추가되면 여기만 수정하면 된다.
 */
import type { Atom,createStore } from "jotai";

import { approvalModeAtom } from "~entities/session/settings";

import { currentPageAtom, fileTreePanelVisibleAtom } from "../../shared/lib/atoms/uiAtoms";
import type { MenuState } from "./types";

type Store = ReturnType<typeof createStore>;

export function snapshotMenuState(store: Store): MenuState {
  return {
    agentStatus: "idle",
    approvalMode: safeGet(store, approvalModeAtom, "auto"),
    requestMode: "ask",
    currentModel: "opus",
    currentPage: safeGet(store, currentPageAtom, "chat"),
    hasActiveSession: true,
    sidebarVisible: safeGet(store, fileTreePanelVisibleAtom, false),
    featureBarVisible: false,
    focusMode: false,
  };
}

function safeGet<T>(store: Store, atom: Atom<T>, fallback: T): T {
  try {
    return store.get(atom) ?? fallback;
  } catch {
    return fallback;
  }
}
