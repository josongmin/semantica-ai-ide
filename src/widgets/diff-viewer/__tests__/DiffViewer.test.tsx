import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DiffViewer } from "../DiffViewer";

describe("DiffViewer", () => {
  it("renders diff with line numbers", () => {
    const diffText = `@@ -1,3 +1,4 @@
 import React from "react";
+import { useState } from "react";

-const App = () => {
+const App: React.FC = () => {`;

    render(<DiffViewer filePath="src/App.tsx" diffText={diffText} />);

    const viewer = screen.getByTestId("diff-viewer");
    expect(viewer).toBeInTheDocument();

    // File name should be rendered
    expect(screen.getByText("App.tsx")).toBeInTheDocument();

    // Full path should be shown
    expect(screen.getByText("src/App.tsx")).toBeInTheDocument();
  });

  it("Accept/Reject buttons with aria-label", () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();

    render(
      <DiffViewer
        filePath="src/utils.ts"
        diffText="@@ -1,2 +1,3 @@\n context\n+added line\n context"
        onAccept={onAccept}
        onReject={onReject}
      />,
    );

    expect(screen.getByLabelText("Accept changes")).toBeInTheDocument();
    expect(screen.getByLabelText("Reject changes")).toBeInTheDocument();
  });

  it("calls onAccept and onReject when buttons are clicked", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onReject = vi.fn();

    render(
      <DiffViewer
        filePath="src/utils.ts"
        diffText="@@ -1,2 +1,3 @@\n context\n+added line\n context"
        onAccept={onAccept}
        onReject={onReject}
      />,
    );

    await user.click(screen.getByLabelText("Accept changes"));
    expect(onAccept).toHaveBeenCalledTimes(1);

    await user.click(screen.getByLabelText("Reject changes"));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('empty diff shows "No diff available"', () => {
    render(<DiffViewer filePath="src/empty.ts" diffText="" />);

    expect(screen.getByText("No diff available")).toBeInTheDocument();
  });

  it("parses diff lines correctly - add/remove/context/header", () => {
    const diffText = `@@ -5,4 +5,5 @@
 function greet() {
-  return "hello";
+  const name = "world";
+  return \`hello \${name}\`;
 }`;

    render(<DiffViewer filePath="src/greet.ts" diffText={diffText} />);

    const viewer = screen.getByTestId("diff-viewer");

    // Virtualized: each line is a positioned wrapper with data-index
    const region = screen.getByRole("region", { name: /Diff content for/ });
    const lineDivs = region.querySelectorAll("[data-index]");
    expect(lineDivs.length).toBe(6); // header + 1 context + 1 remove + 2 add + 1 context

    // Verify content is present
    expect(viewer.textContent).toContain('return "hello"');
    expect(viewer.textContent).toContain("const name");
  });

  it("does not show Accept/Reject when callbacks are not provided", () => {
    render(
      <DiffViewer filePath="src/readonly.ts" diffText="@@ -1,1 +1,2 @@\n context\n+new line" />,
    );

    expect(screen.queryByLabelText("Accept changes")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Reject changes")).not.toBeInTheDocument();
  });

  it("shows Open in editor button when onOpenInEditor is provided", () => {
    render(
      <DiffViewer
        filePath="src/file.ts"
        diffText="@@ -1,1 +1,2 @@\n context\n+new"
        onOpenInEditor={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Open in editor")).toBeInTheDocument();
  });
});
