import { describe, expect, it } from "vitest";
import type { LatencyPacket } from "@semantica/protocol/models";
import {
  coldPackets,
  warmPackets,
  incrementalPackets,
  latencyProfile,
} from "./fixtures/latency-fixtures.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distinctOperations(packets: readonly LatencyPacket[]): Set<string> {
  return new Set(packets.map((p) => p.operation));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LatencyPacket fixtures", () => {
  // --- Cold ---
  describe("cold packets", () => {
    it("kernel/initialize operations have duration_ms > 500ms", () => {
      const initPackets = coldPackets.filter(
        (p) => p.operation === "kernel/initialize",
      );
      expect(initPackets.length).toBeGreaterThan(0);
      for (const pkt of initPackets) {
        expect(pkt.duration_ms).toBeGreaterThan(500);
      }
    });

    it("all cold packets carry metadata (first-run context)", () => {
      for (const pkt of coldPackets) {
        expect(pkt.metadata).toBeDefined();
        expect(typeof pkt.metadata).toBe("object");
      }
    });

    it("has at least 3 distinct operation types", () => {
      expect(distinctOperations(coldPackets).size).toBeGreaterThanOrEqual(3);
    });
  });

  // --- Warm ---
  describe("warm packets", () => {
    it("all operations have duration_ms < 300ms", () => {
      for (const pkt of warmPackets) {
        expect(pkt.duration_ms).toBeLessThan(300);
      }
    });

    it("has at least 3 distinct operation types", () => {
      expect(distinctOperations(warmPackets).size).toBeGreaterThanOrEqual(3);
    });
  });

  // --- Incremental ---
  describe("incremental packets", () => {
    it("all operations have duration_ms < 100ms", () => {
      for (const pkt of incrementalPackets) {
        expect(pkt.duration_ms).toBeLessThan(100);
      }
    });

    it("has at least 3 distinct operation types", () => {
      expect(
        distinctOperations(incrementalPackets).size,
      ).toBeGreaterThanOrEqual(3);
    });
  });

  // --- Structural invariants across all packets ---
  describe("structural invariants", () => {
    const allPackets = [
      ...coldPackets,
      ...warmPackets,
      ...incrementalPackets,
    ];

    it("start_ms < end_ms for every packet", () => {
      for (const pkt of allPackets) {
        expect(pkt.start_ms).toBeLessThan(pkt.end_ms);
      }
    });

    it("duration_ms === end_ms - start_ms for every packet", () => {
      for (const pkt of allPackets) {
        expect(pkt.duration_ms).toBe(pkt.end_ms - pkt.start_ms);
      }
    });
  });

  // --- Profile ---
  describe("LatencyProfile", () => {
    it("packets are sorted by start_ms (chronological)", () => {
      for (let i = 1; i < latencyProfile.packets.length; i++) {
        expect(latencyProfile.packets[i].start_ms).toBeGreaterThanOrEqual(
          latencyProfile.packets[i - 1].start_ms,
        );
      }
    });

    it("summary p50 <= p99 for each phase", () => {
      const { summary } = latencyProfile;
      expect(summary.cold_p50_ms).toBeLessThanOrEqual(summary.cold_p99_ms);
      expect(summary.warm_p50_ms).toBeLessThanOrEqual(summary.warm_p99_ms);
      expect(summary.incremental_p50_ms).toBeLessThanOrEqual(
        summary.incremental_p99_ms,
      );
    });
  });
});
