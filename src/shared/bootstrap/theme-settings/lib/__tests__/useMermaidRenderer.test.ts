import { renderHook, waitFor } from "@testing-library/react";

const mockRender = vi.fn();
const mockInitialize = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    initialize: (...args: unknown[]) => mockInitialize(...args),
    render: (...args: unknown[]) => mockRender(...args),
  },
}));

// Must import AFTER vi.mock so the module-level lazy loader picks up the mock
const { useMermaidRenderer } = await import("../useMermaidRenderer");

describe("useMermaidRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRender.mockResolvedValue({ svg: "<svg>diagram</svg>" });
  });

  it("returns loading state initially", () => {
    // Make the render hang so we can observe loading
    mockRender.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useMermaidRenderer("graph TD; A-->B", "d1"));
    expect(result.current.status).toBe("loading");
  });

  it("returns success state after render completes", async () => {
    mockRender.mockResolvedValue({ svg: "<svg>ok</svg>" });
    const { result } = renderHook(() => useMermaidRenderer("graph TD; A-->B", "d1"));

    await waitFor(() => expect(result.current.status).not.toBe("loading"));

    expect(result.current.status).toBe("success");
    if (result.current.status === "success") {
      expect(result.current.svgHtml).toBe("<svg>ok</svg>");
    }
  });

  it("returns error state when render fails", async () => {
    mockRender.mockRejectedValue(new Error("Invalid syntax"));
    const { result } = renderHook(() => useMermaidRenderer("invalid", "d2"));

    await waitFor(() => expect(result.current.status).not.toBe("loading"));

    expect(result.current.status).toBe("error");
    if (result.current.status === "error") {
      expect(result.current.error).toBe("Invalid syntax");
    }
  });

  it("handles non-Error rejection", async () => {
    mockRender.mockRejectedValue("string error");
    const { result } = renderHook(() => useMermaidRenderer("bad", "d3"));

    await waitFor(() => expect(result.current.status).not.toBe("loading"));

    expect(result.current.status).toBe("error");
    if (result.current.status === "error") {
      expect(result.current.error).toBe("string error");
    }
  });

  it("calls mermaid.render with the provided id and source", async () => {
    const { result } = renderHook(() => useMermaidRenderer("graph LR; X-->Y", "my-id"));

    await waitFor(() => expect(result.current.status).not.toBe("loading"));

    expect(mockRender).toHaveBeenCalledWith("my-id", "graph LR; X-->Y");
    expect(result.current.status).toBe("success");
  });

  it("resets to loading when source changes", async () => {
    mockRender.mockResolvedValue({ svg: "<svg>first</svg>" });

    const { result, rerender } = renderHook(({ source, id }) => useMermaidRenderer(source, id), {
      initialProps: { source: "graph TD; A-->B", id: "d1" },
    });

    await waitFor(() => expect(result.current.status).not.toBe("loading"));
    expect(result.current.status).toBe("success");

    // Now make the next render hang
    mockRender.mockReturnValue(new Promise(() => {}));
    rerender({ source: "graph LR; C-->D", id: "d1" });

    expect(result.current.status).toBe("loading");
  });
});
