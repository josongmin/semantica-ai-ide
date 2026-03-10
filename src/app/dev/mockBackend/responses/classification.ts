/**
 * Intent classification — maps user input text to intent/risk/changeSize/uncertainty.
 */
import type { Classification, MockChangeSize, MockIntentType, MockRiskLevel, Uncertainty } from "./types";

// ── Intent Keywords ──────────────────────────────────────────

const INTENT_KEYWORDS: [MockIntentType, string[]][] = [
  ["Q_MIGRATE", ["migrate", "마이그레이션", "migration", "upgrade", "업그레이드", "convert", "변환", "port", "이전"]],
  ["Q_SEC", ["security", "보안", "vulnerability", "취약", "xss", "injection", "csrf", "auth", "인증", "인가", "owasp", "cve"]],
  ["Q_PERF", ["performance", "성능", "optimize", "최적화", "slow", "느린", "memory", "메모리", "bottleneck", "병목", "profil", "benchmark"]],
  ["Q_DIAG", ["debug", "디버그", "diagnosis", "진단", "왜 안", "안되", "fail", "crash", "error", "에러", "오류", "broken", "깨진", "안 돼"]],
  ["Q_FIX", ["fix", "수정", "bug", "버그", "patch", "hotfix", "resolve", "해결", "create", "만들", "생성", "add", "추가", "new", "implement", "구현"]],
  ["Q_REFACTOR", ["refactor", "리팩토", "clean", "정리", "개선", "restructure", "simplify", "단순화", "extract", "추출"]],
  ["Q_LOCATE", ["find", "찾", "where", "어디", "locate", "위치", "which file", "어떤 파일", "search", "검색", "grep"]],
  ["Q_SPEC", ["spec", "스펙", "document", "문서", "type", "타입", "interface", "인터페이스", "schema", "스키마", "api doc", "jsdoc", "test", "테스트", "coverage", "커버리지"]],
  ["Q_INFO", ["explain", "설명", "어떻게", "뭐", "what", "how", "why", "왜", "구조", "architecture", "개념", "concept", "이해"]],
];

function detectIntent(text: string): MockIntentType {
  const lower = text.toLowerCase();
  for (const [intent, words] of INTENT_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return intent;
  }
  return "Q_INFO"; // default fallback
}

function inferRisk(intent: MockIntentType, text: string): MockRiskLevel {
  const lower = text.toLowerCase();
  // Explicit risk hints
  if (lower.includes("production") || lower.includes("프로덕션") || lower.includes("운영")) return "R3";
  if (lower.includes("database") || lower.includes("db") || lower.includes("데이터베이스")) return "R3";
  if (lower.includes("payment") || lower.includes("결제") || lower.includes("billing")) return "R4";
  if (lower.includes("regulatory") || lower.includes("규제") || lower.includes("compliance")) return "R4";

  // Intent-based defaults
  const defaults: Record<MockIntentType, MockRiskLevel> = {
    Q_INFO: "R0",
    Q_LOCATE: "R0",
    Q_DIAG: "R1",
    Q_SPEC: "R0",
    Q_FIX: "R2",
    Q_REFACTOR: "R2",
    Q_SEC: "R3",
    Q_PERF: "R2",
    Q_MIGRATE: "R3",
  };
  return defaults[intent];
}

function inferMockChangeSize(intent: MockIntentType, text: string): MockChangeSize {
  const lower = text.toLowerCase();
  if (lower.includes("전체") || lower.includes("all") || lower.includes("repo-wide") || lower.includes("프로젝트 전체")) return "C3";
  if (lower.includes("여러") || lower.includes("multiple") || lower.includes("몇 개")) return "C2";

  const defaults: Record<MockIntentType, MockChangeSize> = {
    Q_INFO: "C0",
    Q_LOCATE: "C0",
    Q_DIAG: "C0",
    Q_SPEC: "C1",
    Q_FIX: "C1",
    Q_REFACTOR: "C2",
    Q_SEC: "C2",
    Q_PERF: "C1",
    Q_MIGRATE: "C3",
  };
  return defaults[intent];
}

function inferUncertainty(text: string): Uncertainty {
  const lower = text.toLowerCase();
  // "?" + ("or" or "또는") → asking for alternatives = high uncertainty
  if (lower.includes("?") && (lower.includes("or") || lower.includes("또는"))) return "U2";
  // "또는" alone still indicates presenting options
  if (lower.includes("또는")) return "U2";
  if (lower.includes("best") || lower.includes("최선") || lower.includes("recommend") || lower.includes("추천")) return "U1";
  if (lower.includes("어떻게 하면") || lower.includes("방법이") || lower.includes("가능할까")) return "U2";
  if (lower.length < 15) return "U1"; // very short prompts tend to be ambiguous
  return "U0";
}

/** Classify user input into intent/risk/changeSize/uncertainty */
export function classifyIntent(text: string): Classification {
  const intent = detectIntent(text);
  return {
    intent,
    risk: inferRisk(intent, text),
    changeSize: inferMockChangeSize(intent, text),
    uncertainty: inferUncertainty(text),
  };
}
