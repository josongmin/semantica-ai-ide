import React, { useCallback, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { cn, Icon, Text } from "~shared/ui";

import { dispatchIntentAtom } from "../../../app/shell/model/intentRouter";
import {
  buildDriftFixMessage,
  driftAgentPayloadAtom,
  type DriftFixIntent,
} from "../model/agentBridgeAtoms";
import {
  dismissDriftAtom,
  docDriftItemsAtom,
  docDriftScanningAtom,
  docDriftSummaryAtom,
  type DocStatus,
  docStatusMapAtom,
  type DriftItem,
  scanDocDriftAtom,
} from "../model/docDriftAtoms";
import { DriftItemCard } from "./DriftItemCard";
import { DriftSummaryBar } from "./DriftSummaryBar";

// ─── Scan Button (shared between empty state + bottom action) ────

function ScanButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1 text-2xs rounded-sm cursor-pointer",
        "bg-vsc-surface-2 border border-vsc-border/20",
        "text-vsc-text-secondary hover:bg-vsc-surface-3",
        "transition-colors duration-fast focus-ring"
      )}
    >
      Scan Now
    </button>
  );
}

// ─── Doc Drift Panel (Bottom Zone) ──────────────────────────

export const DocDriftPanel = React.memo(function DocDriftPanel() {
  const driftItems = useAtomValue(docDriftItemsAtom);
  const statusMap = useAtomValue(docStatusMapAtom);
  const summary = useAtomValue(docDriftSummaryAtom);
  const scanning = useAtomValue(docDriftScanningAtom);
  const scan = useSetAtom(scanDocDriftAtom);
  const dismiss = useSetAtom(dismissDriftAtom);
  const setAgentPayload = useSetAtom(driftAgentPayloadAtom);
  const dispatch = useSetAtom(dispatchIntentAtom);

  const handleFix = useCallback(
    (item: DriftItem, intent: DriftFixIntent) => {
      setAgentPayload({
        item,
        intent,
        autoMessage: buildDriftFixMessage(item, intent),
      });
      dispatch({ action: "show-frame", frame: "dock-right" });
    },
    [setAgentPayload, dispatch],
  );

  const { drifted, synced, unlinked } = useMemo(() => {
    const d: DocStatus[] = [];
    const s: DocStatus[] = [];
    const u: DocStatus[] = [];

    for (const doc of statusMap.values()) {
      if (doc.status === "drifted") d.push(doc);
      else if (doc.status === "synced") s.push(doc);
      else u.push(doc); // new + unlinked
    }

    return { drifted: d, synced: s, unlinked: u };
  }, [statusMap]);

  const driftsByDoc = useMemo(() => {
    const map = new Map<string, DriftItem[]>();
    for (const item of driftItems) {
      const list = map.get(item.docPath) ?? [];
      list.push(item);
      map.set(item.docPath, list);
    }
    return map;
  }, [driftItems]);

  const handleScan = useCallback(() => {
    void scan();
  }, [scan]);

  const handleDismiss = useCallback(
    (driftId: string) => {
      dismiss(driftId);
    },
    [dismiss],
  );

  return (
    <div className="flex flex-col h-full bg-vsc-surface-0">
      {/* Summary bar */}
      <DriftSummaryBar summary={summary} scanning={scanning} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {scanning && <ScanningPlaceholder />}
        {!scanning && statusMap.size === 0 && <EmptyState onScan={handleScan} />}
        {!scanning && statusMap.size > 0 && (
          <div className="p-2 space-y-3">
            {/* Drifted Documents */}
            {drifted.length > 0 && (
              <SectionGroup title="Drifted Documents" icon="warning" iconColor="text-vsc-warning">
                {drifted.map((doc) => (
                  <DriftedDocGroup
                    key={doc.path}
                    doc={doc}
                    items={driftsByDoc.get(doc.path) ?? []}
                    onFix={handleFix}
                    onDismiss={handleDismiss}
                  />
                ))}
              </SectionGroup>
            )}

            {/* Synced Documents */}
            {synced.length > 0 && (
              <SectionGroup title="Synced Documents" icon="check-all" iconColor="text-vsc-success">
                {synced.map((doc) => (
                  <SyncedDocRow key={doc.path} doc={doc} />
                ))}
              </SectionGroup>
            )}

            {/* Unlinked / New Documents */}
            {unlinked.length > 0 && (
              <SectionGroup
                title="Unlinked Documents"
                icon="question"
                iconColor="text-vsc-text-ghost"
              >
                {unlinked.map((doc) => (
                  <UnlinkedDocRow key={doc.path} doc={doc} />
                ))}
              </SectionGroup>
            )}

            {/* Scan Now button */}
            <div className="pt-1">
              <ScanButton onClick={handleScan} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Section Group ──────────────────────────────────────────

const SectionGroup = React.memo(function SectionGroup({
  title,
  icon,
  iconColor,
  children,
}: {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon name={icon} tokenSize="2xs" className={cn("shrink-0", iconColor)} />
        <span className="text-2xs font-medium text-vsc-text-secondary uppercase tracking-wider">
          {title}
        </span>
        <div className="flex-1 border-t border-vsc-border/15" />
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
});

// ─── Drifted Doc Group ──────────────────────────────────────

const DriftedDocGroup = React.memo(function DriftedDocGroup({
  doc,
  items,
  onFix,
  onDismiss,
}: {
  doc: DocStatus;
  items: DriftItem[];
  onFix: (item: DriftItem, intent: DriftFixIntent) => void;
  onDismiss: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand group" : "Collapse group"}
        className="flex items-center gap-1.5 w-full py-0.5 text-left
                   bg-transparent border-none cursor-pointer
                   hover:bg-vsc-list-hover rounded-sm transition-colors duration-fast focus-ring"
      >
        <Icon
          name={collapsed ? "chevron-right" : "chevron-down"}
          tokenSize="2xs"
          className="text-vsc-text-ghost shrink-0"
        />
        <Icon name="warning" tokenSize="2xs" className="text-vsc-warning shrink-0" />
        <span className="text-xs text-vsc-fg font-medium">{doc.fileName}</span>
        <span className="ml-auto text-2xs text-vsc-text-ghost tabular-nums">
          {doc.driftCount} {doc.driftCount === 1 ? "issue" : "issues"}
        </span>
      </button>

      {!collapsed && items.length > 0 && (
        <div className="pl-4 pt-1 space-y-1.5">
          {items.map((item) => (
            <DriftItemCard
              key={item.id}
              item={item}
              onFixDoc={() => onFix(item, "fix-doc")}
              onFixCode={() => onFix(item, "fix-code")}
              onDismiss={() => onDismiss(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Synced Doc Row ─────────────────────────────────────────

const SyncedDocRow = React.memo(function SyncedDocRow({ doc }: { doc: DocStatus }) {
  return (
    <div className="flex items-center gap-1.5 py-0.5 px-1">
      <Icon name="check" tokenSize="2xs" className="text-vsc-success shrink-0" />
      <span className="text-xs text-vsc-fg/80">{doc.fileName}</span>
      <span className="ml-auto text-2xs text-vsc-text-ghost">synced</span>
    </div>
  );
});

// ─── Unlinked Doc Row ───────────────────────────────────────

const UnlinkedDocRow = React.memo(function UnlinkedDocRow({ doc }: { doc: DocStatus }) {
  return (
    <div className="flex items-center gap-1.5 py-0.5 px-1">
      <span className="size-2 rounded-full bg-vsc-info/60 shrink-0" />
      <span className="text-xs text-vsc-fg/80">{doc.fileName}</span>
      <span className="ml-auto text-2xs text-vsc-text-ghost">
        {doc.status === "new" ? "new" : "unlinked"}
      </span>
    </div>
  );
});

// ─── Scanning Placeholder ───────────────────────────────────

const ScanningPlaceholder = React.memo(function ScanningPlaceholder() {
  return (
    <div className="p-3 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-md bg-vsc-surface-1/60 animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
});

// ─── Empty State ────────────────────────────────────────────

const EmptyState = React.memo(function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-vsc-text-ghost">
      <Icon name="book" tokenSize="lg" className="opacity-30" />
      <Text size="xs" tone="ghost">
        No documents scanned yet
      </Text>
      <ScanButton onClick={onScan} />
    </div>
  );
});
