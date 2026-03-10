import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import {
  compactUsagePctAtom,
  pendingCompactAtom,
} from "../../../features/auto-compact";
import { AutoCompactDialog } from "../AutoCompactDialog";

const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

vi.mock("../../../shared/lib/atoms/toastAtoms", () => ({
  pushToastAtom: {
    read: () => null,
    write: vi.fn(),
    init: null,
  },
}));

function renderWithStore(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <AutoCompactDialog />
    </Provider>,
  );
}

describe("AutoCompactDialog", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("renders nothing when pending is false", () => {
    const store = createStore();
    store.set(pendingCompactAtom, false);
    const { container } = renderWithStore(store);
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("renders dialog when pending is true", () => {
    const store = createStore();
    store.set(pendingCompactAtom, true);
    store.set(compactUsagePctAtom, 87);
    renderWithStore(store);
    expect(screen.getAllByText(/87%/).length).toBeGreaterThan(0);
  });

  it("sends COMPACT_CONTEXT on confirm", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(pendingCompactAtom, true);
    store.set(compactUsagePctAtom, 90);
    renderWithStore(store);

    await user.click(screen.getByText("Compact"));
    expect(mockPostMessage).toHaveBeenCalledWith({ type: "COMPACT_CONTEXT" });
    expect(store.get(pendingCompactAtom)).toBe(false);
  });

  it("dismisses on cancel without sending message", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(pendingCompactAtom, true);
    renderWithStore(store);

    await user.click(screen.getByText("Later"));
    expect(mockPostMessage).not.toHaveBeenCalledWith({ type: "COMPACT_CONTEXT" });
    expect(store.get(pendingCompactAtom)).toBe(false);
  });
});
