/**
 * Action Registry — OCP-compliant menu action dispatch.
 *
 * 각 액션 그룹이 모듈 스코프에서 registerMenuAction()을 호출하여
 * 핸들러를 등록한다. dispatchMenuAction()은 등록된 핸들러를 조회·실행한다.
 */
 
import type { createStore } from "jotai";

import { logger } from "../../shared/lib/logger";
import type { ActionId } from "./types";

type Store = ReturnType<typeof createStore>;
type ActionHandler = (store: Store) => Promise<void> | void;

const registry = new Map<ActionId, ActionHandler>();

/** Register a menu action handler. Called at module scope by each action group. */
export function registerMenuAction(id: ActionId, handler: ActionHandler): void {
  registry.set(id, handler);
}

/** Register multiple actions with the same handler. */
export function registerMenuActions(ids: readonly ActionId[], handler: ActionHandler): void {
  for (const id of ids) registry.set(id, handler);
}

/** Dispatch a menu action to its registered handler. */
export async function dispatchMenuAction(store: Store, actionId: ActionId): Promise<void> {
  const handler = registry.get(actionId);
  if (handler) {
    await handler(store);
  } else {
    logger.warn(`[menu] no handler registered for action: ${actionId}`);
  }
}
