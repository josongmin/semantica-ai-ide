import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import {
  comparisonFilesAtom,
  comparisonPairAtom,
} from "../../../features/checkpoint-comparison";
import { createFileChange } from "../../../shared/lib/mocks";
import type { Checkpoint } from "../../../shared/protocol";
import { CheckpointComparisonPanel } from "../CheckpointComparisonPanel";

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: vi.fn(),
    getState: () => null,
    setState: () => {},
  }),
}));

const CP_FROM: Checkpoint = {
  id: "cp1",
  turn_id: "t1",
  label: "Before refactor",
  timestamp_ms: 1000,
};
const CP_TO: Checkpoint = { id: "cp2", turn_id: "t2", label: "After refactor", timestamp_ms: 2000 };

function renderWithStore(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <CheckpointComparisonPanel />
    </Provider>,
  );
}

describe("CheckpointComparisonPanel", () => {
  it("renders nothing when no comparison is active", () => {
    const store = createStore();
    const { container } = renderWithStore(store);
    expect(container.firstChild).toBeNull();
  });

  it("shows comparison header when pair is set", () => {
    const store = createStore();
    store.set(comparisonPairAtom, { from: CP_FROM, to: CP_TO });
    renderWithStore(store);

    expect(screen.getByText(/Before refactor/)).toBeInTheDocument();
    expect(screen.getByText(/After refactor/)).toBeInTheDocument();
  });

  it("shows loading state when no files", () => {
    const store = createStore();
    store.set(comparisonPairAtom, { from: CP_FROM, to: CP_TO });
    store.set(comparisonFilesAtom, []);
    renderWithStore(store);

    expect(screen.getByText("Loading diff...")).toBeInTheDocument();
  });

  it("renders file changes when files are available", () => {
    const store = createStore();
    store.set(comparisonPairAtom, { from: CP_FROM, to: CP_TO });
    store.set(comparisonFilesAtom, [
      createFileChange({ file_path: "src/app.tsx" }),
      createFileChange({ file_path: "src/utils.ts" }),
    ]);
    renderWithStore(store);

    expect(screen.getByText("app.tsx")).toBeInTheDocument();
    expect(screen.getByText("utils.ts")).toBeInTheDocument();
  });

  it("clears comparison on clear button click", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(comparisonPairAtom, { from: CP_FROM, to: CP_TO });
    renderWithStore(store);

    await user.click(screen.getByLabelText("Clear comparison"));
    expect(store.get(comparisonPairAtom)).toBeNull();
  });

  it("has correct accessibility attributes", () => {
    const store = createStore();
    store.set(comparisonPairAtom, { from: CP_FROM, to: CP_TO });
    renderWithStore(store);

    expect(screen.getByRole("region")).toHaveAttribute("aria-label", "Checkpoint comparison");
  });
});
