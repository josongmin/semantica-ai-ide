import type { RepoOverview } from "./repoExplainAtoms";

export const MOCK_REPO_OVERVIEW: RepoOverview = {
  projectName: "semantica-code-agent-plugin",
  tagline: "AI-powered code agent IDE with semantic understanding",

  architecture: {
    nodes: [
      {
        id: "frontend",
        label: "Frontend",
        description: "React-based IDE shell with surface routing and Jotai state",
        tech: ["React", "Jotai", "Tailwind v4"],
      },
      {
        id: "protocol",
        label: "Protocol",
        description: "postMessage bridge and atom-based state synchronization",
        tech: ["postMessage", "Jotai atoms"],
      },
      {
        id: "desktop",
        label: "Desktop",
        description: "Native desktop runtime with terminal and system integration",
        tech: ["Tauri v2", "Rust PTY"],
      },
    ],
    edges: [
      { from: "frontend", to: "protocol", label: "state sync" },
      { from: "protocol", to: "desktop", label: "IPC bridge" },
    ],
  },

  modules: [
    {
      name: "Shell",
      description: "5-zone IDE layout with sidebar, top bar, surfaces, bottom panel, and agent panel",
      fileCount: 8,
      path: "src/app/shell/",
    },
    {
      name: "Surfaces",
      description: "Pluggable content surfaces: code editor, graph, agents, tasks, and overview",
      fileCount: 12,
      path: "src/surfaces/",
    },
    {
      name: "Features",
      description: "12 feature modules covering terminal, themes, auth, CI/CD, security, and more",
      fileCount: 40,
      path: "src/features/",
    },
    {
      name: "Widgets",
      description: "15 chat and UI widgets: prompt box, message list, markdown, quotes, and cards",
      fileCount: 30,
      path: "src/widgets/",
    },
    {
      name: "Shared",
      description: "Primitives, composites, layout components, design tokens, and utility hooks",
      fileCount: 60,
      path: "src/shared/",
    },
  ],

  entryPoints: [
    {
      name: "App.tsx",
      description: "React application root with streaming bootstrap",
      filePath: "src/app/App.tsx",
      children: [
        { name: "StreamingBootstrap", filePath: "src/app/StreamingBootstrap.tsx" },
        { name: "ShellLayout", filePath: "src/app/shell/ShellLayout.tsx" },
      ],
    },
    {
      name: "lib.rs",
      description: "Tauri desktop entry point with terminal and window setup",
      filePath: "apps/desktop/src-tauri/src/lib.rs",
      children: [
        { name: "run()", filePath: "apps/desktop/src-tauri/src/lib.rs" },
      ],
    },
  ],

  criticalFlows: [
    {
      name: "Chat Flow",
      description: "User message through the streaming pipeline to rendered output",
      steps: [
        { label: "PromptBox", filePath: "src/widgets/prompt-box/PromptBox.tsx" },
        { label: "postMessage", filePath: "src/shared/lib/TransportContext.ts" },
        { label: "event-dispatch", filePath: "src/app/event-dispatch/handlers/uiHandlers.ts" },
        { label: "Jotai atoms", filePath: "src/entities/message/model/atoms.ts" },
        { label: "MessageList", filePath: "src/widgets/message-list/MessageList.tsx" },
      ],
    },
    {
      name: "Terminal Flow",
      description: "Terminal command execution through Tauri IPC to Rust PTY",
      steps: [
        { label: "Tauri invoke", filePath: "src/features/terminal/model/atoms.ts" },
        { label: "Rust PTY", filePath: "apps/desktop/src-tauri/src/terminal.rs" },
        { label: "event stream" },
        { label: "terminal atoms", filePath: "src/features/terminal/model/atoms.ts" },
      ],
    },
    {
      name: "Editor Flow",
      description: "File selection through state management to syntax-highlighted rendering",
      steps: [
        { label: "file select", filePath: "src/surfaces/editor/editorAtoms.ts" },
        { label: "editorAtoms", filePath: "src/surfaces/editor/editorAtoms.ts" },
        { label: "CodeMirror", filePath: "src/surfaces/editor/CodeMirrorEditor.tsx" },
        { label: "syntax highlight" },
      ],
    },
  ],

  conventions: [
    { label: "State", value: "Jotai atoms (primitive + derived)" },
    { label: "Style", value: "Tailwind v4 + vsc-* design tokens" },
    { label: "Routing", value: "SurfaceId-based surface router" },
    { label: "Testing", value: "Vitest" },
    { label: "Components", value: "React.memo + lazy loading" },
    { label: "Imports", value: "~shared/ alias" },
  ],

  risks: [
    {
      severity: "warning",
      title: "Terminal bootstrap race condition",
      description:
        "The terminal bootstrap sequence and event listener registration can race, causing missed initial output if the PTY writes before the listener is attached.",
    },
    {
      severity: "warning",
      title: "Vite dynamic import for Tauri APIs",
      description:
        "Tauri API imports require string indirection to avoid Vite static analysis, which can break if the bundler configuration changes.",
    },
  ],
};
