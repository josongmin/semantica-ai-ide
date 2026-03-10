import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useAtomValue } from "jotai";

import { userInputsByTurnAtomFamily, useUserInputActions } from "../../features/user-input";
import { useAnimatedPresence } from "../../shared/lib";
import type { TurnId, UserInputRequest } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";
import { CompactResultBadge } from "./components/CompactResultBadge";
import { ConfirmationInput } from "./components/ConfirmationInput";
import { MultiChoiceInput } from "./components/MultiChoiceInput";
import { SingleChoiceInput } from "./components/SingleChoiceInput";
import { TextInputField } from "./components/TextInputField";
import { UndoOverlay } from "./components/UndoOverlay";
import { WaitingIndicator } from "./components/WaitingIndicator";
import { useUndoableSubmit } from "./hooks";

// ─── Urgency styling ────────────────────────────────────────
const URGENCY_BORDER = {
  low: "border-vsc-border/40",
  normal: "border-vsc-accent/30",
  high: "border-vsc-warning/50",
} as const;

const URGENCY_GLOW = {
  low: "",
  normal: "",
  high: "shadow-glow-warning",
} as const;

const URGENCY_ICON = {
  low: "comment-discussion",
  normal: "comment-discussion",
  high: "bell",
} as const;

// ─── Single request card ────────────────────────────────────
function UserInputRequestCard({ request }: { request: UserInputRequest }) {
  const keyActionRef = useRef<((key: string) => boolean) | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { pendingAnswer, countdown, submit, undo } = useUndoableSubmit(request.id);
  const { skipUserInput } = useUserInputActions();

  // Animated presence for expand → collapse transition
  const isPending = request.status === "pending" && !pendingAnswer;
  const { mounted, exiting } = useAnimatedPresence(isPending, 200);

  // Auto-scroll into view when card first appears as pending.
  // useLayoutEffect ensures the DOM has been painted before scrolling,
  // removing the need for a setTimeout delay.
  useLayoutEffect(() => {
    if (request.status === "pending") {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [request.status]);

  const handleSkip = useCallback(() => {
    skipUserInput(request.id);
  }, [skipUserInput, request.id]);

  // Global keyboard listener for pending cards.
  // Intentional imperative ref pattern: keyActionRef is set by child input components
  // (ConfirmationInput, SingleChoiceInput, MultiChoiceInput) to expose per-type key
  // handlers without re-subscribing the global listener on every render. The ref is
  // read inside the event handler, so the effect correctly captures the latest callback.
  useEffect(() => {
    if (request.status !== "pending" || pendingAnswer) return;

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape" && !request.required) {
        e.preventDefault();
        handleSkip();
        return;
      }
      if (keyActionRef.current?.(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [request.status, request.required, handleSkip, pendingAnswer]);

  // Ctrl+Z / Cmd+Z during undo grace period (skip if user is in an input field)
  useEffect(() => {
    if (!pendingAnswer) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pendingAnswer, undo]);

  // Already resolved & no undo window → compact badge
  if (request.status !== "pending" && !pendingAnswer) {
    return <CompactResultBadge request={request} />;
  }

  // In undo grace period → undo overlay with countdown bar
  if (pendingAnswer) {
    return (
      <div ref={cardRef}>
        <UndoOverlay
          answer={pendingAnswer.answer}
          countdown={countdown}
          onUndo={undo}
          choices={request.choices}
          responseType={request.response_type}
        />
      </div>
    );
  }

  // Exit animation completed → compact
  if (!mounted && !isPending) {
    return <CompactResultBadge request={request} />;
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "flex flex-col gap-2 px-3 py-2.5 rounded-md border",
        "bg-vsc-surface-2",
        exiting ? "animate-[fade-out_200ms_ease] opacity-0" : "animate-[fade-in_150ms_ease]",
        URGENCY_BORDER[request.urgency],
        URGENCY_GLOW[request.urgency],
      )}
      data-testid={`user-input-card-${request.id}`}
      role="alertdialog"
      aria-modal="false"
      aria-label={request.question}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <Icon
          name={URGENCY_ICON[request.urgency]}
          tokenSize="sm"
          className={cn(
            "mt-0.5 shrink-0",
            request.urgency === "high" ? "text-vsc-warning" : "text-vsc-accent",
          )}
        />
        <div className="flex-1 min-w-0">
          <Text size="sm" weight="medium" tone="primary">
            {request.question}
          </Text>
          {request.description && (
            <Text size="2xs" tone="tertiary" className="mt-0.5">
              {request.description}
            </Text>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {request.urgency === "high" && (
            <Text size="2xs" tone="warning" weight="medium">
              Urgent
            </Text>
          )}
          <WaitingIndicator sinceMs={request.created_at_ms} />
        </div>
      </div>

      {/* Input area — type-specific */}
      <div className="pl-6">
        {request.response_type === "confirmation" && (
          <ConfirmationInput onSubmit={submit} onKeyActionRef={keyActionRef} />
        )}

        {request.response_type === "single_choice" && request.choices && (
          <SingleChoiceInput
            choices={request.choices}
            defaultValue={request.default_value}
            onSubmit={submit}
            onSkip={handleSkip}
            required={request.required}
            onKeyActionRef={keyActionRef}
          />
        )}

        {request.response_type === "multi_choice" && request.choices && (
          <MultiChoiceInput
            choices={request.choices}
            defaultValue={request.default_value}
            onSubmit={submit}
            onSkip={handleSkip}
            required={request.required}
            onKeyActionRef={keyActionRef}
          />
        )}

        {request.response_type === "text" && (
          <TextInputField
            placeholder={request.placeholder}
            defaultValue={request.default_value}
            onSubmit={submit}
            onSkip={handleSkip}
            required={request.required}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main widget: renders all requests for a given turn ─────
export const UserInputCard = React.memo(function UserInputCard({ turnId }: { turnId: TurnId }) {
  const requests = useAtomValue(userInputsByTurnAtomFamily(turnId));

  if (requests.length === 0) return null;

  return (
    <div className="mx-4 my-2 space-y-1.5" data-testid="user-input-card">
      {requests.map((req) => (
        <UserInputRequestCard key={req.id} request={req} />
      ))}
    </div>
  );
});
