import { screen } from "@testing-library/react";
import { createStore } from "jotai";

import { renderWithAtoms } from "../../../../tests/utils";
import { dispatchServerEvent } from "../../../app/event-dispatch";
import { memoryRulesMapAtom, pinnedMemoryRulesAtom } from "../../../entities/memory-rule";
import type { MemoryRule, MemoryRuleId } from "../../../shared/protocol";
import { PinnedMemoryStrip } from "../PinnedMemoryStrip";
function createMemoryRule(overrides: Partial<MemoryRule> = {}): MemoryRule {
  return {
    id: "rule_1" as MemoryRuleId,
    title: "Test Rule",
    content: "Test content for the rule",
    pinned: false,
    ...overrides,
  };
}

function buildRulesMap(rules: MemoryRule[]): ReadonlyMap<MemoryRuleId, MemoryRule> {
  return new Map(rules.map((r) => [r.id, r]));
}

describe("PinnedMemoryStrip", () => {
  it("renders nothing when no pinned rules exist", () => {
    const { container } = renderWithAtoms(<PinnedMemoryStrip />, {
      initialValues: [[memoryRulesMapAtom, new Map()]],
    });
    expect(container.querySelector("[role='list']")).toBeNull();
  });

  it("renders nothing when rules exist but none are pinned", () => {
    const rules = [createMemoryRule({ pinned: false })];
    const { container } = renderWithAtoms(<PinnedMemoryStrip />, {
      initialValues: [[memoryRulesMapAtom, buildRulesMap(rules)]],
    });
    expect(container.querySelector("[role='list']")).toBeNull();
  });

  it("renders pinned rules as chips", () => {
    const rules = [
      createMemoryRule({
        id: "rule_1" as MemoryRuleId,
        title: "Always use TypeScript",
        pinned: true,
      }),
      createMemoryRule({ id: "rule_2" as MemoryRuleId, title: "Prefer const", pinned: true }),
      createMemoryRule({ id: "rule_3" as MemoryRuleId, title: "Not pinned", pinned: false }),
    ];

    renderWithAtoms(<PinnedMemoryStrip />, {
      initialValues: [[memoryRulesMapAtom, buildRulesMap(rules)]],
    });

    expect(screen.getByRole("list", { name: "Pinned memory rules" })).toBeInTheDocument();
    expect(screen.getByText("Always use TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Prefer const")).toBeInTheDocument();
    expect(screen.queryByText("Not pinned")).not.toBeInTheDocument();
  });

  it("unpin button removes rule from strip", async () => {
    const rules = [
      createMemoryRule({ id: "rule_1" as MemoryRuleId, title: "Pinned Rule", pinned: true }),
    ];

    const { user, store } = renderWithAtoms(<PinnedMemoryStrip />, {
      initialValues: [[memoryRulesMapAtom, buildRulesMap(rules)]],
    });

    expect(screen.getByText("Pinned Rule")).toBeInTheDocument();

    const unpinBtn = screen.getByLabelText("Unpin: Pinned Rule");
    await user.click(unpinBtn);

    // After unpinning, the pinned list should be empty
    const pinned = store.get(pinnedMemoryRulesAtom);
    expect(pinned).toHaveLength(0);
  });

  it("multiple pinned rules show correct count of chips", () => {
    const rules = Array.from({ length: 5 }, (_, i) =>
      createMemoryRule({
        id: `rule_${i}` as MemoryRuleId,
        title: `Rule ${i}`,
        pinned: true,
      }),
    );

    renderWithAtoms(<PinnedMemoryStrip />, {
      initialValues: [[memoryRulesMapAtom, buildRulesMap(rules)]],
    });

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
  });
});

describe("Memory Pin – atom integration", () => {
  it("PIN_MEMORY_RULE serverEvent toggles pinned state", () => {
    const store = createStore();
    const dispatch = (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);

    // Upsert a rule
    dispatch({
      t: "UPSERT_MEMORY_RULE",
      rule: createMemoryRule({ id: "rule_1" as MemoryRuleId, title: "My rule", pinned: false }),
    });

    expect(store.get(pinnedMemoryRulesAtom)).toHaveLength(0);

    // Pin it
    dispatch({ t: "PIN_MEMORY_RULE", id: "rule_1" as MemoryRuleId, pinned: true });
    expect(store.get(pinnedMemoryRulesAtom)).toHaveLength(1);
    expect(store.get(pinnedMemoryRulesAtom)[0]?.title).toBe("My rule");

    // Unpin it
    dispatch({ t: "PIN_MEMORY_RULE", id: "rule_1" as MemoryRuleId, pinned: false });
    expect(store.get(pinnedMemoryRulesAtom)).toHaveLength(0);
  });

  it("UPSERT_MEMORY_RULE with pinned: true appears immediately", () => {
    const store = createStore();
    const dispatch = (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);

    dispatch({
      t: "UPSERT_MEMORY_RULE",
      rule: createMemoryRule({
        id: "rule_1" as MemoryRuleId,
        title: "Already pinned",
        pinned: true,
      }),
    });

    expect(store.get(pinnedMemoryRulesAtom)).toHaveLength(1);
  });

  it("REMOVE_MEMORY_RULE removes from pinned list", () => {
    const store = createStore();
    const dispatch = (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);

    dispatch({
      t: "UPSERT_MEMORY_RULE",
      rule: createMemoryRule({ id: "rule_1" as MemoryRuleId, pinned: true }),
    });
    expect(store.get(pinnedMemoryRulesAtom)).toHaveLength(1);

    dispatch({ t: "REMOVE_MEMORY_RULE", id: "rule_1" as MemoryRuleId });
    expect(store.get(pinnedMemoryRulesAtom)).toHaveLength(0);
  });
});
