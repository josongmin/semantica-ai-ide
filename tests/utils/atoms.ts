import { type Atom,createStore } from "jotai";

import {
  messageAtomFamily,
  messageOrderAtom,
  turnAtomFamily,
  turnOrderAtom,
} from "~entities/message";
import {
  createMessage,
  createTurn,
  createTurnPhase,
  resetIdCounter,
} from "../../src/shared/lib/mocks";
import type { MessageId, Turn, TurnId, UiMessage } from "../../src/shared/protocol";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAtom = Atom<any>;
type InitialValue = [AnyAtom, unknown];

/** Create an isolated Jotai store with optional initial values */
export function createTestStore(initialValues?: InitialValue[]) {
  const store = createStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialValues?.forEach(([atom, value]) => store.set(atom as any, value));
  return store;
}

/** Seed N messages into the store, returns the created messages */
export function seedMessages(
  store: ReturnType<typeof createStore>,
  count: number,
  overrides: Partial<UiMessage> = {},
): UiMessage[] {
  const messages: UiMessage[] = [];
  for (let i = 0; i < count; i++) {
    const msg = createMessage({ text: `Message ${i}`, ...overrides });
    store.set(messageAtomFamily(msg.id), msg);
    messages.push(msg);
  }
  store.set(
    messageOrderAtom,
    messages.map((m) => m.id),
  );
  return messages;
}

/** Seed a turn with its user message into the store */
export function seedTurn(
  store: ReturnType<typeof createStore>,
  overrides: Partial<Turn> = {},
): { turn: Turn; userMessage: UiMessage } {
  const userMessage = createMessage({ role: "user", text: "Hello agent" });
  store.set(messageAtomFamily(userMessage.id), userMessage);
  store.set(messageOrderAtom, (prev: readonly MessageId[]) => [...prev, userMessage.id]);

  const turn = createTurn({
    phases: [
      createTurnPhase({
        phase: "user_message",
        message_ids: [userMessage.id],
        collapsed: false,
        status: "success",
      }),
      createTurnPhase({ phase: "thinking", status: "pending" }),
    ],
    ...overrides,
  });
  store.set(turnAtomFamily(turn.id), turn);
  store.set(turnOrderAtom, (prev: readonly TurnId[]) => [...prev, turn.id]);

  return { turn, userMessage };
}

export { resetIdCounter };
