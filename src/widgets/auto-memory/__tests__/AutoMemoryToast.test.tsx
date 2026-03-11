import { screen } from "@testing-library/react";
import { createStore } from "jotai";

import { renderWithAtoms } from "../../../../tests/utils";
import { dispatchServerEvent } from "../../../app/event-dispatch";
import { memoryRulesAtom } from "../../../entities/memory-rule";
import {
  autoMemorySuggestionsAtom,
  autoMemorySuggestionsFamily,
} from "../../../features/auto-memory";
import type { AutoMemorySuggestion, TurnId } from "../../../shared/protocol";
import { AutoMemoryToast } from "../AutoMemoryToast";

const TURN_ID = "turn_1" as TurnId;

function createSuggestion(overrides: Partial<AutoMemorySuggestion> = {}): AutoMemorySuggestion {
  return {
    id: "sug_1",
    title: "Use readonly arrays",
    content: "Always use readonly arrays for immutability",
    confidence: 0.85,
    source_turn_id: TURN_ID,
    ...overrides,
  };
}

describe("AutoMemoryToast", () => {
  it("renders nothing when no suggestions exist", () => {
    const { container } = renderWithAtoms(<AutoMemoryToast turnId={TURN_ID} />, {
      initialValues: [[autoMemorySuggestionsFamily(TURN_ID), []]],
    });
    expect(container.querySelector("[role='alert']")).toBeNull();
  });

  it("renders nothing for suggestions belonging to other turns", () => {
    const otherTurn = "turn_other" as TurnId;
    const suggestion = createSuggestion({ source_turn_id: otherTurn });
    const { container } = renderWithAtoms(<AutoMemoryToast turnId={TURN_ID} />, {
      // Suggestion lives in the other turn's atom — TURN_ID's atom is empty
      initialValues: [[autoMemorySuggestionsFamily(otherTurn), [suggestion]]],
    });
    expect(container.querySelector("[role='alert']")).toBeNull();
  });

  it("renders suggestion card for matching turn", () => {
    const suggestion = createSuggestion();
    renderWithAtoms(<AutoMemoryToast turnId={TURN_ID} />, {
      initialValues: [[autoMemorySuggestionsFamily(TURN_ID), [suggestion]]],
    });

    expect(screen.getByText("Remember this?")).toBeInTheDocument();
    expect(screen.getByText(/Use readonly arrays/)).toBeInTheDocument();
    expect(screen.getByLabelText("Accept suggestion: Use readonly arrays")).toBeInTheDocument();
    expect(screen.getByLabelText("Dismiss suggestion: Use readonly arrays")).toBeInTheDocument();
  });

  it("confidence is reflected in opacity style", () => {
    const suggestion = createSuggestion({ confidence: 0.5 });
    renderWithAtoms(<AutoMemoryToast turnId={TURN_ID} />, {
      initialValues: [[autoMemorySuggestionsFamily(TURN_ID), [suggestion]]],
    });

    const toast = screen.getByTestId("auto-memory-toast-sug_1");
    // opacity = 0.6 + 0.5 * 0.4 = 0.8
    expect(toast.style.opacity).toBe("0.8");
  });

  it("confidence bar reflects percentage", () => {
    const suggestion = createSuggestion({ confidence: 0.75 });
    renderWithAtoms(<AutoMemoryToast turnId={TURN_ID} />, {
      initialValues: [[autoMemorySuggestionsFamily(TURN_ID), [suggestion]]],
    });

    const bar = screen.getByLabelText("Confidence: 75%");
    expect(bar.style.width).toBe("75%");
  });

  it("dismiss removes suggestion from list", async () => {
    const suggestion = createSuggestion();
    const { user, store } = renderWithAtoms(<AutoMemoryToast turnId={TURN_ID} />, {
      initialValues: [[autoMemorySuggestionsFamily(TURN_ID), [suggestion]]],
    });

    await user.click(screen.getByLabelText("Dismiss suggestion: Use readonly arrays"));

    expect(store.get(autoMemorySuggestionsFamily(TURN_ID))).toHaveLength(0);
  });

  it("accept creates memory rule and removes suggestion", async () => {
    const suggestion = createSuggestion({ id: "sug_42" });
    const { user, store } = renderWithAtoms(<AutoMemoryToast turnId={TURN_ID} />, {
      initialValues: [[autoMemorySuggestionsFamily(TURN_ID), [suggestion]]],
    });

    await user.click(screen.getByLabelText("Accept suggestion: Use readonly arrays"));

    // Suggestion should be removed
    expect(store.get(autoMemorySuggestionsFamily(TURN_ID))).toHaveLength(0);
    // Memory rule should be created
    const rules = store.get(memoryRulesAtom);
    expect(rules).toHaveLength(1);
    expect(rules[0]?.title).toBe("Use readonly arrays");
    expect(rules[0]?.content).toBe("Always use readonly arrays for immutability");
  });

  it("renders multiple suggestions for the same turn", () => {
    const suggestions = [
      createSuggestion({ id: "sug_1", title: "Rule A" }),
      createSuggestion({ id: "sug_2", title: "Rule B" }),
    ];
    renderWithAtoms(<AutoMemoryToast turnId={TURN_ID} />, {
      initialValues: [[autoMemorySuggestionsFamily(TURN_ID), suggestions]],
    });

    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.getByText(/Rule A/)).toBeInTheDocument();
    expect(screen.getByText(/Rule B/)).toBeInTheDocument();
  });
});

describe("Auto-Memory – serverEvent dispatch integration", () => {
  it("SUGGEST_AUTO_MEMORY adds suggestion to store", () => {
    const store = createStore();
    const dispatch = (serverEvent: Parameters<typeof dispatchServerEvent>[1]) =>
      dispatchServerEvent(store, serverEvent);

    const suggestion = createSuggestion();
    dispatch({ t: "SUGGEST_AUTO_MEMORY", suggestion });

    const perTurn = store.get(autoMemorySuggestionsFamily(TURN_ID));
    expect(perTurn).toHaveLength(1);
    expect(perTurn[0]?.title).toBe("Use readonly arrays");
  });

  it("SUGGEST_AUTO_MEMORY deduplicates by id", () => {
    const store = createStore();
    const dispatch = (serverEvent: Parameters<typeof dispatchServerEvent>[1]) =>
      dispatchServerEvent(store, serverEvent);

    const suggestion = createSuggestion({ id: "sug_dup" });
    dispatch({ t: "SUGGEST_AUTO_MEMORY", suggestion });
    dispatch({ t: "SUGGEST_AUTO_MEMORY", suggestion });

    expect(store.get(autoMemorySuggestionsFamily(TURN_ID))).toHaveLength(1);
  });

  it("DISMISS_AUTO_MEMORY removes suggestion from per-turn store", () => {
    const store = createStore();
    const dispatch = (serverEvent: Parameters<typeof dispatchServerEvent>[1]) =>
      dispatchServerEvent(store, serverEvent);

    // Seed via SUGGEST_AUTO_MEMORY (per-turn path)
    dispatch({ t: "SUGGEST_AUTO_MEMORY", suggestion: createSuggestion({ id: "sug_1" }) });
    dispatch({
      t: "SUGGEST_AUTO_MEMORY",
      suggestion: createSuggestion({ id: "sug_2", title: "Other" }),
    });
    expect(store.get(autoMemorySuggestionsFamily(TURN_ID))).toHaveLength(2);

    dispatch({ t: "DISMISS_AUTO_MEMORY", id: "sug_1", turn_id: TURN_ID } as any);
    expect(store.get(autoMemorySuggestionsFamily(TURN_ID))).toHaveLength(1);
    const remaining = store.get(autoMemorySuggestionsFamily(TURN_ID));
    expect(remaining[0]?.id).toBe("sug_2");
  });

  it("RESET_STORES clears auto-memory suggestions", () => {
    const store = createStore();
    const dispatch = (serverEvent: Parameters<typeof dispatchServerEvent>[1]) =>
      dispatchServerEvent(store, serverEvent);

    /* eslint-disable @typescript-eslint/no-deprecated -- testing RESET_STORES with legacy atom for migration coverage */
    store.set(autoMemorySuggestionsAtom, [createSuggestion()]);
    expect(store.get(autoMemorySuggestionsAtom)).toHaveLength(1);

    dispatch({ t: "RESET_STORES" });
    expect(store.get(autoMemorySuggestionsAtom)).toHaveLength(0);
    /* eslint-enable @typescript-eslint/no-deprecated */
  });
});
