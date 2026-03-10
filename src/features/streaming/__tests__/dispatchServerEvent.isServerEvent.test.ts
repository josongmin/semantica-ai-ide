import { createPromptTemplate, createTeamConfig } from "../../../shared/lib/mocks";
import { isServerEvent } from "../../../shared/protocol";

describe("isServerEvent validation for new serverEvent types", () => {
  // ─── SET_EXPORT_PROGRESS ──────────────────────────────────

  describe("SET_EXPORT_PROGRESS", () => {
    it("validates a valid SET_EXPORT_PROGRESS serverEvent", () => {
      expect(isServerEvent({ t: "SET_EXPORT_PROGRESS", progress: "exporting" })).toBe(true);
    });

    it("validates SET_EXPORT_PROGRESS with error_message", () => {
      expect(
        isServerEvent({ t: "SET_EXPORT_PROGRESS", progress: "error", error_message: "Failed" }),
      ).toBe(true);
    });

    it("rejects SET_EXPORT_PROGRESS with missing progress", () => {
      expect(isServerEvent({ t: "SET_EXPORT_PROGRESS" })).toBe(false);
    });

    it("rejects SET_EXPORT_PROGRESS with non-string progress", () => {
      expect(isServerEvent({ t: "SET_EXPORT_PROGRESS", progress: 42 })).toBe(false);
    });
  });

  // ─── SET_TEAM_CONFIG ──────────────────────────────────────

  describe("SET_TEAM_CONFIG", () => {
    it("validates a valid SET_TEAM_CONFIG serverEvent", () => {
      expect(
        isServerEvent({
          t: "SET_TEAM_CONFIG",
          items: [createTeamConfig()],
        }),
      ).toBe(true);
    });

    it("validates SET_TEAM_CONFIG with empty items", () => {
      expect(isServerEvent({ t: "SET_TEAM_CONFIG", items: [] })).toBe(true);
    });

    it("rejects SET_TEAM_CONFIG with missing items", () => {
      expect(isServerEvent({ t: "SET_TEAM_CONFIG" })).toBe(false);
    });

    it("rejects SET_TEAM_CONFIG with non-array items", () => {
      expect(isServerEvent({ t: "SET_TEAM_CONFIG", items: "not-array" })).toBe(false);
    });
  });

  // ─── SET_PROMPT_TEMPLATES ──────────────────────────────────

  describe("SET_PROMPT_TEMPLATES", () => {
    it("validates a valid SET_PROMPT_TEMPLATES serverEvent", () => {
      expect(
        isServerEvent({
          t: "SET_PROMPT_TEMPLATES",
          templates: [createPromptTemplate()],
        }),
      ).toBe(true);
    });

    it("validates SET_PROMPT_TEMPLATES with empty templates", () => {
      expect(isServerEvent({ t: "SET_PROMPT_TEMPLATES", templates: [] })).toBe(true);
    });

    it("rejects SET_PROMPT_TEMPLATES with missing templates", () => {
      expect(isServerEvent({ t: "SET_PROMPT_TEMPLATES" })).toBe(false);
    });

    it("rejects SET_PROMPT_TEMPLATES with non-array templates", () => {
      expect(isServerEvent({ t: "SET_PROMPT_TEMPLATES", templates: {} })).toBe(false);
    });
  });
});
