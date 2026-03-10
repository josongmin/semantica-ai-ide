/**
 * useAIGhostText — RFC-TERMINAL-016 §2.2 Tier 3
 *
 * Debounced AI-based ghost text completion for terminal input.
 * Fires only when Tier 1 (history) and Tier 2 (scripts) both fail.
 *
 * Currently uses a mock AI response since no real LLM backend is wired yet.
 * The mock simulates a 300ms delay and returns plausible completions
 * based on common command prefixes.
 */

import { useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { terminalAIContextAtom, terminalGhostTextAtom } from "../model/aiAtoms";
import { activeTerminalSessionIdAtom } from "../model/atoms";

// ─── Constants ──────────────────────────────────────────

const AI_DEBOUNCE_MS = 500;
const MOCK_LATENCY_MS = 300;

// ─── Mock AI Completions ─────────────────────────────────

/**
 * Mock completions keyed by prefix.
 * Replace with real LLM call when backend is available.
 */
const MOCK_COMPLETIONS: readonly (readonly [string, string])[] = [
  ["git commit", " -m \""],
  ["git check", "out "],
  ["git pu", "sh origin "],
  ["git sta", "sh"],
  ["git lo", "g --oneline"],
  ["git di", "ff --staged"],
  ["git br", "anch"],
  ["docker co", "mpose up -d"],
  ["docker bu", "ild -t "],
  ["docker ps", " -a"],
  ["npm i", "nstall"],
  ["npx vi", "te build"],
  ["curl -", "X GET "],
  ["mkdir -", "p "],
  ["cat ", "package.json"],
  ["ls -", "la"],
  ["cd ", ".."],
  ["rm -", "rf "],
  ["chmod ", "+x "],
  ["grep -", "rn \""],
  ["find . -", "name \""],
  ["tar -", "xzf "],
  ["ssh ", "-i "],
  ["python ", "-m "],
  ["node ", "--inspect "],
  ["cargo ", "build --release"],
  ["rustup ", "update"],
];

function getMockAICompletion(input: string, _context: unknown): string | null {
  const trimmed = input.trim();
  if (trimmed.length < 2) return null;

  for (const [prefix, completion] of MOCK_COMPLETIONS) {
    if (prefix.startsWith(trimmed) && prefix !== trimmed) {
      // Complete the prefix part first, then append the rest
      return prefix.slice(trimmed.length) + completion;
    }
    if (trimmed.startsWith(prefix)) {
      // Input goes beyond our prefix — no mock completion available
      continue;
    }
  }

  return null;
}

// ─── Hook ────────────────────────────────────────────────

export interface AIGhostTextActions {
  /** Trigger a debounced AI completion request. Cancel any pending one. */
  requestAICompletion: (partialInput: string) => void;
  /** Cancel any pending AI completion request. */
  cancelAICompletion: () => void;
}

/**
 * Provides debounced AI ghost text completions.
 * Meant to be called by `useGhostText` as a fallback tier.
 */
export function useAIGhostText(): AIGhostTextActions {
  const sessionId = useAtomValue(activeTerminalSessionIdAtom);
  const aiContext = useAtomValue(terminalAIContextAtom);
  const setGhostText = useSetAtom(terminalGhostTextAtom);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelAICompletion = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const requestAICompletion = useCallback(
    (partialInput: string) => {
      // Cancel any previous pending request
      cancelAICompletion();

      if (!sessionId || !partialInput || partialInput.trim().length < 3) {
        return;
      }

      const trimmed = partialInput.trim();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;

        // Simulate async AI call with mock latency
        const mockTimer = setTimeout(() => {
          // Check if aborted during mock latency
          if (controller.signal.aborted) return;

          const completion = getMockAICompletion(trimmed, aiContext);
          if (completion) {
            setGhostText({
              sessionId,
              text: completion,
              source: "ai",
            });
          }

          abortControllerRef.current = null;
        }, MOCK_LATENCY_MS);

        // Allow abort to cancel the mock latency timer too
        controller.signal.addEventListener("abort", () => {
          clearTimeout(mockTimer);
        });
      }, AI_DEBOUNCE_MS);
    },
    [sessionId, aiContext, setGhostText, cancelAICompletion],
  );

  return {
    requestAICompletion,
    cancelAICompletion,
  };
}
