/* eslint-disable react-refresh/only-export-components */
import React from "react";

import { registerTurnFeature } from "./turnFeatureRegistry";

// ─── Pre-phase features ─────────────────────────────────────

const AutoContextPreview = React.lazy(() =>
  import("../auto-context-preview").then((m) => ({ default: m.AutoContextPreview })),
);
registerTurnFeature({
  id: "auto-context",
  slot: "pre-phases",
  render: (turnId) => <AutoContextPreview turnId={turnId} />,
});

const PatchSimulationBanner = React.lazy(() =>
  import("../patch-simulation").then((m) => ({ default: m.PatchSimulationBanner })),
);
registerTurnFeature({
  id: "patch-simulation",
  slot: "pre-phases",
  render: (turnId) => <PatchSimulationBanner turnId={turnId} />,
});

const SpeculativePreview = React.lazy(() =>
  import("../speculative-preview").then((m) => ({ default: m.SpeculativePreview })),
);
registerTurnFeature({
  id: "speculative-preview",
  slot: "pre-phases",
  render: (turnId) => <SpeculativePreview turnId={turnId} />,
});

const PlanModeBanner = React.lazy(() =>
  import("../plan-mode-banner").then((m) => ({ default: m.PlanModeBanner })),
);
registerTurnFeature({
  id: "plan-mode",
  slot: "pre-phases",
  render: (turnId) => <PlanModeBanner turnId={turnId} />,
});

const DebateArena = React.lazy(() =>
  import("../debate-arena").then((m) => ({ default: m.DebateArena })),
);
registerTurnFeature({
  id: "debate-arena",
  slot: "pre-phases",
  render: (turnId) => <DebateArena turnId={turnId} />,
});

const TurnMetrics = React.lazy(() =>
  import("../turn-metrics").then((m) => ({ default: m.TurnMetrics })),
);
registerTurnFeature({
  id: "turn-metrics",
  slot: "pre-phases",
  render: (turnId) => <TurnMetrics turnId={turnId} />,
});

// ─── Post-phase features ────────────────────────────────────

const UserInputCard = React.lazy(() =>
  import("../user-input-card").then((m) => ({ default: m.UserInputCard })),
);
registerTurnFeature({
  id: "user-input",
  slot: "post-phases",
  render: (turnId) => <UserInputCard turnId={turnId} />,
});

const ThreeWayDiff = React.lazy(() =>
  import("../three-way-diff").then((m) => ({ default: m.ThreeWayDiff })),
);
registerTurnFeature({
  id: "three-way-diff",
  slot: "post-phases",
  render: (turnId) => <ThreeWayDiff turnId={turnId} />,
});

const AutoFixLoopCard = React.lazy(() =>
  import("../auto-fix-loop").then((m) => ({ default: m.AutoFixLoopCard })),
);
registerTurnFeature({
  id: "auto-fix-loop",
  slot: "post-phases",
  render: (turnId) => <AutoFixLoopCard turnId={turnId} />,
});

const JitTestCard = React.lazy(() =>
  import("../jit-test-card").then((m) => ({ default: m.JitTestCard })),
);
registerTurnFeature({
  id: "jit-test",
  slot: "post-phases",
  render: (turnId) => <JitTestCard turnId={turnId} />,
});

const SelfTestLoopCard = React.lazy(() =>
  import("../self-test-loop").then((m) => ({ default: m.SelfTestLoopCard })),
);
registerTurnFeature({
  id: "self-test-loop",
  slot: "post-phases",
  render: (turnId) => <SelfTestLoopCard turnId={turnId} />,
});

const WebReferenceCard = React.lazy(() =>
  import("../web-reference-card").then((m) => ({ default: m.WebReferenceCard })),
);
registerTurnFeature({
  id: "web-reference",
  slot: "post-phases",
  render: (turnId) => <WebReferenceCard turnId={turnId} />,
});

const McpInteractiveApp = React.lazy(() =>
  import("../mcp-interactive-app").then((m) => ({ default: m.McpInteractiveApp })),
);
registerTurnFeature({
  id: "mcp-interactive",
  slot: "post-phases",
  render: (turnId) => <McpInteractiveApp turnId={turnId} />,
});

const AutoMemoryToast = React.lazy(() =>
  import("../auto-memory").then((m) => ({ default: m.AutoMemoryToast })),
);
registerTurnFeature({
  id: "auto-memory",
  slot: "post-phases",
  render: (turnId) => <AutoMemoryToast turnId={turnId} />,
});
