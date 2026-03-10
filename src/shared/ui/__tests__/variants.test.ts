import { cn, disabledStyles, focusRing, interactiveBase } from "../variants";

describe("variants", () => {
  describe("cn()", () => {
    it('merges two class names: cn("a", "b") -> "a b"', () => {
      expect(cn("a", "b")).toBe("a b");
    });

    it("filters out falsy values", () => {
      const condition = false as boolean;
      expect(cn("a", condition && "b", "c")).toBe("a c");
    });

    it('strips undefined and null: cn(undefined, null, "a") -> "a"', () => {
      expect(cn(undefined, null, "a")).toBe("a");
    });

    it('returns empty string for no args: cn() -> ""', () => {
      expect(cn()).toBe("");
    });

    it("handles arrays of class names", () => {
      expect(cn(["a", "b"], "c")).toBe("a b c");
    });

    it("handles deeply nested values", () => {
      const condition = false as boolean;
      expect(cn("a", [condition && "b", "c"])).toBe("a c");
    });
  });

  describe("focusRing", () => {
    it('equals "focus-ring"', () => {
      expect(focusRing).toBe("focus-ring");
    });
  });

  describe("interactiveBase", () => {
    it('contains "cursor-pointer"', () => {
      expect(interactiveBase).toContain("cursor-pointer");
    });

    it("contains transition-colors", () => {
      expect(interactiveBase).toContain("transition-colors");
    });

    it("contains duration-fast", () => {
      expect(interactiveBase).toContain("duration-fast");
    });
  });

  describe("disabledStyles", () => {
    it('contains "disabled:opacity-50"', () => {
      expect(disabledStyles).toContain("disabled:opacity-50");
    });

    it('contains "disabled:cursor-not-allowed"', () => {
      expect(disabledStyles).toContain("disabled:cursor-not-allowed");
    });
  });
});
