/* eslint-disable react-refresh/only-export-components */
import React from "react";

import { registerFeatureSheet } from "./featureSheetRegistry";

/* ---------- Lazy-loaded widget components ---------- */

const AgentsPanel = React.lazy(() =>
  import("~widgets/agents-panel").then((m) => ({ default: m.AgentsPanel })),
);
const SemanticSearchPanel = React.lazy(() =>
  import("~widgets/semantic-search-panel").then((m) => ({ default: m.SemanticSearchPanel })),
);
const GitHistoryPanel = React.lazy(() =>
  import("~widgets/git-history-panel").then((m) => ({ default: m.GitHistoryPanel })),
);
const CompactionHistoryPanel = React.lazy(() =>
  import("~widgets/compaction-history-panel").then((m) => ({
    default: m.CompactionHistoryPanel,
  })),
);
const DeepWikiPanel = React.lazy(() =>
  import("~widgets/deep-wiki").then((m) => ({ default: m.DeepWikiPanel })),
);
const LivePreviewPanel = React.lazy(() =>
  import("~widgets/live-preview").then((m) => ({ default: m.LivePreviewPanel })),
);
const MachineSnapshotList = React.lazy(() =>
  import("~widgets/machine-snapshots").then((m) => ({ default: m.MachineSnapshotList })),
);
const ScratchpadPanel = React.lazy(() =>
  import("~widgets/scratchpad").then((m) => ({ default: m.ScratchpadPanel })),
);
const WorkspaceGraphPanel = React.lazy(() =>
  import("~widgets/workspace-graph-panel").then((m) => ({ default: m.WorkspaceGraphPanel })),
);
const BackgroundAgentPanel = React.lazy(() =>
  import("~widgets/background-agent-panel").then((m) => ({ default: m.BackgroundAgentPanel })),
);
const IntentTimelinePanel = React.lazy(() =>
  import("~widgets/intent-timeline").then((m) => ({ default: m.IntentTimelinePanel })),
);
const TerminalBridgePanel = React.lazy(() =>
  import("~widgets/terminal-bridge").then((m) => ({ default: m.TerminalBridgePanel })),
);
const ResourceMonitorPanel = React.lazy(() =>
  import("~widgets/resource-monitor").then((m) => ({ default: m.ResourceMonitorPanel })),
);
const MissionControlGrid = React.lazy(() =>
  import("~widgets/mission-control").then((m) => ({ default: m.MissionControlGrid })),
);
const PipelineOverviewPanel = React.lazy(() =>
  import("~widgets/pipeline-overview-panel").then((m) => ({
    default: m.PipelineOverviewPanel,
  })),
);
const ReviewChangesPanel = React.lazy(() =>
  import("~widgets/review-changes-panel").then((m) => ({ default: m.ReviewChangesPanel })),
);
const BackgroundJobsPanel = React.lazy(() =>
  import("~widgets/background-jobs-panel").then((m) => ({ default: m.BackgroundJobsPanel })),
);
const WorkspaceAwarenessPanel = React.lazy(() =>
  import("~widgets/workspace-awareness").then((m) => ({ default: m.WorkspaceAwarenessPanel })),
);
const ActivityFeed = React.lazy(() =>
  import("~widgets/activity-feed").then((m) => ({ default: m.ActivityFeed })),
);

/* ---------- Self-registrations ---------- */

registerFeatureSheet({
  id: "agents",
  title: "Agents",
  icon: "server-process",
  render: () => <AgentsPanel />,
});
registerFeatureSheet({
  id: "search",
  title: "Semantic Search",
  icon: "search",
  render: () => <SemanticSearchPanel />,
});
registerFeatureSheet({
  id: "git",
  title: "Git History",
  icon: "git-commit",
  render: () => <GitHistoryPanel />,
});
registerFeatureSheet({
  id: "compact",
  title: "Compaction",
  icon: "fold",
  render: () => <CompactionHistoryPanel />,
});
registerFeatureSheet({
  id: "wiki",
  title: "DeepWiki",
  icon: "book",
  render: () => <DeepWikiPanel />,
});
registerFeatureSheet({
  id: "preview",
  title: "Live Preview",
  icon: "open-preview",
  render: () => <LivePreviewPanel />,
});
registerFeatureSheet({
  id: "snapshots",
  title: "Snapshots",
  icon: "save",
  render: () => <MachineSnapshotList />,
});
registerFeatureSheet({
  id: "notes",
  title: "Notes",
  icon: "note",
  render: () => <ScratchpadPanel />,
});
registerFeatureSheet({
  id: "graph",
  title: "Workspace Graph",
  icon: "graph-line",
  render: () => <WorkspaceGraphPanel />,
});
registerFeatureSheet({
  id: "bg-agents",
  title: "Background Agents",
  icon: "robot",
  render: () => <BackgroundAgentPanel />,
});
registerFeatureSheet({
  id: "intent",
  title: "Intent Timeline",
  icon: "timeline-open",
  render: () => <IntentTimelinePanel />,
});
registerFeatureSheet({
  id: "terminal",
  title: "Terminal Bridge",
  icon: "terminal",
  render: () => <TerminalBridgePanel />,
});
registerFeatureSheet({
  id: "resources",
  title: "Resources",
  icon: "dashboard",
  render: () => <ResourceMonitorPanel />,
});
registerFeatureSheet({
  id: "mission",
  title: "Mission Control",
  icon: "layout",
  render: () => <MissionControlGrid />,
});
registerFeatureSheet({
  id: "pipeline",
  title: "Pipeline",
  icon: "beaker",
  render: () => <PipelineOverviewPanel />,
});
registerFeatureSheet({
  id: "review",
  title: "Review Changes",
  icon: "git-pull-request",
  render: () => <ReviewChangesPanel />,
});
registerFeatureSheet({
  id: "jobs",
  title: "Background Jobs",
  icon: "cloud",
  render: () => <BackgroundJobsPanel />,
});
registerFeatureSheet({
  id: "workspace",
  title: "Workspace",
  icon: "files",
  render: () => <WorkspaceAwarenessPanel />,
});
registerFeatureSheet({
  id: "activity",
  title: "Activity",
  icon: "output",
  render: () => <ActivityFeed />,
});
