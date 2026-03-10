import React, { useCallback, useMemo } from "react";
import { atom, useAtomValue } from "jotai";

import { messageAtomFamily } from "~entities/message/core";
import { turnAtomFamily } from "~entities/message/turns";

import { formatCost, formatTokens } from "../../shared/lib/formatters";
import type { TurnId, UiMessage } from "../../shared/protocol";
import { cn, Icon, StatusDot, Text } from "../../shared/ui";

/** Stable null atom to avoid phantom entries in messageAtomFamily */
const nullMsgAtom = atom<UiMessage | null>(null);

// ─── Helpers ─────────────────────────────────────────────

function toStatusDot(
  status: "pending" | "running" | "success" | "error" | "paused",
): "idle" | "running" | "success" | "error" | "paused" {
  if (status === "pending") return "idle";
  return status;
}

function truncate(text: string, max = 72): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()  }\u2026`;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (s < 10) return "\uBC29\uAE08";
  if (s < 60) return `${s}\uCD08 \uC804`;
  if (m < 60) return `${m}\uBD84 \uC804`;
  if (h < 24) return `${h}\uC2DC\uAC04 \uC804`;
  return formatTime(ms);
}

// ─── TocCard (rich turn row) ──────────────────────────────

export const TocCard = React.memo(function TocCard({
  turnId,
  index,
  onNavigate,
  onClose,
  cardRef,
}: {
  readonly turnId: TurnId;
  readonly index: number;
  readonly onNavigate: (turnId: TurnId) => void;
  readonly onClose: () => void;
  cardRef?: (el: HTMLButtonElement | null) => void;
}) {
  const turn = useAtomValue(turnAtomFamily(turnId));

  const firstUserMsgId =
    turn?.phases.find((p) => p.phase === "user_message")?.message_ids[0] ?? null;

  const msgAtom = useMemo(
    () => (firstUserMsgId ? messageAtomFamily(firstUserMsgId) : nullMsgAtom),
    [firstUserMsgId],
  );
  const firstUserMsg = useAtomValue(msgAtom);

  const handleClick = useCallback(() => {
    onNavigate(turnId);
    onClose();
  }, [turnId, onNavigate, onClose]);

  if (!turn) return null;

  const preview = firstUserMsg?.text ? truncate(firstUserMsg.text) : "\u2026";
  const isRunning = turn.status === "running";
  const tokenTotal =
    turn.token_usage != null
      ? turn.token_usage.input_tokens + turn.token_usage.output_tokens
      : null;

  const fmt = (ms: number) =>
    ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={handleClick}
      className={cn(
        "group/card w-full text-left rounded-xl p-4 transition-[color,background-color,border-color,box-shadow,transform] duration-normal",
        "border border-vsc-border/50 bg-vsc-surface-1/90 backdrop-blur",
        "hover:border-vsc-focus/60 hover:bg-vsc-surface-2 hover:shadow-lg hover:shadow-vsc-focus/10 hover:-translate-y-0.5",
        "focus-ring",
        isRunning
          ? "border-vsc-focus/40 bg-vsc-focus/5 animate-[toc-card-in_250ms_ease-out_both,toc-running-pulse_2s_ease-in-out_infinite]"
          : "animate-[toc-card-in_250ms_ease-out_both]",
      )}
      style={{ animationDelay: `${index * 35}ms` }}
      data-testid={`turn-toc-card-${index + 1}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-1">
          <StatusDot status={toStatusDot(turn.status)} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Text size="xs" weight="semibold" tone="primary" mono>
              Turn {index + 1}
            </Text>
            <span
              className="text-2xs text-vsc-text-tertiary tabular-nums"
              title={formatTime(turn.created_at_ms)}
            >
              {formatRelativeTime(turn.created_at_ms)}
            </span>
          </div>
          <Text size="sm" tone="primary" className="line-clamp-2 leading-relaxed mb-2">
            {preview}
          </Text>
          {(turn.ttft_ms != null ||
            turn.latency_ms != null ||
            tokenTotal != null ||
            turn.estimated_cost_usd != null) && (
            <div className="flex flex-wrap gap-1.5">
              {turn.ttft_ms != null && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-vsc-surface-2/80
                             text-2xs text-vsc-text-tertiary tabular-nums"
                  title="Time to first token"
                >
                  <Icon name="dashboard" tokenSize="2xs" />
                  {fmt(turn.ttft_ms)}
                </span>
              )}
              {turn.latency_ms != null && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-vsc-surface-2/80
                             text-2xs text-vsc-text-tertiary tabular-nums"
                  title="Total latency"
                >
                  <Icon name="clock" tokenSize="2xs" />
                  {fmt(turn.latency_ms)}
                </span>
              )}
              {tokenTotal != null && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-vsc-surface-2/80
                             text-2xs text-vsc-text-tertiary"
                  title="Tokens"
                >
                  <Icon name="sparkle" tokenSize="2xs" />
                  {formatTokens(tokenTotal)}
                </span>
              )}
              {turn.estimated_cost_usd != null && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-vsc-surface-2/80
                             text-2xs text-vsc-text-tertiary"
                  title="Estimated cost"
                >
                  <Icon name="credit-card" tokenSize="2xs" />
                  {formatCost(turn.estimated_cost_usd)}
                </span>
              )}
            </div>
          )}
        </div>
        <Icon
          name="chevron-right"
          tokenSize="xs"
          className="shrink-0 text-vsc-text-ghost group-hover/card:text-vsc-focus transition-colors duration-fast"
        />
      </div>
    </button>
  );
});
