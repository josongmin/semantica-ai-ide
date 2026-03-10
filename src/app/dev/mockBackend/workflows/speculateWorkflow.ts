import {
  abortableSleep,
  type AgentPersona,
  emitSummary,
  emitThinking,
  emitTurnStart,
  finalizeTurn,
  type HandlerContext,
  type MessageId,
  nextId,
  postServerEvent,
  postServerEvents,
  type TurnId,
} from "./types";

export async function runSpeculateWorkflow(
  text: string,
  turnId: TurnId,
  userMsgId: MessageId,
  ctx: HandlerContext,
  persona: AgentPersona,
  signal: AbortSignal,
) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(
    turnId,
    `${persona.name} here. Analyzing your patterns and predicting what changes you'll need next...`,
    "Predicting edits...",
    signal,
    800,
  );

  // Speculative edits
  postServerEvent({
    t: "SET_SPECULATIVE_EDITS",
    turn_id: "turn_1" as TurnId,
    state: { edits: [], status: "predicting" },
  });
  await abortableSleep(1200, signal);

  const specState = {
    edits: [
      {
        id: "spec-1",
        file_path: "src/utils/helpers.ts",
        original_text: "function getData() {",
        proposed_text: "async function getData(): Promise<Data> {",
        line_start: 12,
        line_end: 12,
        confidence: 0.92,
        risk_level: "safe" as const,
        status: "pending" as const,
      },
      {
        id: "spec-2",
        file_path: "src/app/config.ts",
        original_text: "const timeout = 5000;",
        proposed_text: "const TIMEOUT_MS = 10_000;",
        line_start: 7,
        line_end: 7,
        confidence: 0.78,
        risk_level: "safe" as const,
        status: "pending" as const,
      },
      {
        id: "spec-3",
        file_path: "src/components/Button.tsx",
        original_text: "export default function Button",
        proposed_text: "export const Button = React.memo(function Button",
        line_start: 5,
        line_end: 5,
        confidence: 0.65,
        risk_level: "moderate" as const,
        status: "pending" as const,
      },
    ],
    status: "ready" as const,
    model_id: "claude-sonnet-4-6",
  };
  ctx.sotaState.specEdits = specState;
  postServerEvent({ t: "SET_SPECULATIVE_EDITS", turn_id: "turn_1" as TurnId, state: specState });

  await emitSummary(
    turnId,
    `## Predicted Edits\n\n**3 edits predicted** based on your coding patterns:\n\n| File | Change | Confidence |\n|------|--------|:----------:|\n| \`helpers.ts:12\` | Add async + return type | 92% |\n| \`config.ts:7\` | Named constant + larger timeout | 78% |\n| \`Button.tsx:5\` | Wrap with React.memo | 65% |\n\nAccept or reject each edit individually. High-confidence edits are likely what you need. The Button.tsx memo suggestion is moderate-confidence — review carefully.`,
    signal,
    1200,
  );

  postServerEvents([
    {
      t: "PUSH_PROMPT_SUGGESTION",
      suggestion: { id: nextId("sug"), text: "Accept all high-confidence edits", confidence: 0.85 },
    },
  ]);

  finalizeTurn(turnId, ctx);
}
