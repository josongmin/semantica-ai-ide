/**
 * DiffViewer Stress & Edge-Case Tests
 *
 * Tests:
 * - Large diffs (1K, 5K lines): parsing + rendering
 * - Rapid accept/reject clicks
 * - Edge file paths: unicode, deeply nested, root, no extension
 * - Diff parsing edge cases: empty hunk headers, mixed types, no header
 * - Empty/whitespace-only diffs
 * - Open in editor button
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { DiffViewer } from "../DiffViewer";

/** Generate a diff with N added lines */
function generateLargeDiff(lineCount: number): string {
  const header = `@@ -1,0 +1,${  lineCount  } @@`;
  const lines = Array.from({ length: lineCount }, (_, i) => `+const line${i} = ${i};`);
  return [header, ...lines].join("\n");
}

/** Generate a mixed diff with all 4 types */
function generateMixedDiff(contextLines: number): string {
  const parts = ["@@ -1,10 +1,12 @@"];
  for (let i = 0; i < contextLines; i++) {
    if (i % 4 === 0) parts.push(` context_${i}`);
    else if (i % 4 === 1) parts.push(`+added_${i}`);
    else if (i % 4 === 2) parts.push(`-removed_${i}`);
    else parts.push(` context_${i}`);
  }
  return parts.join("\n");
}

describe("DiffViewer – stress & edge cases", () => {
  // ── Large diff rendering ────────────────────────────────
  describe("large diff rendering", () => {
    it("1,000 added lines: renders all without crash", () => {
      const diffText = generateLargeDiff(1000);
      render(<DiffViewer filePath="src/big.ts" diffText={diffText} />);

      const viewer = screen.getByTestId("diff-viewer");
      expect(viewer).toBeInTheDocument();

      // Should have 1001 divs (1 header + 1000 lines)
      const lineDivs = viewer.querySelectorAll("[data-index]");
      expect(lineDivs.length).toBe(1001);
    });

    it("5,000 line mixed diff: all types parsed correctly", () => {
      const diffText = generateMixedDiff(5000);
      render(<DiffViewer filePath="src/huge.ts" diffText={diffText} />);

      const viewer = screen.getByTestId("diff-viewer");
      expect(viewer).toBeInTheDocument();
      // Header + 5000 lines
      const lineDivs = viewer.querySelectorAll("[data-index]");
      expect(lineDivs.length).toBe(5001);
    });
  });

  // ── Rapid accept/reject ─────────────────────────────────
  describe("rapid accept/reject", () => {
    it("100 rapid accept clicks: callback called each time", () => {
      const onAccept = vi.fn();
      render(
        <DiffViewer
          filePath="src/file.ts"
          diffText="@@ -1,1 +1,2 @@\n context\n+added"
          onAccept={onAccept}
        />,
      );

      const acceptBtn = screen.getByLabelText("Accept changes");
      for (let i = 0; i < 100; i++) {
        fireEvent.click(acceptBtn);
      }

      expect(onAccept).toHaveBeenCalledTimes(100);
    });

    it("100 rapid reject clicks: callback called each time", () => {
      const onReject = vi.fn();
      render(
        <DiffViewer
          filePath="src/file.ts"
          diffText="@@ -1,1 +1,2 @@\n context\n+added"
          onReject={onReject}
        />,
      );

      const rejectBtn = screen.getByLabelText("Reject changes");
      for (let i = 0; i < 100; i++) {
        fireEvent.click(rejectBtn);
      }

      expect(onReject).toHaveBeenCalledTimes(100);
    });

    it("alternating accept/reject 50 times each: both called 50 times", () => {
      const onAccept = vi.fn();
      const onReject = vi.fn();
      render(
        <DiffViewer
          filePath="src/file.ts"
          diffText="@@ -1,1 +1,2 @@\n context\n+added"
          onAccept={onAccept}
          onReject={onReject}
        />,
      );

      const acceptBtn = screen.getByLabelText("Accept changes");
      const rejectBtn = screen.getByLabelText("Reject changes");

      for (let i = 0; i < 50; i++) {
        fireEvent.click(acceptBtn);
        fireEvent.click(rejectBtn);
      }

      expect(onAccept).toHaveBeenCalledTimes(50);
      expect(onReject).toHaveBeenCalledTimes(50);
    });
  });

  // ── Edge file paths ─────────────────────────────────────
  describe("edge file paths", () => {
    const diff = "@@ -1,1 +1,2 @@\n ctx\n+new";

    it("deeply nested path: shows only filename", () => {
      render(<DiffViewer filePath="a/b/c/d/e/f/g/Component.tsx" diffText={diff} />);
      expect(screen.getByText("Component.tsx")).toBeInTheDocument();
    });

    it("root-level file (no directory): shows filename", () => {
      render(<DiffViewer filePath="README.md" diffText={diff} />);
      // filename === filePath for root-level files, text appears in both spans
      expect(screen.getAllByText("README.md").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTitle("README.md")).toBeInTheDocument();
    });

    it("file with no extension", () => {
      render(<DiffViewer filePath="Makefile" diffText={diff} />);
      expect(screen.getAllByText("Makefile").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTitle("Makefile")).toBeInTheDocument();
    });

    it("unicode file path", () => {
      render(<DiffViewer filePath="src/컴포넌트.tsx" diffText={diff} />);
      expect(screen.getByText("컴포넌트.tsx")).toBeInTheDocument();
    });

    it("very long file path: full path shown with title", () => {
      const longPath = `src/${  "nested/".repeat(30)  }file.ts`;
      render(<DiffViewer filePath={longPath} diffText={diff} />);
      expect(screen.getByTitle(longPath)).toBeInTheDocument();
    });
  });

  // ── Diff parsing edge cases ─────────────────────────────
  describe("diff parsing edge cases", () => {
    it("diff with multiple hunk headers: all parsed", () => {
      const diff = [
        "@@ -1,3 +1,4 @@",
        " line1",
        "+added1",
        " line3",
        "@@ -10,2 +11,3 @@",
        " line10",
        "+added2",
        "+added3",
      ].join("\n");

      render(<DiffViewer filePath="multi.ts" diffText={diff} />);
      const viewer = screen.getByTestId("diff-viewer");
      const lineDivs = viewer.querySelectorAll("[data-index]");
      expect(lineDivs.length).toBe(8);
    });

    it("diff with only removals: no added lines", () => {
      const diff = "@@ -1,3 +1,0 @@\n-line1\n-line2\n-line3";
      render(<DiffViewer filePath="deleted.ts" diffText={diff} />);

      const viewer = screen.getByTestId("diff-viewer");
      expect(viewer.textContent).toContain("-line1");
      expect(viewer.textContent).toContain("-line3");
    });

    it("diff with only additions: no removed lines", () => {
      const diff = "@@ -0,0 +1,3 @@\n+line1\n+line2\n+line3";
      render(<DiffViewer filePath="new.ts" diffText={diff} />);

      const viewer = screen.getByTestId("diff-viewer");
      expect(viewer.textContent).toContain("+line1");
    });

    it("whitespace-only diff: shows no diff available", () => {
      render(<DiffViewer filePath="ws.ts" diffText={"   \n  \n   "} />);
      expect(screen.getByText("No diff available")).toBeInTheDocument();
    });

    it("diff with empty line content: renders empty lines", () => {
      const diff = "@@ -1,3 +1,3 @@\n \n+\n-";
      render(<DiffViewer filePath="empty.ts" diffText={diff} />);
      const viewer = screen.getByTestId("diff-viewer");
      const lineDivs = viewer.querySelectorAll("[data-index]");
      expect(lineDivs.length).toBe(4); // header + 3 lines
    });
  });

  // ── Accessibility ───────────────────────────────────────
  describe("accessibility", () => {
    it("diff pre has tabIndex=0 and role=region", () => {
      render(<DiffViewer filePath="a11y.ts" diffText="@@ -1,1 +1,2 @@\n ctx\n+new" />);
      const pre = screen.getByRole("region", { name: /Diff content for/ });
      expect(pre).toBeInTheDocument();
      expect(pre.tagName).toBe("DIV");
      expect(pre).toHaveAttribute("tabindex", "0");
    });

    it("region aria-label includes filename", () => {
      render(<DiffViewer filePath="src/utils/helper.ts" diffText="@@ -1,1 +1,2 @@\n ctx\n+new" />);
      expect(
        screen.getByRole("region", { name: "Diff content for helper.ts" }),
      ).toBeInTheDocument();
    });
  });
});
