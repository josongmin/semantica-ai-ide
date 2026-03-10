import { render } from "@testing-library/react";

import { isAllowedImageSrc, MarkdownContent } from "../MarkdownContent";

describe("MarkdownContent", () => {
  it("renders plain text", () => {
    const { container } = render(<MarkdownContent text="Hello world" />);
    expect(container.textContent).toContain("Hello world");
  });

  it("renders bold markdown as <strong>", () => {
    const { container } = render(<MarkdownContent text="**bold text**" />);
    const strong = container.querySelector("strong");
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe("bold text");
  });

  it("renders italic markdown as <em>", () => {
    const { container } = render(<MarkdownContent text="*italic text*" />);
    const em = container.querySelector("em");
    expect(em).toBeInTheDocument();
    expect(em?.textContent).toBe("italic text");
  });

  it("renders empty text as an empty wrapper", () => {
    const { container } = render(<MarkdownContent text="" />);
    const wrapper = container.querySelector(".markdown-body");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.textContent.trim()).toBe("");
  });

  it("applies the markdown-body base class", () => {
    const { container } = render(<MarkdownContent text="test" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("markdown-body");
  });

  it("merges external className", () => {
    const { container } = render(<MarkdownContent text="test" className="custom-md" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("markdown-body");
    expect(wrapper).toHaveClass("custom-md");
  });

  it("renders links with target=_blank and rel=noopener", () => {
    const { container } = render(<MarkdownContent text="[click](https://example.com)" />);
    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders inline code with correct styling", () => {
    const { container } = render(<MarkdownContent text="Use `getValue()` here" />);
    const code = container.querySelector("code");
    expect(code).toBeInTheDocument();
    expect(code?.textContent).toBe("getValue()");
  });

  it("renders GFM tables", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const { container } = render(<MarkdownContent text={md} />);
    expect(container.querySelector("table")).toBeInTheDocument();
    expect(container.querySelector("th")?.textContent).toBe("A");
    expect(container.querySelector("td")?.textContent).toBe("1");
  });

  it("renders blockquote", () => {
    const { container } = render(<MarkdownContent text="> quoted text" />);
    const bq = container.querySelector("blockquote");
    expect(bq).toBeInTheDocument();
    expect(bq?.textContent).toContain("quoted text");
  });

  it("renders ordered and unordered lists", () => {
    const md = "- item1\n- item2\n\n1. first\n2. second";
    const { container } = render(<MarkdownContent text={md} />);
    expect(container.querySelector("ul")).toBeInTheDocument();
    expect(container.querySelector("ol")).toBeInTheDocument();
  });

  it("renders headings h1-h3", () => {
    const md = "# H1\n## H2\n### H3";
    const { container } = render(<MarkdownContent text={md} />);
    expect(container.querySelector("h1")?.textContent).toBe("H1");
    expect(container.querySelector("h2")?.textContent).toBe("H2");
    expect(container.querySelector("h3")?.textContent).toBe("H3");
  });

  it("renders horizontal rule", () => {
    const { container } = render(<MarkdownContent text={"before\n\n---\n\nafter"} />);
    expect(container.querySelector("hr")).toBeInTheDocument();
  });
});

// ── isAllowedImageSrc ──────────────────────────────────────
describe("isAllowedImageSrc", () => {
  it("allows https:// URLs", () => {
    expect(isAllowedImageSrc("https://example.com/img.png")).toBe(true);
  });

  it("rejects http:// URLs", () => {
    expect(isAllowedImageSrc("http://example.com/img.png")).toBe(false);
  });

  it("allows valid data:image/png;base64 URIs", () => {
    const small = "data:image/png;base64,iVBOR";
    expect(isAllowedImageSrc(small)).toBe(true);
  });

  it("allows data:image/jpeg;base64", () => {
    expect(isAllowedImageSrc("data:image/jpeg;base64,/9j/4AAQ")).toBe(true);
  });

  it("allows data:image/svg+xml;base64", () => {
    expect(isAllowedImageSrc("data:image/svg+xml;base64,PHN2Zw==")).toBe(true);
  });

  it("rejects data:text/html;base64 (non-image MIME)", () => {
    expect(isAllowedImageSrc("data:text/html;base64,PGg+")).toBe(false);
  });

  it("rejects data:application/javascript;base64", () => {
    expect(isAllowedImageSrc("data:application/javascript;base64,YWxlcnQ=")).toBe(false);
  });

  it("rejects oversized data URI (>1.4MB)", () => {
    const huge = `data:image/png;base64,${  "A".repeat(1_500_000)}`;
    expect(isAllowedImageSrc(huge)).toBe(false);
  });

  it("rejects javascript: protocol", () => {
    expect(isAllowedImageSrc("javascript:alert(1)")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isAllowedImageSrc("")).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isAllowedImageSrc(undefined)).toBe(false);
  });

  it("rejects relative paths", () => {
    expect(isAllowedImageSrc("../img.png")).toBe(false);
  });

  it("rejects ftp:// protocol", () => {
    expect(isAllowedImageSrc("ftp://server/img.png")).toBe(false);
  });

  it("rejects blob: URIs", () => {
    expect(isAllowedImageSrc("blob:http://localhost/abc-123")).toBe(false);
  });
});
