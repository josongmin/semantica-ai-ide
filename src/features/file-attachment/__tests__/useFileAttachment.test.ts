import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { projectFilesAtom } from "../../../shared/lib";
import { resetIdCounter } from "../../../shared/lib/mocks";
import { useFileAttachment } from "../model/useFileAttachment";
const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: vi.fn(),
  }),
}));

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("useFileAttachment", () => {
  it("addFile creates attachment from file path", () => {
    const store = createStore();
    const { result } = renderHook(() => useFileAttachment(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.addFile("src/utils/helpers.ts");
    });

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0]).toEqual({
      type: "file",
      name: "helpers.ts",
      path: "src/utils/helpers.ts",
    });
  });

  it("addFile deduplicates by path", () => {
    const store = createStore();
    const { result } = renderHook(() => useFileAttachment(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.addFile("src/a.ts");
      result.current.addFile("src/a.ts");
    });

    expect(result.current.attachments).toHaveLength(1);
  });

  it("removeFile removes by path", () => {
    const store = createStore();
    const { result } = renderHook(() => useFileAttachment(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.addFile("src/a.ts");
      result.current.addFile("src/b.ts");
    });

    act(() => {
      result.current.removeFile("src/a.ts");
    });

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0]?.path).toBe("src/b.ts");
  });

  it("clearAll removes all attachments", () => {
    const store = createStore();
    const { result } = renderHook(() => useFileAttachment(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.addFile("src/a.ts");
      result.current.addFile("src/b.ts");
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.attachments).toHaveLength(0);
  });

  it("requestProjectFiles posts REQUEST_PROJECT_FILES", () => {
    const store = createStore();
    const { result } = renderHook(() => useFileAttachment(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.requestProjectFiles();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "REQUEST_PROJECT_FILES" });
  });

  it("pasteImage posts PASTE_IMAGE and adds image attachment", () => {
    const store = createStore();
    const { result } = renderHook(() => useFileAttachment(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.pasteImage("data:image/png;base64,abc123", "screenshot.png");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "PASTE_IMAGE",
      data_url: "data:image/png;base64,abc123",
      name: "screenshot.png",
    });
    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0]).toEqual({
      type: "image",
      name: "screenshot.png",
      path: "[image] screenshot.png",
      data_url: "data:image/png;base64,abc123",
    });
  });

  it("returns project files from atom", () => {
    const store = createStore();
    store.set(projectFilesAtom, ["src/a.ts", "src/b.ts"]);

    const { result } = renderHook(() => useFileAttachment(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.projectFiles).toEqual(["src/a.ts", "src/b.ts"]);
  });
});
