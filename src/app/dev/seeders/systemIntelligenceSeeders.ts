/**
 * System Intelligence Seeders — RFC-SYSTEM-LENS-001 §9
 *
 * Populates mock data for all System Intelligence features
 * when running in dev/browser mode.
 */

import type { createStore } from "jotai";

// ─── Types for generic store access ─────────────────────

type JotaiStore = ReturnType<typeof createStore>;

// ─── Seed System Lens ────────────────────────────────────

export async function seedSystemLens(store: JotaiStore): Promise<void> {
  const { loadLensBadgesAtom } = await import("../../../features/system-lens/model/atoms");

  const files = [
    "src/auth/AuthController.ts",
    "src/auth/AuthService.ts",
    "src/auth/TokenService.ts",
    "src/user/UserRepository.ts",
    "src/api/Gateway.ts",
    "src/payments/PaymentService.ts",
  ];

  for (const file of files) {
    void store.set(loadLensBadgesAtom, file);
  }
}

// ─── Seed Impact Radar ───────────────────────────────────

export async function seedImpactRadar(store: JotaiStore): Promise<void> {
  const { analyzeImpactAtom } = await import("../../../features/impact-radar/model/atoms");

  void store.set(analyzeImpactAtom, {
    filePath: "src/auth/AuthService.ts",
    line: 42,
    symbolName: "validateCredentials",
    changeType: "edit" as const,
  });
}

// ─── Seed Root Cause ─────────────────────────────────────

export async function seedRootCause(store: JotaiStore): Promise<void> {
  const { startRootCauseAtom } = await import("../../../features/root-cause/model/atoms");

  void store.set(startRootCauseAtom, {
    symptom: "TypeError: Cannot read property 'token' of undefined",
    filePath: "src/auth/AuthController.ts",
    line: 42,
  });
}

// ─── Seed Self Explain ───────────────────────────────────

export async function seedSelfExplain(store: JotaiStore): Promise<void> {
  const { openSelfExplainAtom } = await import("../../../features/self-explain/model/atoms");

  store.set(openSelfExplainAtom, {
    symbolId: "fn:handleLogin",
    filePath: "src/auth/AuthController.ts",
    line: 15,
  });
}

// ─── Seed Intent Engine ──────────────────────────────────

export async function seedIntentEngine(store: JotaiStore): Promise<void> {
  const { openIntentBarAtom } = await import("../../../features/intent-engine/model/atoms");

  // Open the intent bar to showcase it
  store.set(openIntentBarAtom);
}

// ─── Master Seeder ───────────────────────────────────────

export async function seedSystemIntelligence(store: JotaiStore): Promise<void> {
  await seedSystemLens(store);
  // Don't auto-trigger impact/root-cause/intent — let user discover them
  // They'll populate on-demand via keyboard shortcuts
}
