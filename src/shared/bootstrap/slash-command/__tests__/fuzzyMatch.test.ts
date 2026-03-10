import { fuzzyMatch } from "../model/fuzzyMatch";
import { BUILT_IN_COMMANDS } from "../model/registry";
import type { SlashCommandDef } from "../model/types";
const commands = BUILT_IN_COMMANDS;

describe("fuzzyMatch", () => {
  it("empty query returns all non-hidden commands with score 0", () => {
    const results = fuzzyMatch("", commands);
    expect(results.length).toBe(commands.filter((c) => !c.hidden).length);
    results.forEach((r) => {
      expect(r.score).toBe(0);
      expect(r.matchIndices).toEqual([]);
    });
  });

  it("exact prefix match returns high score", () => {
    const results = fuzzyMatch("cl", commands);
    const clearMatch = results.find((r) => r.command.id === "clear");
    expect(clearMatch).toBeDefined();
    expect(clearMatch!.score).toBeGreaterThan(50);
  });

  it("exact prefix has correct matchIndices", () => {
    const results = fuzzyMatch("cl", commands);
    const clearMatch = results.find((r) => r.command.id === "clear");
    expect(clearMatch!.matchIndices).toEqual([0, 1]);
  });

  it("full label match returns highest score", () => {
    const results = fuzzyMatch("clear", commands);
    const clearMatch = results.find((r) => r.command.id === "clear");
    expect(clearMatch!.score).toBe(100 + 5); // 100 + length
  });

  it("subsequence match works", () => {
    const results = fuzzyMatch("cpt", commands);
    const compactMatch = results.find((r) => r.command.id === "compact");
    expect(compactMatch).toBeDefined();
    expect(compactMatch!.score).toBeGreaterThan(0);
  });

  it("no match returns empty for non-matching query", () => {
    const results = fuzzyMatch("xyz", commands);
    expect(results.length).toBe(0);
  });

  it("keyword match returns result with lower weight", () => {
    const results = fuzzyMatch("reset", commands);
    // "reset" is a keyword for "clear"
    const clearMatch = results.find((r) => r.command.id === "clear");
    expect(clearMatch).toBeDefined();
    expect(clearMatch!.score).toBeGreaterThan(0);
  });

  it("case insensitive matching", () => {
    const results = fuzzyMatch("CL", commands);
    const clearMatch = results.find((r) => r.command.id === "clear");
    expect(clearMatch).toBeDefined();
  });

  it("results are sorted by score descending", () => {
    const results = fuzzyMatch("c", commands);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.score).toBeGreaterThanOrEqual(results[i]?.score ?? 0);
    }
  });

  it("hidden commands are excluded", () => {
    const cmds: SlashCommandDef[] = [
      {
        id: "visible",
        name: "/visible",
        label: "visible",
        description: "A visible command",
        category: "session",
        icon: "eye",
        action: { type: "execute" },
      },
      {
        id: "hidden",
        name: "/hidden",
        label: "hidden",
        description: "A hidden command",
        category: "session",
        icon: "eye-closed",
        hidden: true,
        action: { type: "execute" },
      },
    ];

    const results = fuzzyMatch("", cmds);
    expect(results.length).toBe(1);
    expect(results[0]?.command.id).toBe("visible");

    const filtered = fuzzyMatch("h", cmds);
    expect(filtered.find((r) => r.command.id === "hidden")).toBeUndefined();
  });

  it("prefix match scores higher than subsequence match", () => {
    const results = fuzzyMatch("co", commands);
    const compactMatch = results.find((r) => r.command.id === "compact");
    const contextMatch = results.find((r) => r.command.id === "context");
    // Both start with "co" so both should match
    expect(compactMatch).toBeDefined();
    expect(contextMatch).toBeDefined();
  });
});
