import type { MenuBarDef, MenuState } from "../types";
import { buildAgentMenu } from "./agentMenu";
import { buildEditMenu } from "./editMenu";
import { buildHelpMenu } from "./helpMenu";
import { buildNavigateMenu } from "./navigateMenu";
import { buildSemanticaMenu } from "./semanticaMenu";
import { buildSessionMenu } from "./sessionMenu";
import { buildViewMenu } from "./viewMenu";
import { buildWindowMenu } from "./windowMenu";

/**
 * 전체 메뉴바 정의를 빌드한다.
 * 순수 함수 — MenuState를 받아 MenuBarDef를 반환.
 */
export function buildMenuBar(state: MenuState): MenuBarDef {
  return {
    menus: [
      buildSemanticaMenu(),
      buildSessionMenu(state),
      buildEditMenu(),
      buildViewMenu(state),
      buildAgentMenu(state),
      buildNavigateMenu(),
      buildWindowMenu(),
      buildHelpMenu(),
    ],
  };
}
