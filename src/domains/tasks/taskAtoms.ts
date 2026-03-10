import { atom } from "jotai";

// ─── Types ──────────────────────────────────────────────

export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskSource = "user" | "agent" | "ci" | "review";

export interface ProjectTask {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly source: TaskSource;
  readonly assignee?: string;
  readonly filePaths?: readonly string[];
  readonly labels?: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly completedAt?: number;
  readonly estimatedMinutes?: number;
  readonly blockedBy?: readonly string[]; // task IDs
}

// ─── Constants ──────────────────────────────────────────

export const ALL_STATUSES: readonly TaskStatus[] = ["todo", "in-progress", "done", "blocked"];
export const ALL_PRIORITIES: readonly TaskPriority[] = ["critical", "high", "medium", "low"];

export const STATUS_META: Record<TaskStatus, { label: string; icon: string; color: string }> = {
  todo: { label: "Todo", icon: "circle-outline", color: "text-vsc-text-tertiary" },
  "in-progress": { label: "In Progress", icon: "loading", color: "text-vsc-info" },
  done: { label: "Done", icon: "check", color: "text-vsc-success" },
  blocked: { label: "Blocked", icon: "error", color: "text-vsc-error" },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "text-vsc-error", bg: "bg-vsc-error/15" },
  high: { label: "High", color: "text-vsc-warning", bg: "bg-vsc-warning/15" },
  medium: { label: "Medium", color: "text-vsc-info", bg: "bg-vsc-info/15" },
  low: { label: "Low", color: "text-vsc-text-tertiary", bg: "bg-vsc-surface-2" },
};

export const SOURCE_META: Record<TaskSource, { label: string; icon: string; color: string }> = {
  user: { label: "User", icon: "person", color: "text-vsc-text-secondary" },
  agent: { label: "Agent", icon: "sparkle", color: "text-vsc-accent" },
  ci: { label: "CI", icon: "server-process", color: "text-vsc-warning" },
  review: { label: "Review", icon: "comment-discussion", color: "text-vsc-info" },
};

// ─── Mock Data ──────────────────────────────────────────

const now = Date.now();
const h = (hours: number) => now - hours * 3_600_000;
const d = (days: number) => now - days * 86_400_000;

const MOCK_TASKS: readonly ProjectTask[] = [
  {
    id: "task-001",
    title: "Fix race condition in WebSocket reconnect logic",
    description:
      "The transport layer occasionally drops messages during reconnect because the message queue is not flushed before the new socket is opened. Add a buffering stage that replays pending messages after the handshake completes.",
    status: "in-progress",
    priority: "critical",
    source: "user",
    assignee: "song",
    filePaths: ["packages/core/src/transports/TauriTransport.ts", "packages/core/src/transports/base.ts"],
    labels: ["bug", "networking"],
    createdAt: d(3),
    updatedAt: h(2),
    estimatedMinutes: 120,
  },
  {
    id: "task-002",
    title: "Add keyboard shortcuts overlay for graph surface",
    description:
      "Users have no discoverability for keyboard shortcuts in the graph view. Add an overlay similar to the editor surface that shows available key bindings contextually.",
    status: "todo",
    priority: "medium",
    source: "review",
    filePaths: ["src/surfaces/graph/GraphSurface.tsx"],
    labels: ["ux", "accessibility"],
    createdAt: d(5),
    updatedAt: d(5),
    estimatedMinutes: 60,
  },
  {
    id: "task-003",
    title: "Migrate theme tokens to CSS custom properties",
    description:
      "Replace remaining hardcoded color values in Tailwind classes with CSS custom property references so that all themes apply consistently.",
    status: "done",
    priority: "high",
    source: "user",
    assignee: "song",
    labels: ["refactor", "theming"],
    createdAt: d(14),
    updatedAt: d(1),
    completedAt: d(1),
    estimatedMinutes: 180,
  },
  {
    id: "task-004",
    title: "Implement semantic search result ranking",
    description:
      "The current search returns results in insertion order. Implement TF-IDF or BM25 ranking so the most relevant symbols appear first.",
    status: "todo",
    priority: "high",
    source: "agent",
    filePaths: ["src/features/semantic-search/index.ts"],
    labels: ["feature", "search"],
    createdAt: d(2),
    updatedAt: d(2),
    estimatedMinutes: 240,
  },
  {
    id: "task-005",
    title: "CI pipeline fails on Windows arm64",
    description:
      "The Tauri build step segfaults on Windows arm64 runners. Likely related to the native module compilation flags. Needs investigation of the Cargo.toml target configuration.",
    status: "blocked",
    priority: "critical",
    source: "ci",
    filePaths: ["apps/desktop/src-tauri/Cargo.toml", "apps/desktop/src-tauri/build.rs"],
    labels: ["ci", "platform"],
    createdAt: d(1),
    updatedAt: h(6),
    blockedBy: ["task-001"],
    estimatedMinutes: 90,
  },
  {
    id: "task-006",
    title: "Add unit tests for integration kernel validation",
    description:
      "The validation adapter in the integration kernel has zero test coverage. Write comprehensive tests covering all validation gate transitions.",
    status: "todo",
    priority: "medium",
    source: "review",
    filePaths: ["packages/kernel/src/integration-kernel/adapters/validation.ts"],
    labels: ["testing"],
    createdAt: d(7),
    updatedAt: d(7),
    estimatedMinutes: 120,
  },
  {
    id: "task-007",
    title: "Optimize graph canvas rendering for large repos",
    description:
      "Graph surfaces with >500 nodes drop below 30fps. Implement viewport culling and level-of-detail rendering so only visible nodes are drawn.",
    status: "in-progress",
    priority: "high",
    source: "user",
    assignee: "song",
    filePaths: ["src/surfaces/graph/GraphCanvas.tsx"],
    labels: ["performance", "graph"],
    createdAt: d(4),
    updatedAt: h(12),
    estimatedMinutes: 300,
  },
  {
    id: "task-008",
    title: "Design system: Add DurationLabel primitive",
    description:
      "Create a shared DurationLabel component that formats millisecond durations into human-readable strings with appropriate precision.",
    status: "done",
    priority: "low",
    source: "user",
    labels: ["design-system"],
    createdAt: d(10),
    updatedAt: d(3),
    completedAt: d(3),
    estimatedMinutes: 30,
  },
  {
    id: "task-009",
    title: "Agent team chat loses context after 50 messages",
    description:
      "The agent team chat widget truncates conversation history aggressively. Investigate the sliding window implementation and increase the retention threshold.",
    status: "blocked",
    priority: "high",
    source: "agent",
    filePaths: ["src/widgets/agent-team/AgentTeamChat.tsx"],
    labels: ["bug", "agent"],
    createdAt: d(2),
    updatedAt: d(1),
    blockedBy: ["task-001"],
    estimatedMinutes: 60,
  },
  {
    id: "task-010",
    title: "Add code lens feature for inline documentation drift",
    description:
      "Detect when inline documentation is out of sync with the actual code behavior and surface warnings via code lens annotations in the editor gutter.",
    status: "todo",
    priority: "medium",
    source: "agent",
    filePaths: ["src/features/code-lens/", "src/features/doc-drift/"],
    labels: ["feature", "code-intelligence"],
    createdAt: d(6),
    updatedAt: d(6),
    estimatedMinutes: 360,
  },
  {
    id: "task-011",
    title: "Refactor prompt box to support multi-modal input",
    description:
      "The PromptBox currently only accepts text. Extend it to support image paste, file drag-and-drop, and voice transcription attachments.",
    status: "in-progress",
    priority: "medium",
    source: "user",
    assignee: "song",
    filePaths: ["src/widgets/prompt-box/PromptBox.tsx"],
    labels: ["feature", "ux"],
    createdAt: d(8),
    updatedAt: h(4),
    estimatedMinutes: 480,
  },
  {
    id: "task-012",
    title: "Update README with new surface architecture",
    description:
      "The README still references the old panel-based architecture. Update it to reflect the new 8-surface router design with keep-alive mounting.",
    status: "done",
    priority: "low",
    source: "review",
    labels: ["docs"],
    createdAt: d(12),
    updatedAt: d(2),
    completedAt: d(2),
    estimatedMinutes: 45,
  },
  {
    id: "task-013",
    title: "Investigate memory leak in timeline surface",
    description:
      "The timeline surface accumulates DOM nodes over time because event listeners are not cleaned up when entries scroll out of view. Profile and fix the leak.",
    status: "todo",
    priority: "high",
    source: "ci",
    filePaths: ["src/surfaces/timeline/"],
    labels: ["bug", "performance"],
    createdAt: h(18),
    updatedAt: h(18),
    estimatedMinutes: 150,
  },
  {
    id: "task-014",
    title: "Add dark/light theme toggle animation",
    description:
      "Theme transitions are currently instant. Add a smooth crossfade animation when switching between light and dark themes to reduce visual jarring.",
    status: "done",
    priority: "low",
    source: "user",
    labels: ["ux", "theming"],
    createdAt: d(20),
    updatedAt: d(5),
    completedAt: d(5),
    estimatedMinutes: 45,
  },
];

// ─── Filter State ───────────────────────────────────────

export interface TaskFilter {
  readonly status: TaskStatus | null;
  readonly priority: TaskPriority | null;
  readonly search: string;
}

// ─── Core Atoms ─────────────────────────────────────────

export const taskListAtom = atom<readonly ProjectTask[]>(MOCK_TASKS);
export const taskFilterAtom = atom<TaskFilter>({ status: null, priority: null, search: "" });
export const taskViewModeAtom = atom<"list" | "board">("list");
export const selectedTaskIdAtom = atom<string | null>(null);

// ─── Derived Atoms ──────────────────────────────────────

export const filteredTasksAtom = atom((get) => {
  const tasks = get(taskListAtom);
  const filter = get(taskFilterAtom);
  const search = filter.search.toLowerCase().trim();

  return tasks.filter((t) => {
    if (filter.status !== null && t.status !== filter.status) return false;
    if (filter.priority !== null && t.priority !== filter.priority) return false;
    if (search !== "") {
      const haystack = `${t.title} ${t.description} ${(t.labels ?? []).join(" ")} ${t.assignee ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
});

export const taskCountsByStatusAtom = atom((get) => {
  const tasks = get(taskListAtom);
  const counts: Record<TaskStatus, number> = { todo: 0, "in-progress": 0, done: 0, blocked: 0 };
  for (const t of tasks) counts[t.status]++;
  return counts as Readonly<typeof counts>;
});

export const selectedTaskAtom = atom((get) => {
  const id = get(selectedTaskIdAtom);
  if (id === null) return null;
  return get(taskListAtom).find((t) => t.id === id) ?? null;
});

// ─── Write Atoms ────────────────────────────────────────

export const addTaskAtom = atom(null, (get, set, task: ProjectTask) => {
  set(taskListAtom, [...get(taskListAtom), task]);
});

export const updateTaskStatusAtom = atom(null, (get, set, payload: { id: string; status: TaskStatus }) => {
  const tasks = get(taskListAtom);
  const next = tasks.map((t): ProjectTask => {
    if (t.id !== payload.id) return t;
    const base = { ...t, status: payload.status, updatedAt: Date.now() };
    if (payload.status === "done") return { ...base, completedAt: Date.now() };
    return base;
  });
  set(taskListAtom, next);
});

export const deleteTaskAtom = atom(null, (get, set, id: string) => {
  set(
    taskListAtom,
    get(taskListAtom).filter((t) => t.id !== id),
  );
  const selected = get(selectedTaskIdAtom);
  if (selected === id) set(selectedTaskIdAtom, null);
});
