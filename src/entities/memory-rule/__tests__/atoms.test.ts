import { createStore } from "jotai";

import type { MemoryRule, MemoryRuleId } from "../../../shared/protocol";
import {
  deleteMemoryRuleAtom,
  memoryRuleAtomFamily,
  memoryRuleIdsAtom,
  memoryRulesAtom,
  memoryRulesMapAtom,
  pinMemoryRuleAtom,
  pinnedMemoryRulesAtom,
  removeMemoryRuleAtom,
  reorderMemoryRulesAtom,
  resetMemoryRuleStoreAtom,
  rulesCountAtom,
  upsertMemoryRuleAtom,
} from "../model/atoms";

function createMemoryRule(overrides: Partial<MemoryRule> = {}): MemoryRule {
  return {
    id: "rule_1" as MemoryRuleId,
    title: "Test Rule",
    content: "Always use TypeScript strict mode.",
    ...overrides,
  };
}

describe("upsertMemoryRuleAtom", () => {
  it("adds a new rule to the map and derived lists", () => {
    const store = createStore();
    const rule = createMemoryRule({ id: "rule_1" as MemoryRuleId });

    store.set(upsertMemoryRuleAtom, rule);

    expect(store.get(memoryRuleIdsAtom)).toEqual(["rule_1"]);
    expect(store.get(memoryRulesMapAtom).get("rule_1" as MemoryRuleId)).toEqual(rule);
    expect(store.get(memoryRuleAtomFamily("rule_1"))).toEqual(rule);
  });

  it("updates an existing rule without duplicating in index", () => {
    const store = createStore();
    const rule1 = createMemoryRule({ id: "rule_1" as MemoryRuleId, title: "Original" });
    const rule1Updated = createMemoryRule({ id: "rule_1" as MemoryRuleId, title: "Updated" });

    store.set(upsertMemoryRuleAtom, rule1);
    store.set(upsertMemoryRuleAtom, rule1Updated);

    expect(store.get(memoryRuleIdsAtom)).toEqual(["rule_1"]);
    expect(store.get(memoryRuleAtomFamily("rule_1"))?.title).toBe("Updated");
  });

  it("multiple rules: preserves insertion order", () => {
    const store = createStore();

    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_1" as MemoryRuleId }));
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_2" as MemoryRuleId }));
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_3" as MemoryRuleId }));

    expect(store.get(memoryRuleIdsAtom)).toEqual(["rule_1", "rule_2", "rule_3"]);
  });

  it("memoryRulesAtom returns all rules as an array", () => {
    const store = createStore();

    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_1" as MemoryRuleId }));
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_2" as MemoryRuleId }));

    const rules = store.get(memoryRulesAtom);
    expect(rules).toHaveLength(2);
    expect(rules.map((r) => r.id)).toEqual(["rule_1", "rule_2"]);
  });
});

describe("removeMemoryRuleAtom", () => {
  it("removes rule from the map", () => {
    const store = createStore();
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_1" as MemoryRuleId }));
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_2" as MemoryRuleId }));

    store.set(removeMemoryRuleAtom, "rule_1" as MemoryRuleId);

    expect(store.get(memoryRuleIdsAtom)).toEqual(["rule_2"]);
    expect(store.get(memoryRulesMapAtom).has("rule_1" as MemoryRuleId)).toBe(false);
  });

  it("no-op when removing a non-existent ID", () => {
    const store = createStore();

    expect(() => {
      store.set(removeMemoryRuleAtom, "nonexistent" as MemoryRuleId);
    }).not.toThrow();
    expect(store.get(memoryRuleIdsAtom)).toEqual([]);
  });
});

describe("deleteMemoryRuleAtom (legacy alias)", () => {
  it("is the same atom reference as removeMemoryRuleAtom", () => {
    expect(deleteMemoryRuleAtom).toBe(removeMemoryRuleAtom);
  });

  it("removes rule from the map", () => {
    const store = createStore();
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_1" as MemoryRuleId }));

    store.set(deleteMemoryRuleAtom, "rule_1" as MemoryRuleId);

    expect(store.get(memoryRuleIdsAtom)).toEqual([]);
  });
});

describe("pinMemoryRuleAtom", () => {
  it("sets pinned flag on an existing rule", () => {
    const store = createStore();
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_1" as MemoryRuleId }));

    store.set(pinMemoryRuleAtom, { id: "rule_1" as MemoryRuleId, pinned: true });

    expect(store.get(memoryRulesMapAtom).get("rule_1" as MemoryRuleId)?.pinned).toBe(true);
  });

  it("no-op when rule does not exist", () => {
    const store = createStore();

    expect(() => {
      store.set(pinMemoryRuleAtom, { id: "nonexistent" as MemoryRuleId, pinned: true });
    }).not.toThrow();
  });
});

describe("pinnedMemoryRulesAtom", () => {
  it("returns only pinned rules", () => {
    const store = createStore();
    store.set(
      upsertMemoryRuleAtom,
      createMemoryRule({ id: "rule_1" as MemoryRuleId, pinned: true }),
    );
    store.set(
      upsertMemoryRuleAtom,
      createMemoryRule({ id: "rule_2" as MemoryRuleId, pinned: false }),
    );
    store.set(
      upsertMemoryRuleAtom,
      createMemoryRule({ id: "rule_3" as MemoryRuleId, pinned: true }),
    );

    const pinned = store.get(pinnedMemoryRulesAtom);
    expect(pinned).toHaveLength(2);
    expect(pinned.map((r) => r.id)).toEqual(["rule_1", "rule_3"]);
  });

  it("returns empty when no rules are pinned", () => {
    const store = createStore();
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_1" as MemoryRuleId }));

    expect(store.get(pinnedMemoryRulesAtom)).toEqual([]);
  });
});

describe("rulesCountAtom", () => {
  it("tracks total count", () => {
    const store = createStore();
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_1" as MemoryRuleId }));
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_2" as MemoryRuleId }));

    const count = store.get(rulesCountAtom);
    expect(count.total).toBe(2);
  });

  it("returns zero when store is empty", () => {
    const store = createStore();
    const count = store.get(rulesCountAtom);
    expect(count.total).toBe(0);
  });
});

describe("reorderMemoryRulesAtom", () => {
  it("reorders rules according to provided ID order", () => {
    const store = createStore();
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_1" as MemoryRuleId }));
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_2" as MemoryRuleId }));
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_3" as MemoryRuleId }));

    store.set(reorderMemoryRulesAtom, ["rule_3", "rule_1", "rule_2"]);

    expect(store.get(memoryRuleIdsAtom)).toEqual(["rule_3", "rule_1", "rule_2"]);
  });

  it("drops IDs that do not exist in the map", () => {
    const store = createStore();
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_1" as MemoryRuleId }));

    store.set(reorderMemoryRulesAtom, ["rule_1", "nonexistent"]);

    expect(store.get(memoryRuleIdsAtom)).toEqual(["rule_1"]);
  });
});

describe("resetMemoryRuleStoreAtom", () => {
  it("clears all rules", () => {
    const store = createStore();
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_1" as MemoryRuleId }));
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule_2" as MemoryRuleId }));

    store.set(resetMemoryRuleStoreAtom);

    expect(store.get(memoryRuleIdsAtom)).toEqual([]);
    expect(store.get(memoryRulesMapAtom).size).toBe(0);
    expect(store.get(memoryRulesAtom)).toEqual([]);
  });
});

describe("memoryRuleAtomFamily", () => {
  it("returns the rule for a given ID", () => {
    const store = createStore();
    const rule = createMemoryRule({ id: "rule_1" as MemoryRuleId, title: "My Rule" });
    store.set(upsertMemoryRuleAtom, rule);

    expect(store.get(memoryRuleAtomFamily("rule_1"))).toEqual(rule);
  });

  it("returns null for a non-existent ID", () => {
    const store = createStore();

    expect(store.get(memoryRuleAtomFamily("nonexistent"))).toBeNull();
  });
});
