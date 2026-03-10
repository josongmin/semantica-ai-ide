import { render, screen } from "@testing-library/react";

let headerShouldThrow = false;

// Mock all heavy widgets to keep tests fast and isolated
vi.mock("~widgets/header-bar", () => ({
  HeaderBar: () => {
    if (headerShouldThrow) throw new Error("HeaderBar crashed");
    return <div data-testid="header-bar">HeaderBar</div>;
  },
}));
vi.mock("~widgets/activity-feed", () => ({
  ActivityFeed: () => <div data-testid="activity-feed">ActivityFeed</div>,
}));
vi.mock("~widgets/prompt-box", () => ({
  PromptBox: () => <div data-testid="prompt-box">PromptBox</div>,
}));
vi.mock("~widgets/message-list", () => ({
  MessageList: () => <div data-testid="message-list">MessageList</div>,
}));

import { ChatPage } from "../ChatPage";

afterEach(() => {
  headerShouldThrow = false;
});

describe("ChatPage", () => {
  it("renders all widget slots via PanelLayout", () => {
    render(<ChatPage />);
    expect(screen.getByTestId("header-bar")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-box")).toBeInTheDocument();
    expect(screen.getByTestId("message-list")).toBeInTheDocument();
    // ActivityFeed is inside FeatureSheetHost and only mounts when its panel is open
  });

  it("renders main content area", () => {
    const { container } = render(<ChatPage />);
    expect(container.querySelector("main")).toBeInTheDocument();
  });

  it("wraps widgets in ErrorBoundaries (widget crash does not crash page)", () => {
    headerShouldThrow = true;

    // Suppress React error boundary console.error for cleaner test output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ChatPage />);

    // HeaderBar crashed, but ErrorBoundary caught it — fallback is shown
    expect(screen.queryByTestId("header-bar")).not.toBeInTheDocument();
    expect(screen.getByText(/HeaderBar failed to render/)).toBeInTheDocument();

    // Other widgets still work
    expect(screen.getByTestId("message-list")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-box")).toBeInTheDocument();

    spy.mockRestore();
  });
});
