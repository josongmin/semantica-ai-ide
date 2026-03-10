import {
  abortableSleep,
  type AgentPersona,
  emitSummary,
  emitThinking,
  emitToolCall,
  emitTurnStart,
  finalizeTurn,
  type HandlerContext,
  type MessageId,
  nextId,
  postServerEvent,
  type TurnId,
} from "./types";

export async function runSecurityWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(turnId, `${persona.name} here. Initiating zero-trust security scan across all attack surfaces...`, "Running security scan...", signal, 800);

  // Analysis
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "analysis", entry: { status: "running", summary: "Scanning for vulnerabilities..." } });
  const tcAudit = await emitToolCall(turnId, "Bash", "terminal", "npm audit", "Found 3 vulnerabilities", signal, 600);
  const tcGrepSec = await emitToolCall(turnId, "Grep", "search", "dangerouslySetInnerHTML|eval\\(|innerHTML", "Found 2 matches", signal, 400);
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "analysis",
    entry: { status: "success", collapsed: true, summary: "npm audit + XSS pattern scan", tool_call_ids: [tcAudit, tcGrepSec] },
  });

  // Security scan results
  postServerEvent({
    t: "SET_SECURITY_SCAN",
    scan: {
      scan_id: nextId("scan"), status: "completed",
      findings: [
        { id: nextId("f"), scan_type: "code", severity: "high", title: "XSS via dangerouslySetInnerHTML", description: "Unsanitized user input passed to dangerouslySetInnerHTML in MessageRow.tsx", file_path: "src/widgets/message-row/MessageRow.tsx", line: 45, cwe: "CWE-79", remediation: "Use DOMPurify to sanitize HTML content" },
        { id: nextId("f"), scan_type: "dependency", severity: "medium", title: "Prototype pollution in lodash", description: "lodash < 4.17.21 is vulnerable to prototype pollution", cve: "CVE-2021-23337", remediation: "Upgrade lodash to ≥ 4.17.21" },
        { id: nextId("f"), scan_type: "secret", severity: "critical", title: "Hardcoded API key", description: "API key found in config.ts — should be in environment variable", file_path: "src/config.ts", line: 12, remediation: "Move to .env and add to .gitignore" },
        { id: nextId("f"), scan_type: "code", severity: "low", title: "Missing CSRF token", description: "Form submission without CSRF protection", file_path: "src/components/Form.tsx", line: 55, cwe: "CWE-352" },
      ],
      summary: { critical: 1, high: 1, medium: 1, low: 1 },
      timestamp_ms: Date.now(),
    },
  });

  // Diagnostics
  postServerEvent({
    t: "SET_DIAGNOSTICS",
    file_path: "src/config.ts",
    diagnostics: [
      { id: nextId("diag"), file_path: "src/config.ts", line: 12, severity: "error", source: "custom", code: "SEC-001", message: "CRITICAL: Hardcoded API key detected — move to environment variable" },
    ],
  });

  // Privacy state
  postServerEvent({
    t: "SET_PRIVACY_STATE",
    state: { mode: "local", details: "All data processed locally. No external API calls during scan.", policy_url: "https://example.com/privacy" },
  });

  // Browser actions performed during scan
  postServerEvent({
    t: "SET_BROWSER_ACTIONS",
    actions: [
      { id: nextId("ba"), type: "navigate", target: "http://localhost:3000/login", timestamp_ms: Date.now() - 3000 },
      { id: nextId("ba"), type: "type", target: "input#email", value: "test@example.com", timestamp_ms: Date.now() - 2500 },
      { id: nextId("ba"), type: "click", target: "button[type=submit]", timestamp_ms: Date.now() - 2000 },
      { id: nextId("ba"), type: "screenshot", timestamp_ms: Date.now() - 1500, screenshot_url: "data:image/png;base64,iVBOR..." },
    ],
  });

  // Browser console entries from security scan
  postServerEvent({ t: "CLEAR_BROWSER_CONSOLE" });
  postServerEvent({ t: "PUSH_BROWSER_CONSOLE", entry: { id: nextId("bc"), timestamp_ms: Date.now() - 2000, level: "warn", message: "Mixed content: loaded HTTP resource on HTTPS page", source: "security" } });
  postServerEvent({ t: "PUSH_BROWSER_CONSOLE", entry: { id: nextId("bc"), timestamp_ms: Date.now() - 1500, level: "error", message: "CSP violation: inline script blocked by Content-Security-Policy", source: "security" } });
  postServerEvent({ t: "PUSH_BROWSER_CONSOLE", entry: { id: nextId("bc"), timestamp_ms: Date.now() - 1000, level: "info", message: "Security scan completed. 4 findings.", source: "security" } });

  postServerEvent({ t: "PUSH_NOTIFICATION", notification: { id: nextId("notif"), type: "error", urgency: "high", title: " Security Alert", message: "1 critical, 1 high severity vulnerability found", timestamp_ms: Date.now() } });

  await emitSummary(
    turnId,
    `## Security Scan Results\n\n###  4 Vulnerabilities Found\n\n| Severity | Count | Action |\n|----------|:-----:|--------|\n| 🔴 Critical | 1 | Immediate fix required |\n| 🟠 High | 1 | Fix before deploy |\n| 🟡 Medium | 1 | Fix in next sprint |\n| 🔵 Low | 1 | Monitor |\n\n### Critical: Hardcoded API Key\n**File:** \`src/config.ts:12\`\n**Fix:** Move API key to \`.env\` file and use \`process.env.API_KEY\`\n\n### High: XSS Vulnerability\n**File:** \`MessageRow.tsx:45\`\n**Fix:** Sanitize HTML with DOMPurify before rendering\n\n### Medium: Outdated lodash\n**Fix:** \`npm update lodash\`\n\n[WARN] **Do NOT deploy** until critical and high issues are resolved.`,
    signal, 1800,
  );

  finalizeTurn(turnId, ctx);
}
