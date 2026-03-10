import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils";
import { browserConsoleEntriesAtom, browserStateAtom } from "../../../entities/browser";
import { browserPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { BrowserPanel } from "../BrowserPanel";

const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: vi.fn(),
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
});

const idleBrowserState = {
  url: "",
  loading: false,
};

const consoleEntries = [
  {
    id: "entry_1",
    timestamp_ms: new Date("2025-01-15T10:00:00").getTime(),
    level: "log" as const,
    message: "Hello from the browser",
  },
  {
    id: "entry_2",
    timestamp_ms: new Date("2025-01-15T10:00:01").getTime(),
    level: "error" as const,
    message: "Something went wrong",
  },
  {
    id: "entry_3",
    timestamp_ms: new Date("2025-01-15T10:00:02").getTime(),
    level: "warn" as const,
    message: "Deprecated API usage",
  },
];

describe("BrowserPanel", () => {
  it("returns null when panel is not visible", () => {
    const { container } = renderWithAtoms(<BrowserPanel />, {
      initialValues: [[browserPanelVisibleAtom, false]],
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders panel when visible", () => {
    renderWithAtoms(<BrowserPanel />, {
      initialValues: [
        [browserPanelVisibleAtom, true],
        [browserStateAtom, idleBrowserState],
      ],
    });

    expect(screen.getByTestId("browser-panel")).toBeInTheDocument();
  });

  it("shows URL input and nav buttons", () => {
    renderWithAtoms(<BrowserPanel />, {
      initialValues: [
        [browserPanelVisibleAtom, true],
        [browserStateAtom, idleBrowserState],
      ],
    });

    expect(screen.getByTestId("url-input")).toBeInTheDocument();
    expect(screen.getByTestId("go-button")).toBeInTheDocument();
    expect(screen.getByTestId("close-button")).toBeInTheDocument();
  });

  it("typing URL and clicking Go sends BROWSER_NAVIGATE", async () => {
    const { user } = renderWithAtoms(<BrowserPanel />, {
      initialValues: [
        [browserPanelVisibleAtom, true],
        [browserStateAtom, idleBrowserState],
      ],
    });

    await user.type(screen.getByTestId("url-input"), "https://example.com");
    await user.click(screen.getByTestId("go-button"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "BROWSER_NAVIGATE",
      url: "https://example.com",
    });
  });

  it("pressing Enter in URL input triggers navigation", async () => {
    const { user } = renderWithAtoms(<BrowserPanel />, {
      initialValues: [
        [browserPanelVisibleAtom, true],
        [browserStateAtom, idleBrowserState],
      ],
    });

    await user.type(screen.getByTestId("url-input"), "https://example.com{Enter}");

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "BROWSER_NAVIGATE",
      url: "https://example.com",
    });
  });

  it("close button sends BROWSER_CLOSE", async () => {
    const { user } = renderWithAtoms(<BrowserPanel />, {
      initialValues: [
        [browserPanelVisibleAtom, true],
        [browserStateAtom, idleBrowserState],
      ],
    });

    await user.click(screen.getByTestId("close-button"));

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "BROWSER_CLOSE" });
  });

  it("shows screenshot when screenshot_data_url is set", () => {
    renderWithAtoms(<BrowserPanel />, {
      initialValues: [
        [browserPanelVisibleAtom, true],
        [
          browserStateAtom,
          {
            url: "https://example.com",
            loading: false,
            screenshot_data_url: "data:image/png;base64,abc",
            title: "Example",
          },
        ],
      ],
    });

    const img = screen.getByTestId("browser-screenshot");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "data:image/png;base64,abc");
  });

  it("shows console entries count in header", async () => {
    renderWithAtoms(<BrowserPanel />, {
      initialValues: [
        [browserPanelVisibleAtom, true],
        [browserStateAtom, idleBrowserState],
        [browserConsoleEntriesAtom, consoleEntries],
      ],
    });

    expect(screen.getByText("Console (3)")).toBeInTheDocument();
  });

  it("expanding console shows entries", async () => {
    const { user } = renderWithAtoms(<BrowserPanel />, {
      initialValues: [
        [browserPanelVisibleAtom, true],
        [browserStateAtom, idleBrowserState],
        [browserConsoleEntriesAtom, consoleEntries],
      ],
    });

    // Expand the collapsible
    await user.click(screen.getByText("Console (3)"));

    expect(screen.getByText("Hello from the browser")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
