/* eslint-disable react-refresh/only-export-components */
import React from "react";

import { registerDialog } from "./dialogRegistry";

/* ---------- Lazy-loaded dialog components ---------- */

const DangerousApprovalGate = React.lazy(() =>
  import("~widgets/tool-call-group").then((m) => ({ default: m.DangerousApprovalGate })),
);
const PermissionSettingsDialog = React.lazy(() =>
  import("~widgets/permission-settings").then((m) => ({
    default: m.PermissionSettingsDialog,
  })),
);
const ScopeGuardDialog = React.lazy(() =>
  import("~widgets/scope-guard").then((m) => ({ default: m.ScopeGuardDialog })),
);
const AutoCompactDialog = React.lazy(() =>
  import("~widgets/auto-compact-dialog").then((m) => ({ default: m.AutoCompactDialog })),
);
const QuickFileOpenPalette = React.lazy(() =>
  import("~widgets/quick-file-open").then((m) => ({ default: m.QuickFileOpenPalette })),
);
const BookmarkDrawer = React.lazy(() =>
  import("~widgets/turn-bookmark").then((m) => ({ default: m.BookmarkDrawer })),
);
const SessionShareDialog = React.lazy(() =>
  import("~widgets/session-share-dialog").then((m) => ({ default: m.SessionShareDialog })),
);
const ExportDialog = React.lazy(() =>
  import("~widgets/export-dialog").then((m) => ({ default: m.ExportDialog })),
);
const TeamConfigSync = React.lazy(() =>
  import("~widgets/team-config-sync").then((m) => ({ default: m.TeamConfigSync })),
);
const PRSummaryCard = React.lazy(() =>
  import("~widgets/pr-summary-card").then((m) => ({ default: m.PRSummaryCard })),
);
const McpRegistryBrowser = React.lazy(() =>
  import("~widgets/mcp-registry").then((m) => ({ default: m.McpRegistryBrowser })),
);
const ModeGallery = React.lazy(() =>
  import("~widgets/mode-gallery").then((m) => ({ default: m.ModeGallery })),
);
const PlaybookMarket = React.lazy(() =>
  import("~widgets/playbook-market").then((m) => ({ default: m.PlaybookMarket })),
);
const RewindPanel = React.lazy(() =>
  import("~widgets/rewind-panel").then((m) => ({ default: m.RewindPanel })),
);
const CodeBlockPickerDialog = React.lazy(() =>
  import("~widgets/code-block-picker").then((m) => ({ default: m.CodeBlockPickerDialog })),
);
const CommitMessageGenerator = React.lazy(() =>
  import("~widgets/commit-message-gen").then((m) => ({ default: m.CommitMessageGenerator })),
);
const ConversationSearchOverlay = React.lazy(() =>
  import("~widgets/conversation-search").then((m) => ({
    default: m.ConversationSearchOverlay,
  })),
);
const DemoWorkflowModal = React.lazy(() =>
  import("~widgets/demo-workflow-modal").then((m) => ({ default: m.DemoWorkflowModal })),
);

/* ---------- Self-registrations ---------- */

registerDialog({ id: "approval-gate", render: () => <DangerousApprovalGate /> });
registerDialog({ id: "permission-settings", render: () => <PermissionSettingsDialog /> });
registerDialog({ id: "scope-guard", render: () => <ScopeGuardDialog /> });
registerDialog({ id: "auto-compact", render: () => <AutoCompactDialog /> });
registerDialog({ id: "quick-file-open", render: () => <QuickFileOpenPalette /> });
registerDialog({ id: "bookmark-drawer", render: () => <BookmarkDrawer /> });
registerDialog({ id: "session-share", render: () => <SessionShareDialog /> });
registerDialog({ id: "export", render: () => <ExportDialog /> });
registerDialog({ id: "team-config-sync", render: () => <TeamConfigSync /> });
registerDialog({ id: "pr-summary", render: () => <PRSummaryCard /> });
registerDialog({ id: "mcp-registry", render: () => <McpRegistryBrowser /> });
registerDialog({ id: "mode-gallery", render: () => <ModeGallery /> });
registerDialog({ id: "playbook-market", render: () => <PlaybookMarket /> });
registerDialog({ id: "rewind-panel", render: () => <RewindPanel /> });
registerDialog({ id: "code-block-picker", render: () => <CodeBlockPickerDialog /> });
registerDialog({ id: "commit-message-gen", render: () => <CommitMessageGenerator /> });
registerDialog({ id: "conversation-search", render: () => <ConversationSearchOverlay /> });
registerDialog({ id: "demo-workflow", render: () => <DemoWorkflowModal /> });
