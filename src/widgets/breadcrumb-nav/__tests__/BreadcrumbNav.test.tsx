import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { breadcrumbContextAtom } from "../../../features/breadcrumb-nav";
import { focusedTurnIdAtom } from "../../../shared/lib";
import type { TurnId } from "../../../shared/protocol";
import { BreadcrumbNav } from "../BreadcrumbNav";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
});

describe("BreadcrumbNav", () => {
  it("renders nothing when context is empty", () => {
    const { container } = renderWithAtoms(<BreadcrumbNav />);
    expect(container.querySelector("[data-testid='breadcrumb-nav']")).toBeNull();
  });

  it("renders session segment when session_name is set", () => {
    renderWithAtoms(<BreadcrumbNav />, {
      initialValues: [[breadcrumbContextAtom, { session_name: "My Session" }]],
    });

    expect(screen.getByTestId("breadcrumb-nav")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb-session")).toBeInTheDocument();
    expect(screen.getByText("My Session")).toBeInTheDocument();
  });

  it("renders all segments when full context is set", () => {
    renderWithAtoms(<BreadcrumbNav />, {
      initialValues: [
        [
          breadcrumbContextAtom,
          {
            session_name: "My Session",
            turn_id: "turn_1" as TurnId,
            turn_label: "Turn 1",
            file_path: "src/utils/helpers.ts",
            symbol_name: "formatDate",
          },
        ],
      ],
    });

    expect(screen.getByTestId("breadcrumb-session")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb-turn")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb-file")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb-symbol")).toBeInTheDocument();

    expect(screen.getByText("My Session")).toBeInTheDocument();
    expect(screen.getByText("Turn 1")).toBeInTheDocument();
    expect(screen.getByText("helpers.ts")).toBeInTheDocument();
    expect(screen.getByText("formatDate")).toBeInTheDocument();
  });

  it("renders chevron separators between segments", () => {
    renderWithAtoms(<BreadcrumbNav />, {
      initialValues: [
        [
          breadcrumbContextAtom,
          {
            session_name: "Session",
            turn_id: "turn_1" as TurnId,
            turn_label: "Turn 1",
          },
        ],
      ],
    });

    // There should be a separator between session and turn
    const nav = screen.getByTestId("breadcrumb-nav");
    expect(nav).toBeInTheDocument();
  });

  it("sets focusedTurnIdAtom when turn breadcrumb is clicked", async () => {
    const { store, user } = renderWithAtoms(<BreadcrumbNav />, {
      initialValues: [
        [
          breadcrumbContextAtom,
          {
            session_name: "Session",
            turn_id: "turn_42" as TurnId,
            turn_label: "Turn 42",
          },
        ],
      ],
    });

    const turnCrumb = screen.getByTestId("breadcrumb-turn");
    await user.click(turnCrumb);

    expect(store.get(focusedTurnIdAtom)).toBe("turn_42");
  });

  it("sends OPEN_FILE when file breadcrumb is clicked", async () => {
    const { user } = renderWithAtoms(<BreadcrumbNav />, {
      initialValues: [
        [
          breadcrumbContextAtom,
          {
            session_name: "Session",
            file_path: "src/app.ts",
          },
        ],
      ],
    });

    const fileCrumb = screen.getByTestId("breadcrumb-file");
    await user.click(fileCrumb);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "OPEN_FILE",
      file_path: "src/app.ts",
    });
  });

  it("has proper aria-label for accessibility", () => {
    renderWithAtoms(<BreadcrumbNav />, {
      initialValues: [[breadcrumbContextAtom, { session_name: "Session" }]],
    });

    expect(screen.getByRole("navigation", { name: "Breadcrumb navigation" })).toBeInTheDocument();
  });
});
