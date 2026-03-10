import { screen } from "@testing-library/react";

import { turnAtomFamily } from "~entities/message/turns";

import { renderWithAtoms } from "../../../../tests/utils";
import { formatCost, formatTokens } from "../../../shared/lib/formatters";
import { createTurn, resetIdCounter } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import { TurnMetrics } from "../TurnMetrics";

beforeEach(() => resetIdCounter());

describe("TurnMetrics", () => {
  const TURN_ID = "turn_1" as TurnId;

  it("renders nothing when no metrics are present", () => {
    const turn = createTurn({ id: TURN_ID });

    const { container } = renderWithAtoms(<TurnMetrics turnId={TURN_ID} />, {
      initialValues: [[turnAtomFamily(TURN_ID), turn]],
    });

    expect(container.querySelector("[data-testid='turn-metrics']")).toBeNull();
  });

  it("renders nothing when turn does not exist", () => {
    const { container } = renderWithAtoms(<TurnMetrics turnId={TURN_ID} />);

    expect(container.querySelector("[data-testid='turn-metrics']")).toBeNull();
  });

  it("renders TTFT in milliseconds when < 1000ms", () => {
    const turn = createTurn({ id: TURN_ID, ttft_ms: 450 });

    renderWithAtoms(<TurnMetrics turnId={TURN_ID} />, {
      initialValues: [[turnAtomFamily(TURN_ID), turn]],
    });

    expect(screen.getByTestId("ttft-value")).toHaveTextContent("450ms");
  });

  it("renders TTFT in seconds when >= 1000ms", () => {
    const turn = createTurn({ id: TURN_ID, ttft_ms: 1500 });

    renderWithAtoms(<TurnMetrics turnId={TURN_ID} />, {
      initialValues: [[turnAtomFamily(TURN_ID), turn]],
    });

    expect(screen.getByTestId("ttft-value")).toHaveTextContent("1.5s");
  });

  it("applies warning color class when TTFT > 2000ms", () => {
    const turn = createTurn({ id: TURN_ID, ttft_ms: 3000 });

    renderWithAtoms(<TurnMetrics turnId={TURN_ID} />, {
      initialValues: [[turnAtomFamily(TURN_ID), turn]],
    });

    const ttftEl = screen.getByTestId("ttft-value");
    expect(ttftEl).toHaveClass("text-vsc-warning");
  });

  it("does not apply warning class when TTFT <= 2000ms", () => {
    const turn = createTurn({ id: TURN_ID, ttft_ms: 800 });

    renderWithAtoms(<TurnMetrics turnId={TURN_ID} />, {
      initialValues: [[turnAtomFamily(TURN_ID), turn]],
    });

    const ttftEl = screen.getByTestId("ttft-value");
    expect(ttftEl).not.toHaveClass("text-vsc-warning");
  });

  it("renders latency in milliseconds", () => {
    const turn = createTurn({ id: TURN_ID, ttft_ms: 200, latency_ms: 750 });

    renderWithAtoms(<TurnMetrics turnId={TURN_ID} />, {
      initialValues: [[turnAtomFamily(TURN_ID), turn]],
    });

    expect(screen.getByTestId("latency-value")).toHaveTextContent("750ms");
  });

  it("renders latency in seconds when >= 1000ms", () => {
    const turn = createTurn({ id: TURN_ID, ttft_ms: 200, latency_ms: 4500 });

    renderWithAtoms(<TurnMetrics turnId={TURN_ID} />, {
      initialValues: [[turnAtomFamily(TURN_ID), turn]],
    });

    expect(screen.getByTestId("latency-value")).toHaveTextContent("4.5s");
  });

  it("renders token usage with total count", () => {
    const turn = createTurn({
      id: TURN_ID,
      token_usage: { input_tokens: 1200, output_tokens: 800 },
    });

    renderWithAtoms(<TurnMetrics turnId={TURN_ID} />, {
      initialValues: [[turnAtomFamily(TURN_ID), turn]],
    });

    expect(screen.getByTestId("token-value")).toHaveTextContent("2.0K");
  });

  it("renders estimated cost", () => {
    const turn = createTurn({
      id: TURN_ID,
      token_usage: { input_tokens: 500, output_tokens: 500 },
      estimated_cost_usd: 0.025,
    });

    renderWithAtoms(<TurnMetrics turnId={TURN_ID} />, {
      initialValues: [[turnAtomFamily(TURN_ID), turn]],
    });

    expect(screen.getByTestId("cost-value")).toHaveTextContent("$0.03");
  });

  it("renders all metrics together", () => {
    const turn = createTurn({
      id: TURN_ID,
      ttft_ms: 320,
      latency_ms: 2100,
      token_usage: { input_tokens: 10000, output_tokens: 5000 },
      estimated_cost_usd: 0.15,
    });

    renderWithAtoms(<TurnMetrics turnId={TURN_ID} />, {
      initialValues: [[turnAtomFamily(TURN_ID), turn]],
    });

    expect(screen.getByTestId("ttft-value")).toHaveTextContent("320ms");
    expect(screen.getByTestId("latency-value")).toHaveTextContent("2.1s");
    expect(screen.getByTestId("token-value")).toHaveTextContent("15.0K");
    expect(screen.getByTestId("cost-value")).toHaveTextContent("$0.15");
  });
});

describe("formatTokens", () => {
  it("returns raw number for < 1000", () => {
    expect(formatTokens(500)).toBe("500");
  });

  it("formats thousands with K suffix", () => {
    expect(formatTokens(1500)).toBe("1.5K");
    expect(formatTokens(10000)).toBe("10.0K");
  });

  it("formats millions with M suffix", () => {
    expect(formatTokens(1_500_000)).toBe("1.5M");
    expect(formatTokens(2_000_000)).toBe("2.0M");
  });

  it("handles zero", () => {
    expect(formatTokens(0)).toBe("0");
  });
});

describe("formatCost", () => {
  it("formats small costs with appropriate precision", () => {
    expect(formatCost(0.005)).toBe("$0.005");
    expect(formatCost(0.001)).toBe("$0.001");
    expect(formatCost(0.0001)).toBe("$0.0001");
  });

  it("formats regular costs with 2 decimal places", () => {
    expect(formatCost(0.025)).toBe("$0.03");
    expect(formatCost(0.15)).toBe("$0.15");
    expect(formatCost(1.234)).toBe("$1.23");
  });

  it("handles zero cost", () => {
    expect(formatCost(0)).toBe("$0.00");
  });
});
