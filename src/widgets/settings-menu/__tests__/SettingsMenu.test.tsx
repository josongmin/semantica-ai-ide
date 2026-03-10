import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import { fastModeAtom, thinkingModeAtom } from "../../../shared/lib";
import { resetIdCounter } from "../../../shared/lib/mocks";
import { SettingsMenu } from "../SettingsMenu";

const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: vi.fn(),
  }),
}));

function renderWithStore(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <SettingsMenu />
    </Provider>,
  );
}

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("SettingsMenu", () => {
  it("renders trigger button", () => {
    const store = createStore();
    renderWithStore(store);

    expect(screen.getByTestId("settings-menu-trigger")).toBeInTheDocument();
  });

  it("shows menu items on click", async () => {
    const store = createStore();
    renderWithStore(store);

    await userEvent.click(screen.getByTestId("settings-menu-trigger"));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Thinking: OFF")).toBeInTheDocument();
    expect(screen.getByText("Fast Mode: OFF")).toBeInTheDocument();
    expect(screen.getByText("Clear Conversation")).toBeInTheDocument();
  });

  it("toggles thinking mode", async () => {
    const store = createStore();
    store.set(thinkingModeAtom, false);

    renderWithStore(store);

    await userEvent.click(screen.getByTestId("settings-menu-trigger"));
    await userEvent.click(screen.getByText("Thinking: OFF"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_THINKING_MODE",
      enabled: true,
    });
  });

  it("toggles fast mode", async () => {
    const store = createStore();
    store.set(fastModeAtom, false);

    renderWithStore(store);

    await userEvent.click(screen.getByTestId("settings-menu-trigger"));
    await userEvent.click(screen.getByText("Fast Mode: OFF"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_FAST_MODE",
      enabled: true,
    });
  });

  it("clears conversation", async () => {
    const store = createStore();
    renderWithStore(store);

    await userEvent.click(screen.getByTestId("settings-menu-trigger"));
    await userEvent.click(screen.getByText("Clear Conversation"));

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "CLEAR_CONVERSATION" });
  });

  it("shows Thinking: ON when enabled", async () => {
    const store = createStore();
    store.set(thinkingModeAtom, true);

    renderWithStore(store);

    await userEvent.click(screen.getByTestId("settings-menu-trigger"));

    expect(screen.getByText("Thinking: ON")).toBeInTheDocument();
  });
});
