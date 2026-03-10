/**
 * PanelLayout Stress & Edge-Case Tests
 *
 * Tests:
 * - All 5 slots populated
 * - Missing optional slots (header/subheader/subfooter/footer)
 * - Only children (minimum required)
 * - Custom className
 * - Slot ordering in DOM
 * - h-screen and overflow-hidden classes
 */
import { render, screen } from "@testing-library/react";

import { PanelLayout } from "../../PanelLayout";

describe("PanelLayout – stress & edge cases", () => {
  // ── All 5 slots ────────────────────────────────────────
  describe("all 5 slots", () => {
    it("all slots populated: correct DOM order", () => {
      const { container } = render(
        <PanelLayout
          header={<div data-testid="header">Header</div>}
          subheader={<div data-testid="subheader">Subheader</div>}
          subfooter={<div data-testid="subfooter">Subfooter</div>}
          footer={<div data-testid="footer">Footer</div>}
        >
          <div data-testid="main">Main content</div>
        </PanelLayout>,
      );

      const root = container.firstChild as HTMLElement;
      const children = Array.from(root.children);

      // Order: header, subheader, main, subfooter, footer
      expect(children).toHaveLength(5);
      expect((children[0] as HTMLElement).dataset.testid).toBe("header");
      expect((children[1] as HTMLElement).dataset.testid).toBe("subheader");
      expect((children[2] as HTMLElement).tagName).toBe("MAIN");
      expect((children[3] as HTMLElement).dataset.testid).toBe("subfooter");
      expect((children[4] as HTMLElement).dataset.testid).toBe("footer");
    });
  });

  // ── Missing optional slots ─────────────────────────────
  describe("missing optional slots", () => {
    it("only children: renders just main", () => {
      const { container } = render(
        <PanelLayout>
          <div>Content only</div>
        </PanelLayout>,
      );

      const root = container.firstChild as HTMLElement;
      // Only main element
      expect(root.children).toHaveLength(1);
      expect(root.children[0]?.tagName).toBe("MAIN");
    });

    it("header + children + footer: 3 children", () => {
      const { container } = render(
        <PanelLayout header={<div>H</div>} footer={<div>F</div>}>
          <div>Content</div>
        </PanelLayout>,
      );

      const root = container.firstChild as HTMLElement;
      expect(root.children).toHaveLength(3);
    });

    it("no header: first child is main", () => {
      const { container } = render(
        <PanelLayout footer={<div>F</div>}>
          <div>Content</div>
        </PanelLayout>,
      );

      const root = container.firstChild as HTMLElement;
      expect(root.children[0]?.tagName).toBe("MAIN");
    });
  });

  // ── CSS classes ────────────────────────────────────────
  describe("CSS classes", () => {
    it("root has h-screen and overflow-hidden", () => {
      const { container } = render(
        <PanelLayout>
          <div>C</div>
        </PanelLayout>,
      );

      const root = container.firstChild as HTMLElement;
      expect(root.className).toMatch(/h-full/);
      expect(root.className).toMatch(/overflow-hidden/);
      expect(root.className).toMatch(/flex/);
      expect(root.className).toMatch(/flex-col/);
    });

    it("main has flex-1, min-h-0, overflow-hidden", () => {
      const { container } = render(
        <PanelLayout>
          <div>C</div>
        </PanelLayout>,
      );

      const main = container.querySelector("main")!;
      expect(main.className).toMatch(/flex-1/);
      expect(main.className).toMatch(/min-h-0/);
      expect(main.className).toMatch(/overflow-hidden/);
    });

    it("custom className: merged with defaults", () => {
      const { container } = render(
        <PanelLayout className="bg-red-500 custom-class">
          <div>C</div>
        </PanelLayout>,
      );

      const root = container.firstChild as HTMLElement;
      expect(root.className).toMatch(/bg-red-500/);
      expect(root.className).toMatch(/custom-class/);
      expect(root.className).toMatch(/h-full/); // defaults preserved
    });
  });

  // ── Main content rendering ─────────────────────────────
  describe("main content", () => {
    it("multiple children in main: all rendered", () => {
      render(
        <PanelLayout>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </PanelLayout>,
      );

      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
      expect(screen.getByText("Child 3")).toBeInTheDocument();
    });

    it("main has relative positioning for absolute children", () => {
      const { container } = render(
        <PanelLayout>
          <div>C</div>
        </PanelLayout>,
      );

      const main = container.querySelector("main")!;
      expect(main.className).toMatch(/relative/);
    });
  });
});
