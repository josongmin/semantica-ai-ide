import { categoryIcons, categoryLabels } from "~entities/tool-call";

import type { ToolCategory } from "../../../shared/protocol";
const ALL_CATEGORIES: ToolCategory[] = [
  "read",
  "search",
  "write",
  "delete",
  "terminal",
  "git",
  "analysis",
  "other",
];

describe("categoryIcons", () => {
  it("has an icon for every ToolCategory", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(categoryIcons[cat]).toEqual(expect.any(String));
    }
  });

  it("has no extra keys beyond ToolCategory", () => {
    expect(Object.keys(categoryIcons).sort()).toEqual([...ALL_CATEGORIES].sort());
  });

  it.each(ALL_CATEGORIES)("icon for '%s' is non-empty", (cat) => {
    expect(categoryIcons[cat].length).toBeGreaterThan(0);
  });
});

describe("categoryLabels", () => {
  it("has a label for every ToolCategory", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(categoryLabels[cat]).toEqual(expect.any(String));
    }
  });

  it("has no extra keys beyond ToolCategory", () => {
    expect(Object.keys(categoryLabels).sort()).toEqual([...ALL_CATEGORIES].sort());
  });

  it.each(ALL_CATEGORIES)("label for '%s' is non-empty", (cat) => {
    expect(categoryLabels[cat].length).toBeGreaterThan(0);
  });

  it("labels are human-readable (not kebab/snake case)", () => {
    for (const label of Object.values(categoryLabels)) {
      // First character should be uppercase
      expect(label[0]).toBe(label[0]?.toUpperCase());
    }
  });
});
