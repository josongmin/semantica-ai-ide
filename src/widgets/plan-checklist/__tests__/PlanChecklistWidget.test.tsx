import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils";
import { planChecklistAtomFamily } from "../../../entities/plan-checklist";
import { createPlanChecklistItem } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import { PlanChecklistWidget } from "../PlanChecklistWidget";

const TURN_ID = "turn_1" as TurnId;

describe("PlanChecklistWidget", () => {
  it("renders nothing when there are no items", () => {
    const { container } = renderWithAtoms(<PlanChecklistWidget turnId={TURN_ID} />);
    expect(container.children).toHaveLength(0);
  });

  it("renders checklist items", () => {
    const items = [
      createPlanChecklistItem({ id: "p1", label: "Step 1", status: "completed" }),
      createPlanChecklistItem({ id: "p2", label: "Step 2", status: "pending" }),
    ];

    renderWithAtoms(<PlanChecklistWidget turnId={TURN_ID} />, {
      initialValues: [[planChecklistAtomFamily(TURN_ID), items]],
    });

    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
  });

  it("shows progress badge with completed/total", () => {
    const items = [
      createPlanChecklistItem({ id: "p1", status: "completed" }),
      createPlanChecklistItem({ id: "p2", status: "pending" }),
      createPlanChecklistItem({ id: "p3", status: "pending" }),
    ];

    renderWithAtoms(<PlanChecklistWidget turnId={TURN_ID} />, {
      initialValues: [[planChecklistAtomFamily(TURN_ID), items]],
    });

    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("shows summary text with done and pending counts", () => {
    const items = [
      createPlanChecklistItem({ id: "p1", status: "completed" }),
      createPlanChecklistItem({ id: "p2", status: "in_progress" }),
      createPlanChecklistItem({ id: "p3", status: "pending" }),
    ];

    renderWithAtoms(<PlanChecklistWidget turnId={TURN_ID} />, {
      initialValues: [[planChecklistAtomFamily(TURN_ID), items]],
    });

    expect(screen.getByText("1 done, 1 active, 1 pending")).toBeInTheDocument();
  });

  it("shows failed count in summary when present", () => {
    const items = [
      createPlanChecklistItem({ id: "p1", status: "completed" }),
      createPlanChecklistItem({ id: "p2", status: "failed" }),
    ];

    renderWithAtoms(<PlanChecklistWidget turnId={TURN_ID} />, {
      initialValues: [[planChecklistAtomFamily(TURN_ID), items]],
    });

    expect(screen.getByText("1 done, 1 failed")).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    const items = [
      createPlanChecklistItem({ id: "p1", status: "completed" }),
      createPlanChecklistItem({ id: "p2", status: "pending" }),
    ];

    const { container } = renderWithAtoms(<PlanChecklistWidget turnId={TURN_ID} />, {
      initialValues: [[planChecklistAtomFamily(TURN_ID), items]],
    });

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("renders items with correct aria labels", () => {
    const items = [
      createPlanChecklistItem({ id: "p1", label: "Write tests", status: "in_progress" }),
    ];

    renderWithAtoms(<PlanChecklistWidget turnId={TURN_ID} />, {
      initialValues: [[planChecklistAtomFamily(TURN_ID), items]],
    });

    expect(screen.getByLabelText("Write tests: in_progress")).toBeInTheDocument();
  });

  it("applies line-through to completed items", () => {
    const items = [createPlanChecklistItem({ id: "p1", label: "Done task", status: "completed" })];

    renderWithAtoms(<PlanChecklistWidget turnId={TURN_ID} />, {
      initialValues: [[planChecklistAtomFamily(TURN_ID), items]],
    });

    const text = screen.getByText("Done task");
    expect(text.className).toContain("line-through");
  });
});
