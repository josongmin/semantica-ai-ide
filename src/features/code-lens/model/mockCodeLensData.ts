import type { CodeLensData, CodeLensTarget } from "./codeLensAtoms";

// ─── Pattern detection ─────────────────────────────────────

const FUNCTION_RE = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
const ARROW_RE = /(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(/;
const CLASS_RE = /(?:export\s+)?class\s+(\w+)/;
const HOOK_RE = /(?:export\s+)?(?:const|function)\s+(use\w+)/;
const METHOD_RE = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/;

type DetectedKind = "hook" | "class" | "function" | "method" | "block";

function detectKind(code: string): { kind: DetectedKind; name: string } {
  const hookMatch = HOOK_RE.exec(code);
  if (hookMatch) return { kind: "hook", name: hookMatch[1] ?? "unknown" };

  const classMatch = CLASS_RE.exec(code);
  if (classMatch) return { kind: "class", name: classMatch[1] ?? "unknown" };

  const fnMatch = FUNCTION_RE.exec(code);
  if (fnMatch) return { kind: "function", name: fnMatch[1] ?? "unknown" };

  const arrowMatch = ARROW_RE.exec(code);
  if (arrowMatch) return { kind: "function", name: arrowMatch[1] ?? "unknown" };

  const methodMatch = METHOD_RE.exec(code);
  if (methodMatch) return { kind: "method", name: methodMatch[1] ?? "unknown" };

  return { kind: "block", name: "anonymous" };
}

// ─── Summary generators ────────────────────────────────────

const HOOK_SUMMARIES: Record<string, string> = {
  useState: "Manages local component state with a getter/setter pair",
  useEffect: "Runs side effects after render with cleanup support",
  useCallback: "Memoizes a callback to stabilize reference identity",
  useMemo: "Memoizes an expensive computation across renders",
  useRef: "Creates a mutable ref container that persists across renders",
  useContext: "Reads the nearest provider value from context",
};

function generateSummary(kind: DetectedKind, name: string, code: string): string {
  const hookSummary = HOOK_SUMMARIES[name];
  if (kind === "hook" && hookSummary) {
    return hookSummary;
  }

  if (kind === "hook") {
    return `Custom hook that encapsulates ${name.replace(/^use/, "").replace(/([A-Z])/g, " $1").trim().toLowerCase()} logic`;
  }

  if (kind === "class") {
    return `Class definition for ${name} with encapsulated state and methods`;
  }

  // Detect common patterns in function body
  if (code.includes("fetch(") || code.includes("axios")) {
    return `Performs an API request and processes the response`;
  }
  if (code.includes("addEventListener") || code.includes(".on(")) {
    return `Subscribes to events and manages listener lifecycle`;
  }
  if (code.includes("map(") || code.includes("filter(") || code.includes("reduce(")) {
    return `Transforms a collection through functional pipeline operations`;
  }
  if (code.includes("try") && code.includes("catch")) {
    return `Executes an operation with structured error handling`;
  }
  if (code.includes("return") && code.includes("Promise")) {
    return `Async operation that returns a Promise with the result`;
  }

  const readable = name.replace(/([A-Z])/g, " $1").trim().toLowerCase();
  return `Handles ${readable} processing and returns the result`;
}

// ─── Flow generation ───────────────────────────────────────

function generateFlow(
  _kind: DetectedKind,
  name: string,
  code: string,
  filePath: string,
  startLine: number,
): CodeLensData["flow"] {
  const calls: { name: string; line: number }[] = [];
  const callRe = /(?<!\w)(\w{2,})\s*\(/g;
  const lines = code.split("\n");

  const IGNORE = new Set([
    "if",
    "for",
    "while",
    "switch",
    "catch",
    "return",
    "throw",
    "new",
    "typeof",
    "import",
    "export",
    "const",
    "let",
    "var",
    "function",
    "class",
    "console",
  ]);

  for (let i = 0; i < lines.length; i++) {
    let match: RegExpExecArray | null;
    const line = lines[i] ?? "";
    while ((match = callRe.exec(line)) !== null) {
      const callName = match[1] ?? "";
      if (!IGNORE.has(callName) && callName !== name && !calls.some((c) => c.name === callName)) {
        calls.push({ name: callName, line: startLine + i });
      }
    }
    if (calls.length >= 5) break;
  }

  // Build flow: self → called functions
  const flow: { name: string; filePath: string; line: number }[] = [
    { name, filePath, line: startLine },
  ];

  for (const call of calls.slice(0, 4)) {
    flow.push({ name: call.name, filePath, line: call.line });
  }

  return flow;
}

// ─── Side effects detection ────────────────────────────────

function detectSideEffects(code: string): string[] {
  const effects: string[] = [];

  if (code.includes("localStorage") || code.includes("sessionStorage")) {
    effects.push("Reads/writes browser storage");
  }
  if (code.includes("fetch(") || code.includes("axios") || code.includes("XMLHttpRequest")) {
    effects.push("Makes network requests");
  }
  if (code.includes("console.")) {
    effects.push("Writes to console");
  }
  if (code.includes("document.") || code.includes("getElementById")) {
    effects.push("Manipulates the DOM directly");
  }
  if (code.includes("setTimeout") || code.includes("setInterval")) {
    effects.push("Schedules asynchronous timers");
  }
  if (code.includes("addEventListener")) {
    effects.push("Attaches event listeners");
  }
  if (code.includes("setState") || code.includes("set(")) {
    effects.push("Updates external state");
  }
  if (code.includes("dispatch")) {
    effects.push("Dispatches actions to store");
  }
  if (code.includes("emit(") || code.includes("publish(")) {
    effects.push("Emits events to subscribers");
  }

  return effects.length > 0 ? effects : ["Pure computation (no detected side effects)"];
}

// ─── Throws detection ──────────────────────────────────────

function detectThrows(code: string): string[] {
  const throws: string[] = [];
  const throwRe = /throw\s+new\s+(\w+Error)\b/g;
  let match: RegExpExecArray | null;

  while ((match = throwRe.exec(code)) !== null) {
    const throwName = match[1] ?? "Error";
    if (!throws.includes(throwName)) {
      throws.push(throwName);
    }
  }

  // Check for generic throw
  if (/throw\s+(?!new)/.test(code) && throws.length === 0) {
    throws.push("Error (generic throw)");
  }

  // Check for reject patterns
  if (code.includes("reject(") || code.includes("Promise.reject")) {
    throws.push("Promise rejection");
  }

  return throws;
}

// ─── Complexity estimation ─────────────────────────────────

function estimateComplexity(code: string): "low" | "medium" | "high" {
  let score = 0;

  // Branching
  const branches = (code.match(/\b(if|else|switch|case|\?|&&|\|\|)\b/g) ?? []).length;
  score += branches;

  // Loops
  const loops = (code.match(/\b(for|while|do|\.forEach|\.map|\.filter|\.reduce)\b/g) ?? []).length;
  score += loops * 2;

  // Nesting depth (rough heuristic: count indent levels)
  const maxIndent = code.split("\n").reduce((max, line) => {
    const indent = line.search(/\S/);
    return indent > max ? indent : max;
  }, 0);
  score += Math.floor(maxIndent / 4);

  // Try/catch
  if (code.includes("try")) score += 1;

  // Line count
  const lineCount = code.split("\n").length;
  score += Math.floor(lineCount / 20);

  if (score <= 4) return "low";
  if (score <= 10) return "medium";
  return "high";
}

// ─── Public API ────────────────────────────────────────────

/**
 * Generate plausible code-lens explain data from a code selection.
 * Analyzes the code to detect patterns and produce realistic summaries,
 * flow chains, side effects, and complexity estimations.
 */
export function generateMockLensData(target: CodeLensTarget): CodeLensData {
  const { kind, name } = detectKind(target.code);

  return {
    summary: generateSummary(kind, name, target.code),
    flow: generateFlow(kind, name, target.code, target.filePath, target.startLine),
    sideEffects: detectSideEffects(target.code),
    throws: detectThrows(target.code),
    complexity: estimateComplexity(target.code),
  };
}
