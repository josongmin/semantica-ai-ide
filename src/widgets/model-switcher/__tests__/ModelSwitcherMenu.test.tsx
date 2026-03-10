import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { availableModelsAtom } from "../../../shared/lib";
import { createModelInfo, createSessionMeta, resetIdCounter } from "../../../shared/lib/mocks";
import { ModelSwitcherMenu } from "../ModelSwitcherMenu";

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
      <ModelSwitcherMenu />
    </Provider>,
  );
}

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("ModelSwitcherMenu", () => {
  it("renders current model label", () => {
    const store = createStore();
    store.set(sessionMetaAtom, createSessionMeta({ model_id: "opus", model_label: "Opus" }));
    store.set(availableModelsAtom, [createModelInfo({ id: "opus", label: "Opus" })]);

    renderWithStore(store);

    expect(screen.getByText("Opus")).toBeInTheDocument();
  });

  it("shows dropdown with models on click", async () => {
    const store = createStore();
    store.set(sessionMetaAtom, createSessionMeta({ model_id: "opus" }));
    store.set(availableModelsAtom, [
      createModelInfo({ id: "opus", label: "Opus" }),
      createModelInfo({ id: "sonnet", label: "Sonnet" }),
    ]);

    renderWithStore(store);

    await userEvent.click(screen.getByTestId("model-switcher-trigger"));

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("posts SWITCH_MODEL when selecting a different model", async () => {
    const store = createStore();
    store.set(sessionMetaAtom, createSessionMeta({ model_id: "opus" }));
    store.set(availableModelsAtom, [
      createModelInfo({ id: "opus", label: "Opus" }),
      createModelInfo({ id: "sonnet", label: "Sonnet" }),
    ]);

    renderWithStore(store);

    await userEvent.click(screen.getByTestId("model-switcher-trigger"));
    await userEvent.click(screen.getByText("Sonnet"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SWITCH_MODEL",
      model_id: "sonnet",
    });
  });

  it("renders as text when no models available", () => {
    const store = createStore();
    store.set(sessionMetaAtom, createSessionMeta({ model_id: "opus", model_label: "Opus" }));
    store.set(availableModelsAtom, []);

    renderWithStore(store);

    expect(screen.getByText("Opus")).toBeInTheDocument();
    expect(screen.queryByTestId("model-switcher-trigger")).not.toBeInTheDocument();
  });
});
