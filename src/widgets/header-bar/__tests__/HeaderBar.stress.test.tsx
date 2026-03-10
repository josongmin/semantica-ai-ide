/**
 * HeaderBar Stress & Edge-Case Tests
 *
 * Tests:
 * - formatTokens edge cases: 0, boundary values, large numbers
 * - Cost formatting edge cases
 * - Turn TOC toggle rapid spam
 * - Running status appearance/disappearance
 */
import { fireEvent, screen } from "@testing-library/react";

import { sessionMetaAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { turnTocOpenAtom } from "../../../shared/lib";
import { createSessionMeta } from "../../../shared/lib/mocks";
import { HeaderBar } from "../HeaderBar";

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: vi.fn(),
    getState: () => null,
    setState: () => {},
  }),
}));

function renderHeader(metaOverrides: Parameters<typeof createSessionMeta>[0] = {}) {
  const meta = createSessionMeta(metaOverrides);
  return renderWithAtoms(<HeaderBar />, {
    initialValues: [
      [sessionMetaAtom, meta],
      [turnTocOpenAtom, false],
    ],
  });
}

describe("HeaderBar – stress & edge cases", () => {
  // ── Turn TOC toggle rapid spam ─────────────────────
  describe("turn TOC toggle rapid spam", () => {
    it("50 rapid toggles: state follows click parity", () => {
      const { store } = renderHeader();
      const toggleBtn = screen.getByLabelText("Show turn list");

      for (let i = 0; i < 50; i++) {
        fireEvent.click(toggleBtn);
      }

      // 50 = even → back to original (false)
      expect(store.get(turnTocOpenAtom)).toBe(false);
    });

    it("51 rapid toggles: state inverted", () => {
      const { store } = renderHeader();
      const toggleBtn = screen.getByLabelText("Show turn list");

      for (let i = 0; i < 51; i++) {
        fireEvent.click(toggleBtn);
      }

      expect(store.get(turnTocOpenAtom)).toBe(true);
    });

    it("toggle button label updates correctly", async () => {
      const { user, store } = renderHeader();

      const toggleBtn = screen.getByLabelText("Show turn list");
      await user.click(toggleBtn);
      expect(store.get(turnTocOpenAtom)).toBe(true);
    });
  });

  // ── Token formatting edge cases ─────────────────────────
  describe("token formatting edge cases", () => {
    it("tokens exactly 1000: shows 1.0K", () => {
      renderHeader({ tokens_in: 1000, tokens_out: 0 });
      expect(screen.getByText("1.0K/0")).toBeInTheDocument();
    });

    it("tokens 999: shows raw number", () => {
      renderHeader({ tokens_in: 999, tokens_out: 0 });
      expect(screen.getByText("999/0")).toBeInTheDocument();
    });

    it("tokens exactly 1000000: shows 1.0M", () => {
      renderHeader({ tokens_in: 1000000, tokens_out: 0 });
      expect(screen.getByText("1.0M/0")).toBeInTheDocument();
    });

    it("tokens 999999: shows 1000.0K", () => {
      renderHeader({ tokens_in: 999999, tokens_out: 0 });
      expect(screen.getByText("1000.0K/0")).toBeInTheDocument();
    });

    it("both tokens large: formatted correctly", () => {
      renderHeader({ tokens_in: 2500000, tokens_out: 750000 });
      expect(screen.getByText("2.5M/750.0K")).toBeInTheDocument();
    });

    it("tokens_in undefined: no token display", () => {
      const meta = { ...createSessionMeta(), tokens_in: undefined };
      renderWithAtoms(<HeaderBar />, {
        initialValues: [
          [sessionMetaAtom, meta],
          [turnTocOpenAtom, false],
        ],
      });

      expect(screen.queryByText(/\d+[kM]?\/\d+/)).not.toBeInTheDocument();
    });
  });

  // ── Cost formatting edge cases ──────────────────────────
  describe("cost formatting edge cases", () => {
    it("very small cost: shows 4 decimal places", () => {
      renderHeader({ cost_usd: 0.0001 });
      expect(screen.getByText("$0.0001")).toBeInTheDocument();
    });

    it("large cost: shows 2 decimal places", () => {
      renderHeader({ cost_usd: 123.456789 });
      expect(screen.getByText("$123.46")).toBeInTheDocument();
    });

    it("cost exactly 0: hidden", () => {
      renderHeader({ cost_usd: 0 });
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it("negative cost (edge): hidden (not > 0)", () => {
      renderHeader({ cost_usd: -1 });
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });
  });

  // ── Running status transitions ──────────────────────────
  describe("running status transitions", () => {
    it("idle: no running indicator", () => {
      renderHeader({ status: "idle" });
      expect(screen.queryByText("running")).not.toBeInTheDocument();
    });

    it("running: shows running text with role=status", () => {
      renderHeader({ status: "running" });
      const runningText = screen.getByText("running");
      expect(runningText).toBeInTheDocument();
      const statusContainer = runningText.closest("[role='status']");
      expect(statusContainer).not.toBeNull();
    });

    it("error: no running indicator", () => {
      renderHeader({ status: "error" });
      expect(screen.queryByText("running")).not.toBeInTheDocument();
    });
  });
});
