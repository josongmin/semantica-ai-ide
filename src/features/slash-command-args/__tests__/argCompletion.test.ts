import { renderHook } from "@testing-library/react";

import { getCommandArgs } from "../model/argRegistry";
import { useArgCompletion } from "../model/useArgCompletion";
describe("getCommandArgs", () => {
  it("returns args for model command", () => {
    const result = getCommandArgs("model");
    expect(result).not.toBeNull();
    expect(result!.args[0]?.name).toBe("model_id");
    expect(result!.args[0]?.suggestions).toContain("claude-opus-4-6");
  });

  it("returns args for export command", () => {
    const result = getCommandArgs("export");
    expect(result).not.toBeNull();
    expect(result!.args[0]?.suggestions).toContain("markdown");
    expect(result!.args[0]?.suggestions).toContain("json");
  });

  it("returns null for command without args", () => {
    expect(getCommandArgs("clear")).toBeNull();
    expect(getCommandArgs("help")).toBeNull();
  });

  it("returns args for compact command", () => {
    const result = getCommandArgs("compact");
    expect(result).not.toBeNull();
    expect(result!.args[0]?.name).toBe("instruction");
  });
});

describe("useArgCompletion", () => {
  it("returns no args for null commandId", () => {
    const { result } = renderHook(() => useArgCompletion(null, ""));
    expect(result.current.hasArgs).toBe(false);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.currentArg).toBeNull();
  });

  it("returns no args for command without definitions", () => {
    const { result } = renderHook(() => useArgCompletion("clear", ""));
    expect(result.current.hasArgs).toBe(false);
  });

  it("returns all suggestions for empty query", () => {
    const { result } = renderHook(() => useArgCompletion("model", ""));
    expect(result.current.hasArgs).toBe(true);
    expect(result.current.suggestions.length).toBe(3);
    expect(result.current.currentArg?.name).toBe("model_id");
  });

  it("filters suggestions by query", () => {
    const { result } = renderHook(() => useArgCompletion("model", "opus"));
    expect(result.current.suggestions.length).toBe(1);
    expect(result.current.suggestions[0]?.value).toBe("claude-opus-4-6");
  });

  it("filters are case-insensitive", () => {
    const { result } = renderHook(() => useArgCompletion("model", "SONNET"));
    expect(result.current.suggestions.length).toBe(1);
    expect(result.current.suggestions[0]?.value).toBe("claude-sonnet-4-6");
  });

  it("returns empty suggestions when no match", () => {
    const { result } = renderHook(() => useArgCompletion("model", "gpt"));
    expect(result.current.suggestions).toEqual([]);
  });

  it("returns export format suggestions", () => {
    const { result } = renderHook(() => useArgCompletion("export", "mark"));
    expect(result.current.suggestions.length).toBe(1);
    expect(result.current.suggestions[0]?.value).toBe("markdown");
  });

  it("compact returns no static suggestions", () => {
    const { result } = renderHook(() => useArgCompletion("compact", ""));
    expect(result.current.hasArgs).toBe(true);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.currentArg?.placeholder).toBe("focus on...");
  });
});
