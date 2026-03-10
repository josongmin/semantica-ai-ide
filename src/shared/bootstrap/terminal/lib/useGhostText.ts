/**
 * useGhostText — RFC-TERMINAL-016 §2.2
 *
 * 3-tier ghost text suggestion system for terminal input:
 *
 * Tier 1: History match — prefix match against recent commands (instant, 0ms)
 * Tier 2: Script match — match against package.json scripts with package manager prefix (instant, 0ms)
 * Tier 3: AI completion — debounced LLM-based suggestion (500ms debounce + async)
 *
 * Priority: history > scripts > AI. Higher tiers cancel pending lower-tier requests.
 */

import { useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { terminalAIContextAtom, terminalGhostTextAtom } from "../model/aiAtoms";
import { activeSessionCommandsAtom, activeTerminalSessionIdAtom } from "../model/atoms";
import { useAIGhostText } from "./useAIGhostText";

// ─── Script Matching Helpers ────────────────────────────

/**
 * Known package manager run commands.
 * Maps packageManager → list of invocation prefixes that precede a script name.
 * e.g. "npm" → ["npm run ", "npm "]  (npm supports bare "npm test", "npm start")
 */
const PM_RUN_PREFIXES: Record<string, readonly string[]> = {
  npm: ["npm run ", "npm "],
  pnpm: ["pnpm run ", "pnpm "],
  yarn: ["yarn run ", "yarn "],
  bun: ["bun run ", "bun "],
};

/** npm/pnpm/yarn/bun lifecycle scripts that can be invoked without "run" */
const LIFECYCLE_SCRIPTS = new Set([
  "test",
  "start",
  "build",
  "dev",
  "lint",
  "install",
  "preinstall",
  "postinstall",
  "prepublish",
  "prepublishOnly",
]);

/**
 * Try to match the user input against available package.json scripts.
 *
 * Handles two patterns:
 * 1. "<pm> <partial>"       → complete to "<pm> <scriptName>" for lifecycle scripts
 * 2. "<pm> run <partial>"   → complete to "<pm> run <scriptName>" for any script
 *
 * Returns the completion suffix or null if no match.
 */
function matchScript(
  trimmedInput: string,
  scripts: readonly string[],
  packageManager: string,
): string | null {
  if (scripts.length === 0) return null;

  const prefixes = PM_RUN_PREFIXES[packageManager];
  if (!prefixes) return null;

  // Try each prefix pattern (longer first — "npm run " before "npm ")
  for (const prefix of prefixes) {
    if (!trimmedInput.startsWith(prefix) && !prefix.startsWith(trimmedInput)) {
      continue;
    }

    // Case A: input is shorter than the prefix — still typing the prefix itself
    // e.g. input="pnpm r" prefix="pnpm run " → complete to "un "
    if (trimmedInput.length < prefix.length && prefix.startsWith(trimmedInput)) {
      // Only offer prefix completion if at least one script exists
      return prefix.slice(trimmedInput.length);
    }

    // Case B: input has the full prefix + partial script name
    if (trimmedInput.startsWith(prefix)) {
      const partial = trimmedInput.slice(prefix.length);
      if (!partial) continue; // just the prefix, no partial yet

      const isRunPrefix = prefix.includes(" run ");

      for (const script of scripts) {
        // For bare invocation (without "run"), only match lifecycle scripts
        if (!isRunPrefix && !LIFECYCLE_SCRIPTS.has(script)) continue;

        if (script.startsWith(partial) && script !== partial) {
          return script.slice(partial.length);
        }
      }
    }
  }

  // Case C: input is a very early prefix of the package manager itself
  // e.g. input="pn" → could suggest "pm " but that's too aggressive. Skip.

  return null;
}

// ─── Hook ────────────────────────────────────────────────

/**
 * Provides ghost text suggestions based on a 3-tier priority system.
 * Call `updateGhostText(partialInput)` as the user types.
 */
export function useGhostText() {
  const sessionId = useAtomValue(activeTerminalSessionIdAtom);
  const commands = useAtomValue(activeSessionCommandsAtom);
  const aiContext = useAtomValue(terminalAIContextAtom);
  const setGhostText = useSetAtom(terminalGhostTextAtom);
  const prevMatchRef = useRef<string>("");

  const { requestAICompletion, cancelAICompletion } = useAIGhostText();

  const updateGhostText = useCallback(
    (partialInput: string) => {
      if (!sessionId || !partialInput || partialInput.length < 2) {
        cancelAICompletion();
        setGhostText(null);
        prevMatchRef.current = "";
        return;
      }

      const trimmed = partialInput.trim();

      // ── Tier 1: History prefix match (instant) ──────────
      for (let i = commands.length - 1; i >= 0; i--) {
        const cmd = commands[i]?.command ?? "";
        if (cmd.startsWith(trimmed) && cmd !== trimmed) {
          const completion = cmd.slice(trimmed.length);
          cancelAICompletion(); // higher tier wins
          if (completion === prevMatchRef.current) return; // no change

          prevMatchRef.current = completion;
          setGhostText({
            sessionId,
            text: completion,
            source: "history",
          });
          return;
        }
      }

      // ── Tier 2: Script match (instant) ──────────────────
      const scripts = aiContext?.availableScripts;
      const pm = aiContext?.packageManager;

      if (scripts && scripts.length > 0 && pm) {
        const scriptCompletion = matchScript(trimmed, scripts, pm);
        if (scriptCompletion) {
          cancelAICompletion(); // higher tier wins
          if (scriptCompletion === prevMatchRef.current) return; // no change

          prevMatchRef.current = scriptCompletion;
          setGhostText({
            sessionId,
            text: scriptCompletion,
            source: "script",
          });
          return;
        }
      }

      // ── Tier 3: AI completion (debounced) ───────────────
      // Clear any stale synchronous ghost text before the async AI kicks in
      if (prevMatchRef.current) {
        prevMatchRef.current = "";
        setGhostText(null);
      }
      requestAICompletion(partialInput);
    },
    [sessionId, commands, aiContext, setGhostText, cancelAICompletion, requestAICompletion],
  );

  const clearGhostText = useCallback(() => {
    cancelAICompletion();
    setGhostText(null);
    prevMatchRef.current = "";
  }, [setGhostText, cancelAICompletion]);

  const acceptGhostText = useCallback((): string | null => {
    cancelAICompletion();
    const { current } = prevMatchRef;
    if (!current) return null;
    setGhostText(null);
    prevMatchRef.current = "";
    return current;
  }, [setGhostText, cancelAICompletion]);

  return {
    updateGhostText,
    clearGhostText,
    acceptGhostText,
  };
}
