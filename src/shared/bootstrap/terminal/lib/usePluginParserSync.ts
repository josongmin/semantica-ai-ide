/**
 * usePluginParserSync — Extension host ↔ plugin parser state sync
 *
 * Listens for messages from the extension host containing TOML plugin
 * parser configs loaded from the workspace `.semantica/parsers/` directory.
 * Parses each config and updates the Jotai atom store.
 *
 * RFC-TERMINAL-013 §9 — User Plugin Parsers
 */

import { useCallback, useEffect } from "react";
import { useSetAtom } from "jotai";

import { isAllowedOrigin } from "~shared/lib";
import { logger } from "~shared/lib/logger";
import { getVscodeApi } from "~shared/lib/vscodeApi";

import {
  pluginParserConfigsAtom,
  upsertPluginParserAtom,
} from "../model/pluginParserAtoms";
import { loadPluginConfig } from "./pluginParser";

// ─── Message Shapes ─────────────────────────────────────────

/** Payload for bulk-loading plugin parsers from the host */
interface PluginParsersLoadedPayload {
  readonly type: "terminal/plugin-parsers-loaded";
  readonly parsers: readonly { readonly name: string; readonly content: string }[];
}

/** Payload for a single parser config update from the host */
interface PluginParserUpdatedPayload {
  readonly type: "terminal/plugin-parser-updated";
  readonly name: string;
  readonly content: string;
}

type PluginParserMessage = PluginParsersLoadedPayload | PluginParserUpdatedPayload;

/** Type guard for plugin parser messages */
function isPluginParserMessage(data: unknown): data is PluginParserMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as { type?: unknown };
  return (
    msg.type === "terminal/plugin-parsers-loaded" ||
    msg.type === "terminal/plugin-parser-updated"
  );
}

// ─── Hook ───────────────────────────────────────────────────

/**
 * Sync plugin parser configs from the extension host into Jotai state.
 *
 * Handles two message types:
 * - `terminal/plugin-parsers-loaded` — bulk replace all configs
 * - `terminal/plugin-parser-updated` — upsert a single config
 *
 * Also provides `loadPluginParsersFromHost()` to request a fresh load.
 */
export function usePluginParserSync(): {
  /** Request the extension host to reload plugin parsers from disk */
  loadPluginParsersFromHost: () => void;
} {
  const setConfigs = useSetAtom(pluginParserConfigsAtom);
  const upsertConfig = useSetAtom(upsertPluginParserAtom);

  useEffect(() => {
    function handleMessage(event: MessageEvent): void {
      if (!isAllowedOrigin(event.origin)) return;

      const { data } = event as MessageEvent<unknown>;
      if (!isPluginParserMessage(data)) return;

      switch (data.type) {
        case "terminal/plugin-parsers-loaded": {
          const configs = [];

          for (const entry of data.parsers) {
            try {
              const config = loadPluginConfig(entry.content);
              configs.push(config);
            } catch (err) {
              logger.warn(
                `[PluginParserSync] Failed to parse plugin "${entry.name}":`,
                (err as Error).message,
              );
            }
          }

          setConfigs(configs);
          logger.info(
            `[PluginParserSync] Loaded ${configs.length} plugin parser(s)`,
          );
          break;
        }

        case "terminal/plugin-parser-updated": {
          try {
            const config = loadPluginConfig(data.content);
            upsertConfig(config);
            logger.info(
              `[PluginParserSync] Updated plugin parser "${config.name}"`,
            );
          } catch (err) {
            logger.warn(
              `[PluginParserSync] Failed to parse updated plugin "${data.name}":`,
              (err as Error).message,
            );
          }
          break;
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setConfigs, upsertConfig]);

  const loadPluginParsersFromHost = useCallback(() => {
    getVscodeApi().postMessage({ type: "LOAD_PLUGIN_PARSERS" });
  }, []);

  return { loadPluginParsersFromHost };
}
