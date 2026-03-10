import { describe, it, expect } from "vitest";
import {
  isNotComputed,
  notComputed,
  normalizeError,
  ERROR_REASON_MAP,
  type ComputationPhase,
  type NotComputedReason,
  type NotComputedResult,
} from "@semantica/protocol/models";

describe("NotComputed normalization", () => {
  // ── isNotComputed type guard ──────────────────────────────────────

  describe("isNotComputed", () => {
    it("returns true for a valid NotComputedResult", () => {
      const result: NotComputedResult = {
        computed: false,
        reason: "internal_error",
        phase: "transport",
        timestamp: Date.now(),
      };
      expect(isNotComputed(result)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isNotComputed(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isNotComputed(undefined)).toBe(false);
    });

    it("returns false for empty object", () => {
      expect(isNotComputed({})).toBe(false);
    });

    it("returns false for { computed: true }", () => {
      expect(isNotComputed({ computed: true })).toBe(false);
    });
  });

  // ── notComputed factory ───────────────────────────────────────────

  describe("notComputed factory", () => {
    it("creates correct structure with all fields", () => {
      const result = notComputed(
        "parse_error",
        "parse",
        "Unexpected token",
        "SyntaxError at line 42",
      );

      expect(result.computed).toBe(false);
      expect(result.reason).toBe("parse_error");
      expect(result.phase).toBe("parse");
      expect(result.message).toBe("Unexpected token");
      expect(result.cause).toBe("SyntaxError at line 42");
    });

    it("includes a timestamp that is a number > 0", () => {
      const result = notComputed("internal_error", "transport");
      expect(typeof result.timestamp).toBe("number");
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it("accepts all ComputationPhase values", () => {
      const phases: ComputationPhase[] = [
        "parse",
        "resolve",
        "analyze",
        "transform",
        "transport",
        "policy",
        "timeout",
        "cancelled",
      ];

      for (const phase of phases) {
        const result = notComputed("internal_error", phase);
        expect(result.phase).toBe(phase);
        expect(isNotComputed(result)).toBe(true);
      }
    });

    it("accepts all NotComputedReason values", () => {
      const reasons: NotComputedReason[] = [
        "source_unavailable",
        "parse_error",
        "unresolved_symbol",
        "cyclic_dependency",
        "analysis_budget_exceeded",
        "transport_error",
        "policy_denied",
        "stale_cache",
        "not_indexed",
        "unsupported_language",
        "cancelled_by_user",
        "cancelled_by_system",
        "internal_error",
      ];

      for (const reason of reasons) {
        const result = notComputed(reason, "transport");
        expect(result.reason).toBe(reason);
        expect(isNotComputed(result)).toBe(true);
      }
    });
  });

  // ── normalizeError ────────────────────────────────────────────────

  describe("normalizeError", () => {
    it('maps "ENOENT: no such file" to source_unavailable', () => {
      const result = normalizeError("ENOENT: no such file");
      expect(result.reason).toBe("source_unavailable");
    });

    it('maps "ECONNREFUSED" to transport_error', () => {
      const result = normalizeError("ECONNREFUSED");
      expect(result.reason).toBe("transport_error");
    });

    it('maps "SyntaxError: Unexpected token" to parse_error', () => {
      const result = normalizeError("SyntaxError: Unexpected token");
      expect(result.reason).toBe("parse_error");
    });

    it('maps "AbortError" to cancelled_by_user', () => {
      const result = normalizeError("AbortError");
      expect(result.reason).toBe("cancelled_by_user");
    });

    it('maps unknown error to internal_error', () => {
      const result = normalizeError("some unknown error");
      expect(result.reason).toBe("internal_error");
    });

    it("uses the provided phase parameter", () => {
      const result = normalizeError("ENOENT: missing", "parse");
      expect(result.phase).toBe("parse");
    });

    it('defaults phase to "transport" when not provided', () => {
      const result = normalizeError("some error");
      expect(result.phase).toBe("transport");
    });

    it("result timestamp is a number > 0", () => {
      const result = normalizeError("any error");
      expect(typeof result.timestamp).toBe("number");
      expect(result.timestamp).toBeGreaterThan(0);
    });
  });

  // ── ERROR_REASON_MAP ──────────────────────────────────────────────

  describe("ERROR_REASON_MAP", () => {
    it("covers all expected error patterns", () => {
      const expectedPatterns = [
        "ENOENT",
        "ENOTFOUND",
        "ECONNREFUSED",
        "ETIMEDOUT",
        "SyntaxError",
        "ReferenceError",
        "EPERM",
        "EACCES",
        "AbortError",
      ];

      for (const pattern of expectedPatterns) {
        expect(ERROR_REASON_MAP.has(pattern)).toBe(true);
      }

      expect(ERROR_REASON_MAP.size).toBe(expectedPatterns.length);
    });
  });
});
