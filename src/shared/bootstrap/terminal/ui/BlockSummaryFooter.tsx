/**
 * BlockSummaryFooter — RFC-TERMINAL-004 §2.4
 *
 * Auto-generated summary of command output shown at the bottom of a block.
 * Displays error/warning/test counts from parsed events.
 */

import { memo, useMemo } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type {
  DiagnosticEvent,
  ParsedTerminalEvent,
  SummaryEvent,
  TestResultEvent,
} from "../model/types";

// ─── Types ───────────────────────────────────────────────

export interface BlockSummaryFooterProps {
  commandId: string;
  parsedEvents: ParsedTerminalEvent[];
  className?: string;
}

// ─── Summary Data ────────────────────────────────────────

interface SummaryData {
  errors: number;
  warnings: number;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  ports: number[];
  customText?: string;
}

function computeSummary(commandId: string, events: ParsedTerminalEvent[]): SummaryData | null {
  let errors = 0;
  let warnings = 0;
  let testsPassed = 0;
  let testsFailed = 0;
  let testsSkipped = 0;
  const ports: number[] = [];
  let customText: string | undefined;

  for (const event of events) {
    if (event.commandId !== commandId) continue;

    switch (event.kind) {
      case "diagnostic": {
        const d = event.data as DiagnosticEvent;
        if (d.severity === "error") errors++;
        else if (d.severity === "warning") warnings++;
        break;
      }
      case "test-result": {
        const t = event.data as TestResultEvent;
        if (t.status === "pass") testsPassed++;
        else if (t.status === "fail") testsFailed++;
        else testsSkipped++;
        break;
      }
      case "port-binding": {
        const p = event.data as { port: number };
        ports.push(p.port);
        break;
      }
      case "summary": {
        const s = event.data as SummaryEvent;
        customText = s.text;
        // Use counts from parser summary if available
        if (s.counts) {
          if (s.counts.failed !== undefined) testsFailed = Math.max(testsFailed, s.counts.failed);
          if (s.counts.passed !== undefined) testsPassed = Math.max(testsPassed, s.counts.passed);
          if (s.counts.skipped !== undefined) testsSkipped = Math.max(testsSkipped, s.counts.skipped);
        }
        break;
      }
      case "progress":
      case "url":
      case "file-link":
      case "task-lifecycle":
        // Informational events — not relevant for summary
        break;
    }
  }

  const hasData = errors > 0 || warnings > 0 || testsPassed > 0
    || testsFailed > 0 || testsSkipped > 0 || ports.length > 0 || customText !== undefined;

  if (!hasData) return null;

  return { errors, warnings, testsPassed, testsFailed, testsSkipped, ports, customText };
}

// ─── Badge Components ────────────────────────────────────

interface CountBadgeProps {
  icon: string;
  count: number;
  label: string;
  colorClass: string;
}

const CountBadge = memo(function CountBadge({ icon, count, label, colorClass }: CountBadgeProps) {
  if (count === 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-0.5", colorClass)} title={label}>
      <Icon name={icon} size={12} />
      <span>{count}</span>
    </span>
  );
});

// ─── BlockSummaryFooter ──────────────────────────────────

export const BlockSummaryFooter = memo(function BlockSummaryFooter({
  commandId,
  parsedEvents,
  className,
}: BlockSummaryFooterProps) {
  const summary = useMemo(
    () => computeSummary(commandId, parsedEvents),
    [commandId, parsedEvents],
  );

  if (!summary) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-1",
        "border-t border-vsc-border/15",
        "bg-vsc-surface-0/30",
        "text-3xs font-mono text-vsc-text-ghost",
        "select-none",
        className,
      )}
      data-testid="block-summary-footer"
    >
      {/* Custom text from parser (takes priority) */}
      {summary.customText && (
        <span className="text-vsc-text-secondary">{summary.customText}</span>
      )}

      {/* Diagnostic counts */}
      {!summary.customText && (
        <>
          <CountBadge icon="error" count={summary.errors} label="errors" colorClass="text-vsc-error font-semibold" />
          <CountBadge icon="warning" count={summary.warnings} label="warnings" colorClass="text-vsc-warning" />
        </>
      )}

      {/* Divider between diagnostics and tests */}
      {!summary.customText && (summary.errors > 0 || summary.warnings > 0) && (summary.testsFailed > 0 || summary.testsPassed > 0) && (
        <span className="w-px h-3 bg-vsc-border/20" />
      )}

      {/* Test result counts */}
      {(summary.testsFailed > 0 || summary.testsPassed > 0) && !summary.customText && (
        <>
          {summary.testsFailed > 0 && (
            <CountBadge icon="close" count={summary.testsFailed} label="failed" colorClass="text-vsc-error" />
          )}
          <CountBadge icon="check" count={summary.testsPassed} label="passed" colorClass="text-vsc-success" />
          {summary.testsSkipped > 0 && (
            <CountBadge icon="circle-slash" count={summary.testsSkipped} label="skipped" colorClass="text-vsc-warning" />
          )}
        </>
      )}

      {/* Port bindings */}
      {summary.ports.length > 0 && (
        <span className="inline-flex items-center gap-0.5 text-vsc-success">
          <Icon name="globe" size={10} />
          {summary.ports.map((p) => `:${p}`).join(", ")}
        </span>
      )}
    </div>
  );
});
