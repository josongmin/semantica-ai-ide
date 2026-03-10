import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { createSessionMeta, resetIdCounter } from "../../../shared/lib/mocks";
import { ContextBanner } from "../ContextBanner";

// ─── Mock vscodeApi ────────────────────────────────────────
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
      <ContextBanner />
    </Provider>,
  );
}

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("ContextBanner", () => {
  it("renders nothing when pressure is normal", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 3000,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );

    const { container } = renderWithStore(store);
    expect(container.firstChild).toBeNull();
  });

  it("shows warning banner when pressure is elevated", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 7500,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );

    renderWithStore(store);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Context 75% used/)).toBeInTheDocument();
    expect(screen.getByText("Compact")).toBeInTheDocument();
  });

  it("shows error banner when pressure is critical", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 9000,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );

    renderWithStore(store);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Context nearly full/)).toBeInTheDocument();
    expect(screen.getByText("Compact")).toBeInTheDocument();
    expect(screen.getByText("New Session")).toBeInTheDocument();
  });

  it("Compact button calls requestCompaction", async () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 7500,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );

    renderWithStore(store);

    await userEvent.click(screen.getByText("Compact"));
    expect(mockPostMessage).toHaveBeenCalledWith({ type: "COMPACT_CONTEXT" });
  });

  it("New Session button only appears at critical level", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 7500,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );

    renderWithStore(store);

    // Elevated: no "New Session" button
    expect(screen.queryByText("New Session")).not.toBeInTheDocument();
  });
});
