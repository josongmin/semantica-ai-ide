import { memo, useMemo } from "react";

import type { UserInputRequest } from "../../../shared/protocol";
import { cn, Icon, Text } from "../../../shared/ui";

// ─── Resolve answer text for display ────────────────────────
function resolveAnswerText(request: UserInputRequest): string {
  if (request.status === "cancelled") return "Skipped";
  if (request.status === "expired") return "Expired";
  if (request.answer == null) return "Skipped";
  if (request.response_type === "confirmation") {
    return request.answer === "yes" ? "Yes" : "No";
  }
  if (Array.isArray(request.answer)) {
    const choices = request.choices ?? [];
    return (request.answer as readonly string[])
      .map((id) => choices.find((c) => c.id === id)?.label ?? id)
      .join(", ");
  }
  if (request.response_type === "single_choice" && request.choices) {
    return request.choices.find((c) => c.id === request.answer)?.label ?? String(request.answer);
  }
  return String(request.answer);
}

// ─── Compact result badge (answered / cancelled / expired) ──
export const CompactResultBadge = memo(function CompactResultBadge({ request }: { request: UserInputRequest }) {
  const answerText = useMemo(() => resolveAnswerText(request), [request]);

  const isAnswered = request.status === "answered";
  const isCancelled = request.status === "cancelled";
  const isExpired = request.status === "expired";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-md",
        "animate-[fade-in_200ms_ease] transition-colors duration-normal",
        isAnswered && "bg-vsc-success/5 border border-vsc-success/20",
        isCancelled && "bg-vsc-surface-2 border border-vsc-border/20",
        isExpired && "bg-vsc-warning/5 border border-vsc-warning/15",
      )}
    >
      <Icon
        name={(() => { if (isAnswered) return "check"; if (isExpired) return "clock"; return "dash"; })()}
        tokenSize="2xs"
        className={cn(
          "shrink-0",
          isAnswered && "text-vsc-success",
          isCancelled && "text-vsc-text-ghost",
          isExpired && "text-vsc-warning",
        )}
      />
      <Text size="2xs" tone={isAnswered ? "secondary" : "ghost"} truncate className="flex-1 min-w-0">
        {request.question}
      </Text>
      <Text size="2xs" tone={isAnswered ? "primary" : "ghost"} weight="medium" className="shrink-0">
        {answerText}
      </Text>
    </div>
  );
});
