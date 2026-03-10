import "@testing-library/jest-dom/vitest";

import { resetIdCounter } from "../src/shared/lib/mocks/factories";

// Reset factory ID counter between tests for isolation
afterEach(() => {
  resetIdCounter();
});

/**
 * Mock @tanstack/react-virtual for happy-dom / jsdom environments.
 *
 * In headless test environments elements have zero dimensions, so the real
 * virtualizer renders nothing. This mock renders ALL items (pass-through)
 * while preserving the virtualizer API surface so component code compiles.
 */
vi.mock("@tanstack/react-virtual", () => {
  type VirtualItem = {
    index: number;
    key: number;
    start: number;
    end: number;
    size: number;
    lane: number;
  };

  function useVirtualizer(opts: { count: number; estimateSize: () => number }) {
    const estimateSize = opts.estimateSize();
    const items: VirtualItem[] = Array.from({ length: opts.count }, (_, i) => ({
      index: i,
      key: i,
      start: i * estimateSize,
      end: (i + 1) * estimateSize,
      size: estimateSize,
      lane: 0,
    }));

    return {
      getVirtualItems: () => items,
      getTotalSize: () => opts.count * estimateSize,
      scrollToIndex: vi.fn(),
      scrollToOffset: vi.fn(),
      measureElement: vi.fn(),
      measure: vi.fn(),
      options: opts,
    };
  }

  return { useVirtualizer };
});

/**
 * Global test environment setup.
 *
 * Provides browser API stubs that happy-dom doesn't fully support,
 * keeping individual test files free of repetitive mock boilerplate.
 */

// ── IntersectionObserver (used by MessageList auto-scroll) ──
if (typeof IntersectionObserver === "undefined") {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin = "0px";
    readonly thresholds: readonly number[] = [0];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

// ── ResizeObserver (used by auto-growing textareas, scroll containers) ──
if (typeof ResizeObserver === "undefined") {
  class MockResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
}

// ── window.matchMedia (used by prefers-reduced-motion checks) ──
if (typeof window.matchMedia !== "function") {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  );
}
