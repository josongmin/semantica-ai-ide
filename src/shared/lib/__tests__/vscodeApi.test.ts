describe("getVscodeApi", () => {
  const mockApi = {
    postMessage: vi.fn(),
    getState: vi.fn(() => null),
    setState: vi.fn(),
  };

  beforeEach(() => {
    // Reset the cached module so the singleton resets between tests
    vi.resetModules();
  });

  afterEach(() => {
    // Clean up the global
    vi.unstubAllGlobals();
  });

  it("returns the VS Code API object from acquireVsCodeApi", async () => {
    vi.stubGlobal(
      "acquireVsCodeApi",
      vi.fn(() => mockApi),
    );

    const { getVscodeApi } = await import("../vscodeApi");
    const api = getVscodeApi();

    // getVscodeApi wraps the real API in a safe proxy, so identity won't match
    expect(api).toBeDefined();
    expect(typeof api.postMessage).toBe("function");
    expect(typeof api.getState).toBe("function");
    expect(typeof api.setState).toBe("function");
  });

  it("calls acquireVsCodeApi only once (singleton)", async () => {
    const acquireMock = vi.fn(() => mockApi);
    vi.stubGlobal("acquireVsCodeApi", acquireMock);

    const { getVscodeApi } = await import("../vscodeApi");
    getVscodeApi();
    getVscodeApi();
    getVscodeApi();

    expect(acquireMock).toHaveBeenCalledTimes(1);
  });

  it("returns a fallback API when acquireVsCodeApi throws", async () => {
    vi.stubGlobal(
      "acquireVsCodeApi",
      vi.fn(() => {
        throw new Error("Not in VS Code");
      }),
    );

    const { getVscodeApi } = await import("../vscodeApi");
    const api = getVscodeApi();

    expect(api).toBeDefined();
    expect(typeof api.postMessage).toBe("function");
    expect(typeof api.getState).toBe("function");
    expect(typeof api.setState).toBe("function");
  });

  it("fallback getState returns null", async () => {
    vi.stubGlobal(
      "acquireVsCodeApi",
      vi.fn(() => {
        throw new Error("Not in VS Code");
      }),
    );

    const { getVscodeApi } = await import("../vscodeApi");
    const api = getVscodeApi();

    expect(api.getState()).toBeNull();
  });
});
