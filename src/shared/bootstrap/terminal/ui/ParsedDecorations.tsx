/**
 * ParsedDecorations — RFC-TERMINAL-004 §3.4, RFC-000 §6
 *
 * Inline decoration components for parsed terminal events.
 * These render as small interactive chips within the overlay,
 * positioned alongside the relevant output lines.
 */

import { memo } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type {
  DiagnosticEvent,
  FileLinkEvent,
  ParsedTerminalEvent,
  PortBindingEvent,
  TestResultEvent,
  UrlEvent,
} from "../model/types";

// ─── Module-level config constants (avoid per-render allocation) ────

const SEVERITY_CONFIG = {
  error: { icon: "error", color: "text-vsc-error", bg: "bg-vsc-error/10" },
  warning: { icon: "warning", color: "text-vsc-warning", bg: "bg-vsc-warning/10" },
  info: { icon: "info", color: "text-vsc-info", bg: "bg-vsc-info/10" },
} as const;

const TEST_STATUS_CONFIG = {
  pass: { icon: "check", color: "text-vsc-success", bg: "bg-vsc-success/8" },
  fail: { icon: "close", color: "text-vsc-error", bg: "bg-vsc-error/8" },
  skip: { icon: "circle-slash", color: "text-vsc-warning", bg: "bg-vsc-warning/8" },
} as const;

// ─── Diagnostic Chip ───────────────────────────────────────

interface DiagnosticChipProps {
  diagnostic: DiagnosticEvent;
  onClick?: (diagnostic: DiagnosticEvent) => void;
  className?: string;
}

export const DiagnosticChip = memo(function DiagnosticChip({
  diagnostic,
  onClick,
  className,
}: DiagnosticChipProps) {
  const severityConfig = SEVERITY_CONFIG[diagnostic.severity];

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
        "text-3xs font-mono",
        "hover:brightness-110 transition-colors duration-fast cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vsc-accent/50",
        severityConfig.bg,
        severityConfig.color,
        className,
      )}
      onClick={() => onClick?.(diagnostic)}
      title={`${diagnostic.file}:${diagnostic.line} — ${diagnostic.message}`}
    >
      <Icon name={severityConfig.icon} size={10} />
      <span className="max-w-[200px] truncate">{diagnostic.message}</span>
      <span className="opacity-60">{diagnostic.file}:{diagnostic.line}</span>
    </button>
  );
});

// ─── File Link Chip ────────────────────────────────────────

interface FileLinkChipProps {
  link: FileLinkEvent;
  onClick?: (link: FileLinkEvent) => void;
  className?: string;
}

export const FileLinkChip = memo(function FileLinkChip({
  link,
  onClick,
  className,
}: FileLinkChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
        "text-3xs font-mono",
        "bg-vsc-accent/8 text-vsc-accent",
        "hover:bg-vsc-accent/15 hover:shadow-sm hover:shadow-vsc-accent/10 transition-colors duration-fast",
        "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vsc-accent/50",
        className,
      )}
      onClick={() => onClick?.(link)}
      title={`Open ${link.file}:${link.line}`}
    >
      <Icon name="go-to-file" size={10} />
      <span>{link.text}</span>
    </button>
  );
});

// ─── URL Chip ──────────────────────────────────────────────

interface UrlChipProps {
  urlEvent: UrlEvent;
  onClick?: (urlEvent: UrlEvent) => void;
  className?: string;
}

export const UrlChip = memo(function UrlChip({
  urlEvent,
  onClick,
  className,
}: UrlChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
        "text-3xs font-mono",
        "bg-vsc-info/8 text-vsc-info",
        "hover:bg-vsc-info/15 hover:shadow-sm hover:shadow-vsc-info/10 transition-colors duration-fast underline",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vsc-info/50",
        className,
      )}
      onClick={() => onClick?.(urlEvent)}
      title={urlEvent.url}
    >
      <Icon name="link-external" size={10} />
      <span className="max-w-[200px] truncate">{urlEvent.text}</span>
    </button>
  );
});

// ─── Port Binding Chip ─────────────────────────────────────

interface PortBindingChipProps {
  port: PortBindingEvent;
  onClick?: (port: PortBindingEvent) => void;
  className?: string;
}

export const PortBindingChip = memo(function PortBindingChip({
  port,
  onClick,
  className,
}: PortBindingChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
        "text-3xs font-mono",
        "bg-vsc-success/8 text-vsc-success",
        "hover:bg-vsc-success/15 hover:shadow-sm hover:shadow-vsc-success/10 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vsc-success/50",
        className,
      )}
      onClick={() => onClick?.(port)}
      title={`${port.host}:${port.port}`}
    >
      <Icon name="globe" size={10} />
      <span>:{port.port}</span>
    </button>
  );
});

// ─── Test Result Chip ──────────────────────────────────────

interface TestResultChipProps {
  test: TestResultEvent;
  className?: string;
}

export const TestResultChip = memo(function TestResultChip({
  test,
  className,
}: TestResultChipProps) {
  const config = TEST_STATUS_CONFIG[test.status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
        "text-3xs font-mono",
        config.bg,
        config.color,
        className,
      )}
      title={test.message ?? test.testName}
    >
      <Icon name={config.icon} size={10} />
      <span className="max-w-[160px] truncate">{test.testName}</span>
      {test.duration !== undefined && (
        <span className="opacity-60">{test.duration}ms</span>
      )}
    </span>
  );
});

// ─── ParsedEventDecoration (dispatcher) ────────────────────

export interface ParsedEventDecorationProps {
  event: ParsedTerminalEvent;
  onDiagnosticClick?: (d: DiagnosticEvent) => void;
  onFileLinkClick?: (l: FileLinkEvent) => void;
  onUrlClick?: (u: UrlEvent) => void;
  onPortClick?: (p: PortBindingEvent) => void;
  className?: string;
}

export const ParsedEventDecoration = memo(function ParsedEventDecoration({
  event,
  onDiagnosticClick,
  onFileLinkClick,
  onUrlClick,
  onPortClick,
  className,
}: ParsedEventDecorationProps) {
  switch (event.kind) {
    case "diagnostic":
      return (
        <DiagnosticChip
          diagnostic={event.data as DiagnosticEvent}
          onClick={onDiagnosticClick}
          className={className}
        />
      );
    case "file-link":
      return (
        <FileLinkChip
          link={event.data as FileLinkEvent}
          onClick={onFileLinkClick}
          className={className}
        />
      );
    case "url":
      return (
        <UrlChip
          urlEvent={event.data as UrlEvent}
          onClick={onUrlClick}
          className={className}
        />
      );
    case "port-binding":
      return (
        <PortBindingChip
          port={event.data as PortBindingEvent}
          onClick={onPortClick}
          className={className}
        />
      );
    case "test-result":
      return (
        <TestResultChip
          test={event.data as TestResultEvent}
          className={className}
        />
      );
    case "progress":
    case "task-lifecycle":
    case "summary":
      // These event kinds are informational and don't render inline chips.
      // They are consumed by StickyCommandHeader and OverlayRoot instead.
      return null;
    default: {
      // Exhaustiveness guard — triggers TS error if a new kind is added without handling
      const exhaustiveCheck: never = event.kind;
      void exhaustiveCheck;
      return null; // Graceful degradation for unknown event kinds at runtime
    }
  }
});
