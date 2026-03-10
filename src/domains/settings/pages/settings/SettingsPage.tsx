import React from "react";
import { useAtom } from "jotai";

import { type SettingsTab, settingsTabAtom } from "~shared/lib";
import { cn, ErrorBoundary, Icon, InlineBanner, Text } from "~shared/ui";

import { AccountSection } from "./sections/AccountSection";
import { AuditSection } from "./sections/AuditSection";
import { HooksSection } from "./sections/HooksSection";
import { McpSection } from "./sections/McpSection";
import { ModelSection } from "./sections/ModelSection";
import { PermissionSection } from "./sections/PermissionSection";
import { PipelineSection } from "./sections/PipelineSection";
import { RulesSection } from "./sections/RulesSection";
import { ThemeSection } from "./sections/ThemeSection";

const SETTINGS_TABS: readonly { id: SettingsTab; label: string; icon: string }[] = [
  { id: "account", label: "Account", icon: "account" },
  { id: "model", label: "Model", icon: "hubot" },
  { id: "pipeline", label: "Pipeline", icon: "server-process" },
  { id: "rules", label: "Rules", icon: "law" },
  { id: "mcp", label: "MCP", icon: "plug" },
  { id: "hooks", label: "Hooks", icon: "zap" },
  { id: "permissions", label: "Permissions", icon: "shield" },
  { id: "appearance", label: "Theme", icon: "paintcan" },
  { id: "audit", label: "Audit", icon: "list-ordered" },
];

export const SettingsPage = React.memo(function SettingsPage() {
  const [activeTab, setActiveTab] = useAtom(settingsTabAtom);

  return (
    <div
      data-testid="settings-page"
      className="flex h-full w-full min-w-0 bg-vsc-bg max-w-5xl mx-auto"
    >
      {/* Sidebar nav */}
      <nav className="flex flex-col w-44 shrink-0 border-r border-vsc-border/30 bg-vsc-bg">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 shrink-0">
          <Text size="sm" weight="semibold" tone="primary">
            Settings
          </Text>
        </div>

        {/* Tab list */}
        <div className="flex flex-col gap-0.5 px-2 py-1 flex-1 overflow-y-auto">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-xs text-left",
                "cursor-pointer border-none transition-colors duration-fast",
                activeTab === tab.id
                  ? "bg-vsc-accent/12 text-vsc-accent font-medium"
                  : "bg-transparent text-vsc-text-secondary hover:bg-vsc-list-hover hover:text-vsc-fg",
              )}
            >
              <Icon
                name={tab.icon}
                tokenSize="2xs"
                className={activeTab === tab.id ? "text-vsc-accent" : "text-vsc-text-tertiary"}
              />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div
        key={activeTab}
        className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pt-3 pb-6 animate-[fade-in_120ms_ease] scroll-shadow [scrollbar-gutter:stable]"
      >
        <ErrorBoundary
          fallback={
            <div className="px-6 py-4">
              <InlineBanner variant="error">
                This settings section failed to load. Try another tab.
              </InlineBanner>
            </div>
          }
        >
          {activeTab === "appearance" && <ThemeSection />}
          {activeTab === "account" && <AccountSection />}
          {activeTab === "model" && <ModelSection />}
          {activeTab === "pipeline" && <PipelineSection />}
          {activeTab === "permissions" && <PermissionSection />}
          {activeTab === "mcp" && <McpSection />}
          {activeTab === "rules" && <RulesSection />}
          {activeTab === "hooks" && <HooksSection />}
          {activeTab === "audit" && <AuditSection />}
        </ErrorBoundary>
      </div>
    </div>
  );
});
