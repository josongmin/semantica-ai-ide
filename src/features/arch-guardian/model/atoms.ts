/**
 * Architecture Guardian Atoms — RFC-SYSTEM-LENS-001 §5
 */

import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import { pushToastAtom } from "~shared/lib/atoms/toastAtoms";

import type { ArchAnalysis, ArchRule, ArchViolationItem } from "./types";

// ─── Base State ─────────────────────────────────────────

export const archGuardianEnabledAtom = atom<boolean>(true);
export const archAnalysisAtom = atom<ArchAnalysis | null>(null);
export const archGuardianLoadingAtom = atom<boolean>(false);
export const archRulesAtom = atom<readonly ArchRule[]>([]);

// ─── Derived ────────────────────────────────────────────

/** Total count of current violations. */
export const archViolationCountAtom = atom<number>((get) => {
  const analysis = get(archAnalysisAtom);
  return analysis?.violations.length ?? 0;
});

/** Violations grouped by file path. */
export const archViolationsByFileAtom = atom<Map<string, readonly ArchViolationItem[]>>((get) => {
  const analysis = get(archAnalysisAtom);
  if (!analysis) return new Map();

  const grouped = new Map<string, ArchViolationItem[]>();
  for (const v of analysis.violations) {
    const existing = grouped.get(v.filePath);
    if (existing) {
      existing.push(v);
    } else {
      grouped.set(v.filePath, [v]);
    }
  }
  return grouped;
});

// ─── Write Atoms ────────────────────────────────────────

/** Triggers a full architecture scan (mock 500ms delay). */
export const scanArchitectureAtom = atom(null, async (_get, set) => {
  set(archGuardianLoadingAtom, true);
  const { generateMockAnalysis, generateMockRules } = await import("./mockData");
  await new Promise<void>((r) => setTimeout(r, 500));
  const analysis = generateMockAnalysis();
  set(archAnalysisAtom, analysis);
  set(archRulesAtom, generateMockRules());
  set(archGuardianLoadingAtom, false);
  const violationCount = analysis.violations.length;
  set(pushToastAtom, {
    id: `arch-guardian-${Date.now()}`,
    variant: violationCount === 0 ? "success" : "warning",
    message:
      violationCount === 0
        ? "Architecture scan clean"
        : `Architecture scan: ${violationCount} violations found`,
  });
});

/** Removes a violation from the current analysis. */
export const dismissViolationAtom = atom(null, (_get, set, violationId: string) => {
  set(archAnalysisAtom, (prev) => {
    if (!prev) return prev;
    const filtered = prev.violations.filter((v) => v.id !== violationId);
    const errorCount = filtered.filter((v) => v.severity === "error").length;
    const warningCount = filtered.filter((v) => v.severity === "warning").length;
    const healthDelta = errorCount * 8 + warningCount * 3;
    return {
      ...prev,
      violations: filtered,
      healthScore: Math.min(100, Math.max(0, 100 - healthDelta)),
      lastScanned: prev.lastScanned,
    };
  });
});

/** Toggles a rule's enabled state. */
export const toggleRuleAtom = atom(null, (_get, set, ruleId: string) => {
  set(archRulesAtom, (prev) =>
    prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule)),
  );
});

// ─── Reset ──────────────────────────────────────────────

const resetArchGuardianAtom = atom(null, (_get, set) => {
  set(archGuardianEnabledAtom, true);
  set(archAnalysisAtom, null);
  set(archGuardianLoadingAtom, false);
  set(archRulesAtom, []);
});
registerResetAtom(resetArchGuardianAtom);
