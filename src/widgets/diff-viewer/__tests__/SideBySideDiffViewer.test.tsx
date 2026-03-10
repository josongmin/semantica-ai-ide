import { render, screen } from "@testing-library/react";

import { SideBySideDiffViewer } from "../SideBySideDiffViewer";

describe("SideBySideDiffViewer", () => {
  it("renders side-by-side grid with aria-label", () => {
    const diffText = `@@ -1,3 +1,4 @@
 import React from "react";
+import { useState } from "react";

-const App = () => {
+const App: React.FC = () => {`;

    render(<SideBySideDiffViewer diffText={diffText} />);

    const region = screen.getByRole("region", { name: "Side-by-side diff" });
    expect(region).toBeInTheDocument();
    expect(region).toHaveClass("grid-cols-2");
  });

  it('shows "No diff available" for empty text', () => {
    render(<SideBySideDiffViewer diffText="" />);
    expect(screen.getByText("No diff available")).toBeInTheDocument();
  });

  it("renders context lines on both sides", () => {
    const diffText = `@@ -1,2 +1,2 @@
 unchanged line`;

    render(<SideBySideDiffViewer diffText={diffText} />);

    const region = screen.getByRole("region");
    // Context line should appear on both old and new sides
    const matches = region.textContent.match(/unchanged line/g);
    expect(matches).toHaveLength(2);
  });

  it("aligns add/remove pairs side by side", () => {
    const diffText = `@@ -1,3 +1,3 @@
 context
-old line
+new line
 context`;

    const { container } = render(<SideBySideDiffViewer diffText={diffText} />);

    // Old side should have remove styling, new side should have add styling
    const cells = container.querySelectorAll("[class*='bg-vsc-diff']");
    expect(cells.length).toBeGreaterThanOrEqual(2);
  });

  it("handles multiple consecutive adds/removes with alignment", () => {
    const diffText = `@@ -1,4 +1,3 @@
-removed1
-removed2
+added1
 context`;

    render(<SideBySideDiffViewer diffText={diffText} />);

    const region = screen.getByRole("region");
    expect(region.textContent).toContain("removed1");
    expect(region.textContent).toContain("removed2");
    expect(region.textContent).toContain("added1");
    expect(region.textContent).toContain("context");
  });

  it("displays line numbers on both sides", () => {
    const diffText = `@@ -5,3 +5,3 @@
 context
-old
+new`;

    const { container } = render(<SideBySideDiffViewer diffText={diffText} />);

    // Line numbers should be displayed
    const lineNumSpans = container.querySelectorAll(".tabular-nums");
    const nums = Array.from(lineNumSpans)
      .map((el) => el.textContent.trim())
      .filter(Boolean);
    // Should include some numbers (5, 6 on old/new sides)
    expect(nums).toContain("5");
    expect(nums).toContain("6");
  });

  it("applies custom className", () => {
    const diffText = `@@ -1,1 +1,1 @@
-old
+new`;

    render(<SideBySideDiffViewer diffText={diffText} className="max-h-[400px]" />);

    const region = screen.getByRole("region");
    expect(region).toHaveClass("max-h-[400px]");
  });

  it("renders hunk header on both sides", () => {
    const diffText = `@@ -10,3 +10,3 @@
 context`;

    render(<SideBySideDiffViewer diffText={diffText} />);

    const region = screen.getByRole("region");
    // Hunk header appears on both old and new sides
    const headerMatches = region.textContent.match(/@@ -10,3 \+10,3 @@/g);
    expect(headerMatches).toHaveLength(2);
  });
});
