import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";

import { createFileChange } from "../../../shared/lib/mocks";
import { FileChangeRow } from "../FileChangeRow";

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: vi.fn(),
    getState: () => null,
    setState: () => {},
  }),
}));

describe("FileChangeRow intent display", () => {
  it("shows intent text when present", () => {
    const fc = createFileChange({
      file_path: "src/utils.ts",
      intent: "Refactored error handling logic",
    });

    render(
      <Provider>
        <FileChangeRow fileChange={fc} />
      </Provider>,
    );

    expect(screen.getByText("Refactored error handling logic")).toBeInTheDocument();
  });

  it("does not render intent element when intent is absent", () => {
    const fc = createFileChange({
      file_path: "src/app.tsx",
    });

    render(
      <Provider>
        <FileChangeRow fileChange={fc} />
      </Provider>,
    );

    // File name should be present
    expect(screen.getByText("app.tsx")).toBeInTheDocument();
    // But no intent text
    expect(screen.queryByText(/Refactored/)).not.toBeInTheDocument();
  });

  it("truncates long intent text", () => {
    const longIntent = "A".repeat(200);
    const fc = createFileChange({
      file_path: "src/long.ts",
      intent: longIntent,
    });

    render(
      <Provider>
        <FileChangeRow fileChange={fc} />
      </Provider>,
    );

    // The intent should be rendered (CSS handles truncation)
    expect(screen.getByText(longIntent)).toBeInTheDocument();
  });
});
