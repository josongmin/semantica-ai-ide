/**
 * Naive Message Analyzer — Keyword-based Workflow Trigger
 *
 * Analyzes user chat messages by keyword matching and fires
 * the corresponding SOTA feature workflow with appropriate ServerEvents.
 * Each workflow has a unique agent persona for demo purposes.
 *
 * This is a demo-grade module. Replace with a real agent engine later.
 */
import type { MessageId, TurnId } from "../../../shared/protocol";
import type { HandlerContext } from "./handlers/index";
import {
  type AgentPersona,
  finalizeCancelledTurn,
  runAutoContextWorkflow,
  runBackgroundWorkflow,
  runBugfixWorkflow,
  runCicdWorkflow,
  runDebateWorkflow,
  runExplainWorkflow,
  runOnboardingWorkflow,
  runPlanWorkflow,
  runRefactorWorkflow,
  runReplayWorkflow,
  runReviewWorkflow,
  runRulesWorkflow,
  runSearchWorkflow,
  runSecurityWorkflow,
  runSpeculateWorkflow,
  runTestWorkflow,
  type WorkflowId,
} from "./workflows";

// Re-export types so existing consumers continue to work
export type { AnalysisResult, WorkflowId } from "./workflows";

// ── Keyword -> Workflow Mapping ───────────────────────────────

const WORKFLOW_MAP: { workflow: WorkflowId; keywords: string[]; persona: AgentPersona }[] = [
  { workflow: "review",       keywords: ["review", "check", "코드리뷰", "리뷰", "검토"],                                       persona: { name: "Reviewer",   tone: "meticulous",    role: "reviewer",      greeting: "Let me carefully inspect this code..." } },
  { workflow: "bugfix",       keywords: ["fix", "bug", "debug", "error", "버그", "수정", "에러", "오류"],                       persona: { name: "Fixer",      tone: "systematic",    role: "debugger",      greeting: "I'll trace the root cause systematically..." } },
  { workflow: "refactor",     keywords: ["refactor", "clean", "optimize", "리팩토링", "정리", "최적화"],                         persona: { name: "Architect",  tone: "elegant",       role: "architect",     greeting: "Let me design a cleaner architecture..." } },
  { workflow: "test",         keywords: ["test", "spec", "coverage", "테스트", "커버리지"],                                      persona: { name: "Tester",     tone: "thorough",      role: "tester",        greeting: "Time to hunt edge cases..." } },
  { workflow: "explain",      keywords: ["explain", "what", "how", "why", "설명", "뭐", "왜", "어떻게"],                         persona: { name: "Professor",  tone: "friendly",      role: "educator",      greeting: "Great question! Let me break this down..." } },
  { workflow: "auto-context", keywords: ["context", "relevant", "files", "컨텍스트", "관련", "파일"],                            persona: { name: "Curator",    tone: "analytical",    role: "researcher",    greeting: "Scanning for relevant context..." } },
  { workflow: "background",   keywords: ["background", "async", "bg", "parallel", "백그라운드", "비동기"],                       persona: { name: "Runner",     tone: "efficient",     role: "coder",         greeting: "Launching background task..." } },
  { workflow: "replay",       keywords: ["replay", "step", "trace", "rewind", "리플레이", "되감기", "단계"],                     persona: { name: "Historian",  tone: "narrative",     role: "researcher",    greeting: "Let me walk through each step..." } },
  { workflow: "debate",       keywords: ["debate", "compare", "versus", "vs", "토론", "비교"],                                   persona: { name: "Moderator",  tone: "balanced",      role: "critic",        greeting: "Setting up a multi-agent debate..." } },
  { workflow: "rules",        keywords: ["rules", "policy", "guard", "enforce", "규칙", "정책", "가드"],                         persona: { name: "Guardian",   tone: "strict",        role: "requirements",  greeting: "Loading agent rules and checking compliance..." } },
  { workflow: "security",     keywords: ["security", "scan", "vuln", "보안", "취약점", "스캔"],                                  persona: { name: "SecOps",     tone: "paranoid",     role: "security",      greeting: "Initiating zero-trust security scan..." } },
  { workflow: "cicd",         keywords: ["deploy", "ci", "pipeline", "ship", "배포", "파이프라인"],                               persona: { name: "DevOps",     tone: "automated",     role: "coder",         greeting: "Triggering CI/CD pipeline..." } },
  { workflow: "speculate",    keywords: ["predict", "speculate", "ghost", "preview", "예측", "프리뷰", "미리보기"],                persona: { name: "Oracle",     tone: "prescient",     role: "planner",       greeting: "Predicting what you need next..." } },
  { workflow: "search",       keywords: ["search", "find", "locate", "where", "검색", "찾아", "어디"],                           persona: { name: "Detective",  tone: "investigative", role: "researcher",    greeting: "Searching the codebase..." } },
  { workflow: "plan",         keywords: ["plan", "design", "architect", "계획", "설계", "아키텍처"],                              persona: { name: "Strategist", tone: "strategic",    role: "planner",       greeting: "Let me design a comprehensive plan..." } },
  { workflow: "onboarding",   keywords: ["help", "hello", "hi", "도움", "안녕", "하이"],                                         persona: { name: "Guide",      tone: "welcoming",     role: "orchestrator",  greeting: "Welcome! Let me show you what I can do..." } },
];

const GENERAL_PERSONA: AgentPersona = {
  name: "Agent", tone: "balanced", role: "orchestrator", greeting: "Let me handle this for you...",
};

// ── Analyzer ─────────────────────────────────────────────────

export function analyzeMessage(text: string) {
  const lower = text.toLowerCase();
  let bestMatch: (typeof WORKFLOW_MAP)[number] | null = null;
  let bestCount = 0;
  const matchedKeywords: string[] = [];

  for (const entry of WORKFLOW_MAP) {
    const hits = entry.keywords.filter((kw) => lower.includes(kw));
    if (hits.length > bestCount) {
      bestCount = hits.length;
      bestMatch = entry;
      matchedKeywords.length = 0;
      matchedKeywords.push(...hits);
    }
  }

  if (bestMatch && bestCount > 0) {
    return {
      workflow: bestMatch.workflow,
      keywords: matchedKeywords,
      confidence: Math.min(1, bestCount * 0.4 + 0.3),
      persona: bestMatch.persona,
    };
  }

  return {
    workflow: "general" as WorkflowId,
    keywords: [] as string[],
    confidence: 0.3,
    persona: GENERAL_PERSONA,
  };
}

// ── Workflow Registry ────────────────────────────────────────

type WorkflowFn = (
  text: string,
  turnId: TurnId,
  userMsgId: MessageId,
  ctx: HandlerContext,
  persona: AgentPersona,
  signal: AbortSignal,
) => Promise<void>;

const workflows: Record<WorkflowId, WorkflowFn> = {
  "review":       runReviewWorkflow,
  "bugfix":       runBugfixWorkflow,
  "refactor":     runRefactorWorkflow,
  "test":         runTestWorkflow,
  "explain":      runExplainWorkflow,
  "auto-context": runAutoContextWorkflow,
  "background":   runBackgroundWorkflow,
  "replay":       runReplayWorkflow,
  "debate":       runDebateWorkflow,
  "rules":        runRulesWorkflow,
  "security":     runSecurityWorkflow,
  "cicd":         runCicdWorkflow,
  "speculate":    runSpeculateWorkflow,
  "search":       runSearchWorkflow,
  "plan":         runPlanWorkflow,
  "onboarding":   runOnboardingWorkflow,
  "general":      async () => {},  // never reached
};

// ── Main Entry Point ─────────────────────────────────────────

/**
 * Run the analyzed workflow. Returns true if it handled the message
 * (i.e., workflow !== "general"), false if the caller should use the default pipeline.
 */
export async function executeWorkflow(
  text: string,
  turnId: TurnId,
  userMsgId: MessageId,
  ctx: HandlerContext,
): Promise<boolean> {
  const result = analyzeMessage(text);

  // "general" -> let the default handleSendMessage pipeline handle it
  if (result.workflow === "general") return false;

  // eslint-disable-next-line no-console
  console.log(`[messageAnalyzer] Matched workflow "${result.workflow}" (${result.persona.name}) — keywords: [${result.keywords.join(", ")}], confidence: ${result.confidence.toFixed(2)}`);

  ctx.state.turnCounter++;

  // Abort any in-flight turn
  ctx.activeAbort?.abort();
  const abort = new AbortController();
  ctx.setActiveAbort(abort);
  const { signal } = abort;

  try {
    await workflows[result.workflow](text, turnId, userMsgId, ctx, result.persona, signal);
  } catch {
    // AbortError — turn was stopped
    finalizeCancelledTurn(turnId);
  } finally {
    if (ctx.activeAbort === abort) {
      ctx.setActiveAbort(null);
    }
  }

  return true;
}
