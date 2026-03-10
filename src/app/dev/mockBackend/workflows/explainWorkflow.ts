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

export async function runExplainWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(
    turnId,
    `${persona.name} here. Let me think about the best way to explain this with clear examples and analogies...`,
    "Preparing explanation...",
    signal,
    1000,
  );

  // Quote context
  postServerEvent({
    t: "SET_QUOTE_CONTEXT",
    message_id: userMsgId,
    quoted_text: text.slice(0, 100),
  });

  // Wiki pages generated from explanation
  postServerEvent({
    t: "SET_WIKI_PAGES",
    pages: [
      { id: "wiki-1", title: "Message Pipeline Architecture", content: "The message pipeline routes user input through classification, tool execution, and response generation stages.", updated_at_ms: Date.now(), source_turn_id: turnId },
      { id: "wiki-2", title: "Intent Classification", content: "Keyword-based (naive) or ML-based (production) classification of user messages into actionable intents.", updated_at_ms: Date.now(), parent_id: "wiki-1", source_turn_id: turnId },
      { id: "wiki-3", title: "Tool Execution Sandbox", content: "Tools run in an isolated sandbox with permission gates. Each tool call is tracked and auditable.", updated_at_ms: Date.now(), parent_id: "wiki-1", source_turn_id: turnId },
    ],
  });

  // NOP heartbeat
  postServerEvent({ t: "NOP" });

  await emitSummary(
    turnId,
    `## Explanation\n\nGreat question! Think of it like a **postal system**:\n\n### The Core Concept\nWhen you send a message, it goes through several stages — just like a letter:\n1. **Writing** (your input) → composing the letter\n2. **Sorting** (classification) → the post office routes it\n3. **Delivery** (execution) → the carrier brings it to the right door\n4. **Confirmation** (response) → you get a receipt\n\n### In Code Terms\n\`\`\`\nUser Input → Intent Classification → Tool Execution → Response Generation\n\`\`\`\n\nEach stage has **guards** that prevent bad data from flowing through — like address validation at the post office.\n\n### Key Insight\nThe beauty of this architecture is that each stage is **independent**. You can swap out the sorting algorithm without changing how letters are written or delivered. This is the **Single Responsibility Principle** in action.\n\n### Want to Go Deeper?\n- The classification layer uses keyword matching (naive) or ML models (production)\n- Tool execution is sandboxed for safety\n- Response generation streams character-by-character for UX\n\nLet me know if you'd like me to dive into any specific part!`,
    signal,
    2000,
  );

  postServerEvents([
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Explain the classification layer in detail", confidence: 0.8 } },
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Show me the tool execution flow", confidence: 0.7 } },
  ]);

  finalizeTurn(turnId, ctx);
}
