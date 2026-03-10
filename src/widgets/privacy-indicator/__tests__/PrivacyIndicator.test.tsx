import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { setPrivacyStateAtom } from "../../../features/privacy-mode";
import type * as SharedLib from "../../../shared/lib";
import { createPrivacyState, resetIdCounter } from "../../../shared/lib/mocks";
import { PrivacyIndicator } from "../PrivacyIndicator";

// Mock overlay hooks so Popover content is mounted when open
vi.mock("../../../shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof SharedLib>();
  return {
    ...actual,
    useOverlayBehavior: ({ open }: { open: boolean }) => ({
      mounted: open,
      exiting: false,
      isTop: true,
      handleTabKeyDown: vi.fn(),
    }),
  };
});

beforeEach(() => {
  resetIdCounter();
});

describe("PrivacyIndicator", () => {
  it("renders nothing when no privacy state is set", () => {
    const { container } = renderWithAtoms(<PrivacyIndicator />);
    expect(container.querySelector("[data-testid='privacy-indicator-button']")).toBeNull();
  });

  it("renders lock icon when privacy state is set", () => {
    const { store } = renderWithAtoms(<PrivacyIndicator />);

    act(() => {
      store.set(setPrivacyStateAtom, createPrivacyState({ mode: "local" }));
    });

    expect(screen.getByTestId("privacy-indicator-button")).toBeInTheDocument();
  });

  it("shows correct aria label for local mode", () => {
    const { store } = renderWithAtoms(<PrivacyIndicator />);

    act(() => {
      store.set(setPrivacyStateAtom, createPrivacyState({ mode: "local" }));
    });

    expect(screen.getByLabelText("Privacy: Local Only")).toBeInTheDocument();
  });

  it("shows correct aria label for shared mode", () => {
    const { store } = renderWithAtoms(<PrivacyIndicator />);

    act(() => {
      store.set(setPrivacyStateAtom, createPrivacyState({ mode: "shared" }));
    });

    expect(screen.getByLabelText("Privacy: Shared")).toBeInTheDocument();
  });

  it("shows correct aria label for stored mode", () => {
    const { store } = renderWithAtoms(<PrivacyIndicator />);

    act(() => {
      store.set(setPrivacyStateAtom, createPrivacyState({ mode: "stored" }));
    });

    expect(screen.getByLabelText("Privacy: Stored")).toBeInTheDocument();
  });

  it("opens popover on click", async () => {
    const { store, user } = renderWithAtoms(<PrivacyIndicator />);

    act(() => {
      store.set(
        setPrivacyStateAtom,
        createPrivacyState({
          mode: "local",
          details: "All data stays on your machine",
        }),
      );
    });

    const button = screen.getByTestId("privacy-indicator-button");
    await user.click(button);

    expect(screen.getByTestId("privacy-indicator-popover")).toBeInTheDocument();
    expect(screen.getByText("Local Only")).toBeInTheDocument();
    expect(screen.getByText("All data stays on your machine")).toBeInTheDocument();
  });

  it("shows policy link when provided", async () => {
    const { store, user } = renderWithAtoms(<PrivacyIndicator />);

    act(() => {
      store.set(
        setPrivacyStateAtom,
        createPrivacyState({
          mode: "shared",
          details: "Shared with provider",
          policy_url: "https://example.com/privacy",
        }),
      );
    });

    const button = screen.getByTestId("privacy-indicator-button");
    await user.click(button);

    const link = screen.getByTestId("privacy-policy-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com/privacy");
  });

  it("does not show policy link when not provided", async () => {
    const { store, user } = renderWithAtoms(<PrivacyIndicator />);

    act(() => {
      store.set(setPrivacyStateAtom, createPrivacyState({ mode: "local", details: "Local only" }));
    });

    const button = screen.getByTestId("privacy-indicator-button");
    await user.click(button);

    expect(screen.queryByTestId("privacy-policy-link")).not.toBeInTheDocument();
  });

  it("updates when privacy state changes", () => {
    const { store } = renderWithAtoms(<PrivacyIndicator />);

    act(() => {
      store.set(setPrivacyStateAtom, createPrivacyState({ mode: "local" }));
    });

    expect(screen.getByLabelText("Privacy: Local Only")).toBeInTheDocument();

    act(() => {
      store.set(setPrivacyStateAtom, createPrivacyState({ mode: "stored" }));
    });

    expect(screen.getByLabelText("Privacy: Stored")).toBeInTheDocument();
  });
});
