/**
 * Tauri v2 네이티브 메뉴 브릿지.
 *
 * @tauri-apps/api/menu 를 사용하여 OS 네이티브 메뉴바를 구성한다.
 * Tauri 환경에서만 런타임 import되며, 브라우저에서는 DevMenuBridge가 사용된다.
 *
 * NOTE: @tauri-apps/api는 Tauri 빌드 시에만 resolve됨.
 * 브라우저 개발 시에는 이 클래스가 인스턴스화되지 않으므로 import 실패해도 무관.
 */
import { logger } from "../../../shared/lib/logger";
import type { ActionId, MenuBarDef, MenuItemDef, MenuState } from "../types";
import type { MenuBridge } from "./types";

type ActionCallback = (actionId: ActionId) => void;

interface TauriMenuInstance {
  setAsAppMenu: () => Promise<void>;
  [key: string]: unknown;
}

interface TauriMenuClass {
  // Tauri v2 menu classes use .new() as a static async factory
  new: (opts: Record<string, unknown>) => Promise<TauriMenuInstance>;
}

interface TauriMenuModule {
  Menu: TauriMenuClass;
  Submenu: TauriMenuClass;
  MenuItem: TauriMenuClass;
  CheckMenuItem: TauriMenuClass;
  PredefinedMenuItem: TauriMenuClass;
}

export class TauriMenuBridge implements MenuBridge {
  private actionCb: ActionCallback | null = null;

  async build(def: MenuBarDef, state: MenuState): Promise<void> {
    try {
      const specifier = "@tauri-apps/api/menu";
      // SECURITY: Dynamic import via new Function is intentional — the specifier
      // is a hardcoded package name, not user input. This avoids Vite statically
      // bundling Tauri APIs that only exist at native runtime.
      // eslint-disable-next-line @typescript-eslint/no-implied-eval -- dynamic import via new Function is intentional; specifier is a hardcoded package name
      const tauriMenu: TauriMenuModule = await (new Function("s", "return import(s)") as (s: string) => Promise<TauriMenuModule>)(specifier);
      const items = await Promise.all(
        def.menus.map((group) =>
          this.buildSubmenu(
            tauriMenu,
            group.id,
            group.label,
            this.resolveItems(group.items, state),
          ),
        ),
      );
      const menu = await tauriMenu.Menu.new({ items });
      await menu.setAsAppMenu();
    } catch (e) {
      logger.warn("[TauriMenuBridge] Failed to build menu:", e);
    }
  }

  async update(def: MenuBarDef, state: MenuState): Promise<void> {
    await this.build(def, state);
  }

  onAction(cb: ActionCallback): () => void {
    this.actionCb = cb;
    return () => {
      this.actionCb = null;
    };
  }

  dispose(): void {
    this.actionCb = null;
  }

  // ── Private helpers ───────────────────────────────────

  private resolveItems(items: readonly MenuItemDef[], _state: MenuState): readonly MenuItemDef[] {
    return items;
  }

  private async buildSubmenu(
    api: TauriMenuModule,
    id: string,
    label: string,
    items: readonly MenuItemDef[],
  ) {
    const children = await Promise.all(items.map((item) => this.buildItem(api, item)));
    return api.Submenu.new({
      id,
      text: label,
      items: children.filter(Boolean),
    });
  }

  private async buildItem(api: TauriMenuModule, item: MenuItemDef): Promise<unknown> {
    switch (item.kind) {
      case "action":
        return api.MenuItem.new({
          id: item.id,
          text: item.label,
          enabled: item.enabled ?? true,
          accelerator: item.shortcut,
          action: () => this.actionCb?.(item.id),
        });

      case "check":
        return api.CheckMenuItem.new({
          id: item.id,
          text: item.label,
          checked: item.checked,
          action: () => this.actionCb?.(item.id),
        });

      case "radio":
        return api.CheckMenuItem.new({
          id: item.id,
          text: item.label,
          checked: item.selected,
          action: () => this.actionCb?.(item.id),
        });

      case "submenu": {
        const children = await Promise.all(item.items.map((child) => this.buildItem(api, child)));
        return api.Submenu.new({
          id: item.id,
          text: item.label,
          items: children.filter(Boolean),
        });
      }

      case "separator":
        return api.PredefinedMenuItem.new({ item: "Separator" });

      case "status":
        return api.MenuItem.new({
          id: item.id,
          text: item.label,
          enabled: false,
        });

      default:
        return null;
    }
  }
}
