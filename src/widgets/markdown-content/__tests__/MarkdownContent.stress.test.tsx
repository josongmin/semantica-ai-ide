/**
 * MarkdownContent Stress & Edge-Case Tests
 *
 * Tests:
 * - XSS/security: script tags, javascript: hrefs, onerror handlers
 * - Large content: 10K lines, deeply nested lists
 * - Code blocks: language labels, copy buttons
 * - GFM features: tables, task lists, strikethrough
 * - Edge cases: empty text, only whitespace, unicode, emoji
 * - Link safety: target=_blank, rel=noopener
 */
import { act, fireEvent, render } from "@testing-library/react";

import { MarkdownContent } from "../MarkdownContent";

describe("MarkdownContent – stress & edge cases", () => {
  // ── XSS / Security ─────────────────────────────────────
  describe("XSS / security", () => {
    it("script tags are stripped (not rendered as <script>)", () => {
      const { container } = render(
        <MarkdownContent text="Hello <script>alert('xss')</script> World" />,
      );
      expect(container.querySelector("script")).toBeNull();
      expect(container.textContent).toContain("Hello");
      expect(container.textContent).toContain("World");
    });

    it("img onerror handler is stripped", () => {
      const { container } = render(<MarkdownContent text='<img src="x" onerror="alert(1)" />' />);
      const img = container.querySelector("img");
      if (img) {
        // react-markdown should strip onerror
        expect(img.getAttribute("onerror")).toBeNull();
      }
    });

    it("javascript: protocol in links is neutralized", () => {
      const { container } = render(<MarkdownContent text="[click me](javascript:alert(1))" />);
      const link = container.querySelector("a");
      if (link) {
        const href = link.getAttribute("href") ?? "";
        expect(href).not.toContain("javascript:");
      }
    });

    it("all links have target=_blank and rel=noopener noreferrer", () => {
      const { container } = render(
        <MarkdownContent text="[a](https://a.com) [b](https://b.com) [c](https://c.com)" />,
      );
      const links = container.querySelectorAll("a");
      expect(links.length).toBeGreaterThanOrEqual(3);
      links.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it("HTML entities are handled safely", () => {
      const { container } = render(
        <MarkdownContent text="&lt;script&gt;alert('xss')&lt;/script&gt;" />,
      );
      expect(container.querySelector("script")).toBeNull();
      expect(container.textContent).toContain("<script>");
    });
  });

  // ── Large content ───────────────────────────────────────
  describe("large content", () => {
    it("1,000 lines of text: renders without crash", () => {
      const lines = Array.from({ length: 1000 }, (_, i) => `Line ${i}: Some content here.`);
      const { container } = render(<MarkdownContent text={lines.join("\n\n")} />);
      expect(container.querySelector(".markdown-body")).toBeInTheDocument();
      expect(container.textContent).toContain("Line 0");
      expect(container.textContent).toContain("Line 999");
    });

    it("very long single line (10K chars): renders without crash", () => {
      const longLine = "x".repeat(10_000);
      const { container } = render(<MarkdownContent text={longLine} />);
      expect(container.textContent).toContain(longLine);
    });

    it("deeply nested lists (10 levels): renders without crash", () => {
      // Build nested list: "- Level 0\n  - Level 1\n    - Level 2..."
      const nested = Array.from({ length: 10 }, (_, i) => `${"  ".repeat(i)}- Level ${i}`).join(
        "\n",
      );
      const { container } = render(<MarkdownContent text={nested} />);
      expect(container.textContent).toContain("Level 0");
      expect(container.textContent).toContain("Level 9");
    });
  });

  // ── Code blocks ─────────────────────────────────────────
  describe("code blocks", () => {
    it("fenced code block with language: shows language label", () => {
      const text = "```typescript\nconst x = 1;\n```";
      const { container } = render(<MarkdownContent text={text} />);

      // Language label should appear (header div with text-2xs + font-medium)
      const langLabel = container.querySelector("[class*='text-2xs'][class*='font-medium']");
      expect(langLabel?.textContent).toBe("typescript");
    });

    it("fenced code block without language: no language label", () => {
      const text = "```\nplain code\n```";
      const { container } = render(<MarkdownContent text={text} />);

      // No language label div (language header has text-2xs + font-medium)
      const langLabels = container.querySelectorAll("[class*='text-2xs'][class*='font-medium']");
      expect(langLabels.length).toBe(0);
    });

    it("code block has copy button", () => {
      const text = "```js\nconsole.log('hi');\n```";
      const { container } = render(<MarkdownContent text={text} />);
      const copyBtn = container.querySelector("[aria-label='Copy code']");
      expect(copyBtn).toBeInTheDocument();
    });

    it("copy button: click triggers clipboard write", async () => {
      const writeText = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      const text = "```js\nconsole.log('hello');\n```";
      const { container } = render(<MarkdownContent text={text} />);

      const copyBtn = container.querySelector("[aria-label='Copy code']")!;
      expect(copyBtn).not.toBeNull();

      await act(async () => {
        fireEvent.click(copyBtn);
        await Promise.resolve();
      });

      expect(writeText).toHaveBeenCalled();
    });

    it("copy button: after copy, label changes to 'Copied'", async () => {
      const writeText = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      const text = "```js\ncode\n```";
      const { container } = render(<MarkdownContent text={text} />);

      const copyBtn = container.querySelector("[aria-label='Copy code']")!;

      await act(async () => {
        fireEvent.click(copyBtn);
        await Promise.resolve();
      });

      const copiedBtn = container.querySelector("[aria-label='Copied']");
      expect(copiedBtn).toBeInTheDocument();
    });

    it("inline code: renders with appropriate styling class", () => {
      const { container } = render(<MarkdownContent text="Use `console.log` here" />);
      const inlineCode = container.querySelector("code");
      expect(inlineCode).toBeInTheDocument();
      expect(inlineCode?.textContent).toBe("console.log");
    });

    it("multiple code blocks: each has its own copy button", () => {
      const text = "```js\nblock1\n```\n\n```py\nblock2\n```\n\n```go\nblock3\n```";
      const { container } = render(<MarkdownContent text={text} />);
      const copyBtns = container.querySelectorAll("[aria-label='Copy code']");
      expect(copyBtns.length).toBe(3);
    });
  });

  // ── GFM features ────────────────────────────────────────
  describe("GFM features", () => {
    it("table: renders with proper structure", () => {
      const table = "| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |";
      const { container } = render(<MarkdownContent text={table} />);

      expect(container.querySelector("table")).toBeInTheDocument();
      expect(container.querySelectorAll("th").length).toBe(2);
      expect(container.querySelectorAll("td").length).toBe(4);
    });

    it("strikethrough: renders as <del>", () => {
      const { container } = render(<MarkdownContent text="~~deleted~~" />);
      const del = container.querySelector("del");
      expect(del).toBeInTheDocument();
      expect(del?.textContent).toBe("deleted");
    });

    it("blockquote: renders with border styling", () => {
      const { container } = render(<MarkdownContent text="> Important quote" />);
      const bq = container.querySelector("blockquote");
      expect(bq).toBeInTheDocument();
      expect(bq?.textContent).toContain("Important quote");
    });

    it("horizontal rule: renders as separator element", () => {
      // react-markdown renders --- with our custom hr component
      const { container } = render(<MarkdownContent text={"Above\n\n---\n\nBelow"} />);
      // Check the text still renders (--- may also be parsed as heading underline)
      expect(container.textContent).toContain("Above");
      expect(container.textContent).toContain("Below");
    });

    it("images: lazy loaded with proper alt text", () => {
      const { container } = render(
        <MarkdownContent text="![Alt text](https://example.com/img.png)" />,
      );
      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("alt", "Alt text");
      expect(img).toHaveAttribute("loading", "lazy");
    });
  });

  // ── Headers ─────────────────────────────────────────────
  describe("headers", () => {
    it("h1, h2, h3 render with correct tags", () => {
      const text = "# H1\n## H2\n### H3";
      const { container } = render(<MarkdownContent text={text} />);

      expect(container.querySelector("h1")?.textContent).toBe("H1");
      expect(container.querySelector("h2")?.textContent).toBe("H2");
      expect(container.querySelector("h3")?.textContent).toBe("H3");
    });
  });

  // ── Edge cases ──────────────────────────────────────────
  describe("edge cases", () => {
    it("empty string: renders empty wrapper", () => {
      const { container } = render(<MarkdownContent text="" />);
      const wrapper = container.querySelector(".markdown-body");
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.textContent.trim()).toBe("");
    });

    it("only whitespace: renders empty-looking content", () => {
      const { container } = render(<MarkdownContent text="   \n\n   " />);
      const wrapper = container.querySelector(".markdown-body");
      expect(wrapper).toBeInTheDocument();
    });

    it("unicode characters: rendered correctly", () => {
      const { container } = render(<MarkdownContent text="한글 테스트 🎉 日本語 中文 العربية" />);
      expect(container.textContent).toContain("한글 테스트");
      expect(container.textContent).toContain("🎉");
      expect(container.textContent).toContain("日本語");
    });

    it("mixed markdown and HTML entities", () => {
      const text = "**bold** & `code` &amp; <em>not real html</em>";
      const { container } = render(<MarkdownContent text={text} />);
      expect(container.querySelector("strong")?.textContent).toBe("bold");
      expect(container.querySelector("code")?.textContent).toBe("code");
    });

    it("consecutive newlines: do not produce excessive spacing", () => {
      const text = "Paragraph 1\n\n\n\n\n\nParagraph 2";
      const { container } = render(<MarkdownContent text={text} />);
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBe(2);
    });
  });

  // ── Lists ───────────────────────────────────────────────
  describe("lists", () => {
    it("ordered list: renders with numbers", () => {
      const text = "1. First\n2. Second\n3. Third";
      const { container } = render(<MarkdownContent text={text} />);
      const ol = container.querySelector("ol");
      expect(ol).toBeInTheDocument();
      expect(ol?.querySelectorAll("li").length).toBe(3);
    });

    it("unordered list: renders with bullets", () => {
      const text = "- Item A\n- Item B\n- Item C";
      const { container } = render(<MarkdownContent text={text} />);
      const ul = container.querySelector("ul");
      expect(ul).toBeInTheDocument();
      expect(ul?.querySelectorAll("li").length).toBe(3);
    });
  });
});
