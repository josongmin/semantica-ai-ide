import {
  animDuration,
  duration,
  easing,
  fontSize,
  statusBg,
  statusBgSubtle,
  statusColor,
  zIndex,
} from "../tokens";

describe("tokens", () => {
  describe("fontSize", () => {
    it("has keys: 3xs, 2xs, xs, sm, base, md, lg", () => {
      expect(Object.keys(fontSize)).toEqual(
        expect.arrayContaining(["3xs", "2xs", "xs", "sm", "base", "md", "lg"]),
      );
      expect(Object.keys(fontSize)).toHaveLength(7);
    });

    it("maps each key to a text-* class string", () => {
      expect(fontSize["3xs"]).toBe("text-2xs");
      expect(fontSize["2xs"]).toBe("text-2xs");
      expect(fontSize.xs).toBe("text-xs");
      expect(fontSize.sm).toBe("text-sm");
      expect(fontSize.base).toBe("text-base");
      expect(fontSize.md).toBe("text-md");
      expect(fontSize.lg).toBe("text-lg");
    });
  });

  describe("duration", () => {
    it("has keys: instant, fast, normal, slow, glacial", () => {
      expect(Object.keys(duration)).toEqual(
        expect.arrayContaining(["instant", "fast", "normal", "slow", "glacial"]),
      );
      expect(Object.keys(duration)).toHaveLength(5);
    });

    it("maps each key to a duration-* class string", () => {
      expect(duration.instant).toBe("duration-instant");
      expect(duration.fast).toBe("duration-fast");
      expect(duration.normal).toBe("duration-normal");
      expect(duration.slow).toBe("duration-slow");
      expect(duration.glacial).toBe("duration-glacial");
    });
  });

  describe("zIndex", () => {
    it("has keys: base, sticky, overlay, modal, tooltip, toast", () => {
      expect(Object.keys(zIndex)).toEqual(
        expect.arrayContaining(["base", "sticky", "overlay", "modal", "tooltip", "toast"]),
      );
      expect(Object.keys(zIndex)).toHaveLength(6);
    });

    it("maps each key to a z-index class referencing CSS variables", () => {
      expect(zIndex.base).toContain("z-");
      expect(zIndex.sticky).toContain("z-");
      expect(zIndex.overlay).toContain("z-");
      expect(zIndex.modal).toContain("z-");
      expect(zIndex.tooltip).toContain("z-");
      expect(zIndex.toast).toContain("z-");
    });
  });

  describe("statusColor", () => {
    it("maps statuses to text-vsc-* format strings", () => {
      for (const value of Object.values(statusColor)) {
        expect(value).toMatch(/^text-vsc-/);
      }
    });

    it("includes success, warning, error, info", () => {
      expect(statusColor.success).toBe("text-vsc-success");
      expect(statusColor.warning).toBe("text-vsc-warning");
      expect(statusColor.error).toBe("text-vsc-error");
      expect(statusColor.info).toBe("text-vsc-info");
    });
  });

  describe("statusBg", () => {
    it("maps statuses to bg-vsc-* format strings", () => {
      for (const value of Object.values(statusBg)) {
        expect(value).toMatch(/^bg-vsc-/);
      }
    });

    it("includes success, warning, error, info", () => {
      expect(statusBg.success).toBe("bg-vsc-success");
      expect(statusBg.warning).toBe("bg-vsc-warning");
      expect(statusBg.error).toBe("bg-vsc-error");
      expect(statusBg.info).toBe("bg-vsc-info");
    });
  });

  describe("statusBgSubtle", () => {
    it("maps statuses to bg-vsc-*/10 format strings", () => {
      for (const value of Object.values(statusBgSubtle)) {
        expect(value).toMatch(/^bg-vsc-.*\/10$/);
      }
    });

    it("includes success, warning, error, info", () => {
      expect(statusBgSubtle.success).toBe("bg-vsc-success/10");
      expect(statusBgSubtle.warning).toBe("bg-vsc-warning/10");
      expect(statusBgSubtle.error).toBe("bg-vsc-error/10");
      expect(statusBgSubtle.info).toBe("bg-vsc-info/10");
    });
  });

  describe("animDuration", () => {
    it("maps each key to a CSS variable reference", () => {
      for (const value of Object.values(animDuration)) {
        expect(value).toMatch(/^var\(--duration-/);
      }
    });

    it("has all 5 duration levels", () => {
      expect(Object.keys(animDuration)).toHaveLength(5);
    });
  });

  describe("easing", () => {
    it("maps each key to a CSS variable reference", () => {
      expect(easing.default).toBe("var(--ease-default)");
      expect(easing.spring).toBe("var(--ease-spring)");
    });
  });
});
