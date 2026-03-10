import { BUILT_IN_COMMANDS, CATEGORY_META } from "../model/registry";

describe("BUILT_IN_COMMANDS", () => {
  it("all commands have unique IDs", () => {
    const ids = BUILT_IN_COMMANDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all commands have unique labels", () => {
    const labels = BUILT_IN_COMMANDS.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("all commands have non-empty required fields", () => {
    for (const cmd of BUILT_IN_COMMANDS) {
      expect(cmd.id).toBeTruthy();
      expect(cmd.name).toBeTruthy();
      expect(cmd.label).toBeTruthy();
      expect(cmd.description).toBeTruthy();
      expect(cmd.icon).toBeTruthy();
      expect(cmd.category).toBeTruthy();
      expect(cmd.action).toBeTruthy();
    }
  });

  it("all command names start with /", () => {
    for (const cmd of BUILT_IN_COMMANDS) {
      expect(cmd.name.startsWith("/")).toBe(true);
    }
  });

  it("all categories used in commands exist in CATEGORY_META", () => {
    const usedCategories = new Set(BUILT_IN_COMMANDS.map((c) => c.category));
    for (const cat of usedCategories) {
      expect(CATEGORY_META[cat]).toBeDefined();
    }
  });
});

describe("CATEGORY_META", () => {
  it("all categories have unique order values", () => {
    const orders = Object.values(CATEGORY_META).map((m) => m.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("all categories have non-empty labels", () => {
    for (const meta of Object.values(CATEGORY_META)) {
      expect(meta.label).toBeTruthy();
    }
  });
});
