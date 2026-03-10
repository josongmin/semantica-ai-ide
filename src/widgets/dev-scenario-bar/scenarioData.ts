export type ScenarioKey =
  | "scenarioBugfix"
  | "scenarioFeature"
  | "scenarioDangerous"
  | "scenarioToolApproval"
  | "scenarioSessionOps"
  | "scenarioTodoPlan"
  | "scenarioReviewDiff"
  | "scenarioCleanupHitl"
  | "scenarioAgents"
  | "scenarioMcp"
  | "scenarioBrowser"
  | "scenarioMemory"
  | "scenarioArena"
  | "scenarioGitCommits"
  | "scenarioRemote"
  | "scenarioIndex"
  | "scenarioChatStream"
  | "scenarioReviewComments"
  | "scenarioP0"
  | "scenarioP1"
  | "scenarioP2"
  | "scenarioSota"
  | "scenarioCoreState"
  | "scenarioPanels"
  | "scenarioReseed"
  | "scenarioMultiAgent"
  | "scenarioCodingOS";

export interface Scenario {
  readonly label: string;
  readonly description: string;
  readonly key: ScenarioKey;
  readonly group: string;
}

export const SCENARIOS: readonly Scenario[] = [
  // Pipeline scenarios
  {
    label: "Bugfix",
    description: "Successful bugfix pipeline (all PASS)",
    key: "scenarioBugfix",
    group: "Pipeline",
  },
  {
    label: "Feature",
    description: "Feature with MCTS search (adapter pattern)",
    key: "scenarioFeature",
    group: "Pipeline",
  },
  {
    label: "Dangerous",
    description: "Blocked by policy (PII + irreversible)",
    key: "scenarioDangerous",
    group: "Pipeline",
  },
  // Gap-coverage scenarios
  {
    label: "Tool Approval",
    description: "Approval mode, permissions, MCP tool call",
    key: "scenarioToolApproval",
    group: "Events",
  },
  {
    label: "Session Ops",
    description: "Page nav, modes, fork, share, export",
    key: "scenarioSessionOps",
    group: "Events",
  },
  {
    label: "Todo & Plan",
    description: "Project todo CRUD, plan item updates",
    key: "scenarioTodoPlan",
    group: "Events",
  },
  {
    label: "Review & Diff",
    description: "Review comments, checkpoint diff, 3-way",
    key: "scenarioReviewDiff",
    group: "Events",
  },
  {
    label: "Cleanup & HITL",
    description: "Memory/agent cleanup, user input, reset",
    key: "scenarioCleanupHitl",
    group: "Events",
  },
  // Simulate* wrappers
  {
    label: "Agents",
    description: "UPSERT/UPDATE/REMOVE agent instances",
    key: "scenarioAgents",
    group: "Simulate",
  },
  {
    label: "MCP",
    description: "MCP server status, tools, tool calls",
    key: "scenarioMcp",
    group: "Simulate",
  },
  {
    label: "Browser",
    description: "Browser state, console push/clear",
    key: "scenarioBrowser",
    group: "Simulate",
  },
  {
    label: "Memory",
    description: "Memory rules, active rules, auto-suggest",
    key: "scenarioMemory",
    group: "Simulate",
  },
  {
    label: "Arena",
    description: "Arena responses, streaming, winner",
    key: "scenarioArena",
    group: "Simulate",
  },
  {
    label: "Git Commits",
    description: "Auto-commit, push git commits",
    key: "scenarioGitCommits",
    group: "Simulate",
  },
  {
    label: "Remote",
    description: "Remote status, push commands",
    key: "scenarioRemote",
    group: "Simulate",
  },
  {
    label: "Indexing",
    description: "Semantic index status + search results",
    key: "scenarioIndex",
    group: "Simulate",
  },
  {
    label: "Chat Stream",
    description: "APPEND_TEXT, message status, tool call status",
    key: "scenarioChatStream",
    group: "Simulate",
  },
  {
    label: "Review Comments",
    description: "UPSERT_REVIEW_COMMENT lifecycle",
    key: "scenarioReviewComments",
    group: "Simulate",
  },
  // Priority tier scenarios
  {
    label: "P0: Terminal/Test",
    description: "Terminal, test results, diagnostics, quota, notifications, auth",
    key: "scenarioP0",
    group: "Tier",
  },
  {
    label: "P1: CI/Deploy",
    description: "Hooks, worktree, file watch, CI/CD, security, deploy, prompts, debug",
    key: "scenarioP1",
    group: "Tier",
  },
  {
    label: "P2: Sandbox/Plugin",
    description: "Sandbox, plugins, wave, verifier, spec, schedule, steer, bugbot",
    key: "scenarioP2",
    group: "Tier",
  },
  {
    label: "SOTA Features",
    description: "Agent rules, auto-context, speculative edits, bg jobs, replay, debate",
    key: "scenarioSota",
    group: "Tier",
  },
  // Bulk scenarios
  {
    label: "Core State",
    description: "Turns, tools, timeline, bookmarks, checkpoints, errors, symbols",
    key: "scenarioCoreState",
    group: "Bulk",
  },
  {
    label: "Panels State",
    description: "All panel SET_* events (models, wiki, gantt, privacy, etc.)",
    key: "scenarioPanels",
    group: "Bulk",
  },
  {
    label: "Multi-Agent",
    description: "Orchestrator \u2192 Planner \u2192 Coder \u2192 Reviewer \u2192 Tester",
    key: "scenarioMultiAgent",
    group: "Pipeline",
  },
  {
    label: "Coding OS",
    description: "BG Agents, Intent, Terminal, Graph, Resources, Transaction, Diff",
    key: "scenarioCodingOS",
    group: "Bulk",
  },
  {
    label: "Re-seed All",
    description: "Re-run full seedAll() to populate all state",
    key: "scenarioReseed",
    group: "Bulk",
  },
];

export const GROUP_ORDER = ["Pipeline", "Events", "Simulate", "Tier", "Bulk"] as const;

export const TAB_ITEMS = GROUP_ORDER.map((g) => ({ id: g, label: g }));
