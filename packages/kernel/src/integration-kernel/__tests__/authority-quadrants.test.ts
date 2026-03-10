/**
 * Authority Quadrant tests (Q1-Q4) for the IntegrationKernel adapters.
 *
 * Each quadrant exercises a distinct state region:
 *   Q1 - bundle 없음 (empty / no-bundle state)
 *   Q2 - authority만 (authority-only path)
 *   Q3 - mismatch (mismatched state)
 *   Q4 - pinned+stale (cached / stale state)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { KernelTransport } from "../factory.js";
import type { QueryIntent } from "../types.js";
import { QueryGatewayImpl } from "../adapters/QueryGatewayImpl.js";
import { EventBridgeImpl } from "../adapters/EventBridgeImpl.js";
import { CapabilityTranslatorImpl } from "../adapters/CapabilityTranslatorImpl.js";
import { ResultNormalizerImpl } from "../adapters/ResultNormalizerImpl.js";
import { LspSessionManagerImpl } from "../adapters/LspSessionManagerImpl.js";

// ── Mock transport ──────────────────────────────────────────

type MockTransport = KernelTransport & {
  handlers: Map<string, Set<(data: unknown) => void>>;
  sent: Array<{ channel: string; data: unknown }>;
};

function createMockTransport(): MockTransport {
  const handlers = new Map<string, Set<(data: unknown) => void>>();
  const sent: Array<{ channel: string; data: unknown }> = [];
  return {
    handlers,
    sent,
    async send(channel: string, data: unknown) {
      sent.push({ channel, data });
    },
    on(channel: string, handler: (data: unknown) => void) {
      let set = handlers.get(channel);
      if (!set) {
        set = new Set();
        handlers.set(channel, set);
      }
      set.add(handler);
      return () => {
        set!.delete(handler);
      };
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────

function makeIntent(
  category: QueryIntent["category"] = "impact",
): QueryIntent {
  return {
    category,
    params: {},
    context: { workspaceId: "ws-1" },
  };
}

function makeDomainEvent(
  domain: string,
  type: string,
  payload: unknown = {},
) {
  return { domain, type, payload, timestamp: Date.now() };
}

// ── Q1: bundle 없음 (empty state) ──────────────────────────

describe("Q1: empty state (no bundle)", () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = createMockTransport();
  });

  it("QueryGateway.getJob throws on unknown job id", async () => {
    const gw = new QueryGatewayImpl(transport);
    await expect(gw.getJob("nonexistent")).rejects.toThrow("Unknown job");
  });

  it("EventBridge.emit without subscribers processes without error", () => {
    const bridge = new EventBridgeImpl();
    expect(() =>
      bridge.emit(makeDomainEvent("build", "started")),
    ).not.toThrow();
  });

  it("CapabilityTranslator.checkCapability asks backend when capabilities are empty", async () => {
    const ct = new CapabilityTranslatorImpl(transport);

    // Start the check (it will wait for the transport response)
    const promise = ct.checkCapability("file.read");

    // Verify it sent the request to the backend
    expect(transport.sent).toContainEqual({
      channel: "policy/checkCapability",
      data: { action: "file.read" },
    });

    // Simulate backend response
    transport.handlers
      .get("policy/checkCapability/result")
      ?.forEach((h) => h({ allowed: true }));

    await expect(promise).resolves.toBe(true);
  });

  it("ResultNormalizer with no registered normalizer returns pass-through envelope", () => {
    const normalizer = new ResultNormalizerImpl();
    const raw = { foo: "bar" };
    const result = normalizer.normalize("impact", raw) as {
      category: string;
      timestamp: number;
      data: unknown;
    };

    expect(result.category).toBe("impact");
    expect(result.data).toBe(raw);
    expect(typeof result.timestamp).toBe("number");
  });
});

// ── Q2: authority만 (authority-only path) ───────────────────

describe("Q2: authority-only path", () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = createMockTransport();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("evaluatePolicy returns allow for low-risk after timeout", async () => {
    const ct = new CapabilityTranslatorImpl(transport);

    const promise = ct.evaluatePolicy({
      action: "file.read",
      resource: "/src/main.ts",
      riskLevel: "low",
    });

    // No backend response -- advance past the 5s timeout
    await vi.advanceTimersByTimeAsync(5000);

    const result = await promise;
    expect(result.outcome).toBe("allow");
    expect(result.approvalRequired).toBe(false);
  });

  it("evaluatePolicy returns require_approval for high-risk after timeout", async () => {
    const ct = new CapabilityTranslatorImpl(transport);

    const promise = ct.evaluatePolicy({
      action: "file.delete",
      resource: "/etc/passwd",
      riskLevel: "high",
    });

    // No backend response -- advance past the 5s timeout
    await vi.advanceTimersByTimeAsync(5000);

    const result = await promise;
    expect(result.outcome).toBe("require_approval");
    expect(result.approvalRequired).toBe(true);
    expect(result.reason).toContain("approval");
  });

  it("EventBridge domain subscription receives only its domain events", () => {
    const bridge = new EventBridgeImpl();
    const buildEvents: unknown[] = [];
    const testEvents: unknown[] = [];

    bridge.subscribe("build", (e) => buildEvents.push(e));
    bridge.subscribe("test", (e) => testEvents.push(e));

    bridge.emit(makeDomainEvent("build", "started"));
    bridge.emit(makeDomainEvent("test", "passed"));
    bridge.emit(makeDomainEvent("build", "completed"));

    expect(buildEvents).toHaveLength(2);
    expect(testEvents).toHaveLength(1);
    expect((buildEvents[0] as { type: string }).type).toBe("started");
    expect((buildEvents[1] as { type: string }).type).toBe("completed");
    expect((testEvents[0] as { type: string }).type).toBe("passed");
  });

  it("QueryGateway.query creates job and tracks it", async () => {
    const gw = new QueryGatewayImpl(transport);
    const job = await gw.query(makeIntent("callGraph"));

    expect(job.id).toMatch(/^qj-/);
    expect(job.status).toBe("running");
    expect(job.progress).toBe(0);

    // Verify job is tracked (getJob does not throw)
    const retrieved = await gw.getJob(job.id);
    expect(retrieved).toEqual(job);

    // Verify transport was called
    expect(transport.sent).toContainEqual(
      expect.objectContaining({
        channel: "query/execute",
        data: expect.objectContaining({ jobId: job.id }),
      }),
    );
  });
});

// ── Q3: mismatch (mismatched state) ─────────────────────────

describe("Q3: mismatch state", () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = createMockTransport();
  });

  it("QueryGateway.cancel on non-existent job throws", async () => {
    const gw = new QueryGatewayImpl(transport);
    await expect(gw.cancel("ghost-job")).rejects.toThrow("Unknown job");
  });

  it("QueryGateway.cancel on already-completed job is a no-op", async () => {
    const gw = new QueryGatewayImpl(transport);
    const job = await gw.query(makeIntent());

    // Simulate backend marking the job as completed
    transport.handlers
      .get("query/job/update")
      ?.forEach((h) =>
        h({ id: job.id, status: "completed", result: { nodes: [] } }),
      );

    // Cancel on completed job should not throw and should not send cancel
    const sentBefore = transport.sent.length;
    await gw.cancel(job.id);

    // No additional transport call should have been made
    expect(transport.sent.length).toBe(sentBefore);

    // Job should still be completed
    const current = await gw.getJob(job.id);
    expect(current.status).toBe("completed");
  });

  it("EventBridge.emit with invalid event (missing domain) throws TypeError", () => {
    const bridge = new EventBridgeImpl();
    expect(() => bridge.emit({ type: "foo", timestamp: 1 })).toThrow(
      TypeError,
    );
  });

  it("EventBridge.emit with invalid event (missing type) throws TypeError", () => {
    const bridge = new EventBridgeImpl();
    expect(() => bridge.emit({ domain: "d", timestamp: 1 })).toThrow(
      TypeError,
    );
  });

  it("EventBridge.emit with invalid event (missing timestamp) throws TypeError", () => {
    const bridge = new EventBridgeImpl();
    expect(() => bridge.emit({ domain: "d", type: "t" })).toThrow(TypeError);
  });

  it("LspSessionManager.changeDocument on unopened document throws", async () => {
    const lsp = new LspSessionManagerImpl(transport);
    await expect(
      lsp.changeDocument("file:///foo.ts", { text: "x" }),
    ).rejects.toThrow("Document not open");
  });
});

// ── Q4: pinned+stale (cached / stale state) ────────────────

describe("Q4: cached / stale state", () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = createMockTransport();
  });

  it("CapabilityTranslator uses cached capabilities after initial load", async () => {
    const ct = new CapabilityTranslatorImpl(transport);

    // Simulate backend pushing capabilities
    transport.handlers
      .get("policy/capabilities")
      ?.forEach((h) => h(["file.read", "file.write"]));

    // checkCapability should resolve from cache without sending transport call
    const sentBefore = transport.sent.length;
    const allowed = await ct.checkCapability("file.read");

    expect(allowed).toBe(true);
    // No new send calls
    expect(transport.sent.length).toBe(sentBefore);

    // Capability not in the cached set should return false
    const denied = await ct.checkCapability("file.delete");
    expect(denied).toBe(false);
    expect(transport.sent.length).toBe(sentBefore);
  });

  it("CapabilityTranslator verdict cache returns cached value without transport call", async () => {
    const ct = new CapabilityTranslatorImpl(transport);

    // Simulate a verdict arriving via transport
    transport.handlers
      .get("policy/verdict")
      ?.forEach((h) =>
        h({ patchId: "patch-42", result: { status: "approved" } }),
      );

    // getVerdict should return cached result without sending to transport
    const sentBefore = transport.sent.length;
    const verdict = await ct.getVerdict("patch-42");

    expect(verdict).toEqual({ status: "approved" });
    expect(transport.sent.length).toBe(sentBefore);
  });

  it("EventBridge.getSnapshot returns latest emitted event for domain", () => {
    const bridge = new EventBridgeImpl();

    bridge.emit(makeDomainEvent("deploy", "started", { v: 1 }));
    bridge.emit(makeDomainEvent("deploy", "progressed", { v: 2 }));

    const snapshot = bridge.getSnapshot("deploy") as {
      domain: string;
      type: string;
      payload: { v: number };
    };

    expect(snapshot.domain).toBe("deploy");
    expect(snapshot.type).toBe("progressed");
    expect(snapshot.payload).toEqual({ v: 2 });
  });

  it("EventBridge.getSnapshot returns undefined for unknown domain", () => {
    const bridge = new EventBridgeImpl();
    expect(bridge.getSnapshot("unknown")).toBeUndefined();
  });

  it("QueryGateway job update from transport updates existing job state", async () => {
    const gw = new QueryGatewayImpl(transport);
    const job = await gw.query(makeIntent("metrics"));

    // Simulate progress update
    transport.handlers
      .get("query/job/update")
      ?.forEach((h) => h({ id: job.id, status: "running", progress: 50 }));

    const updated = await gw.getJob(job.id);
    expect(updated.status).toBe("running");
    expect(updated.progress).toBe(50);

    // Simulate completion
    transport.handlers
      .get("query/job/update")
      ?.forEach((h) =>
        h({
          id: job.id,
          status: "completed",
          progress: 100,
          result: { summary: "done" },
        }),
      );

    const completed = await gw.getJob(job.id);
    expect(completed.status).toBe("completed");
    expect(completed.progress).toBe(100);
    expect(completed.result).toEqual({ summary: "done" });
  });
});
