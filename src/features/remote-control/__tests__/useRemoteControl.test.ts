import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  pushRemoteCommandAtom,
  remoteStatusAtom,
  setRemoteStatusAtom,
} from "../../../entities/remote-control";
import { remotePanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import type { RemoteCommandId } from "../../../shared/protocol";
import { useRemoteControl } from "../model/useRemoteControl";

// ─── Mock vscodeApi ────────────────────────────────────────
const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// ─── Helpers ───────────────────────────────────────────────
function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

// ─── Tests ─────────────────────────────────────────────────
describe("useRemoteControl", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("returns default values when store is empty", () => {
    const store = createStore();
    const { result } = renderHook(() => useRemoteControl(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.status).toBe("disconnected");
    expect(result.current.qrCodeDataUrl).toBeNull();
    expect(result.current.commands).toEqual([]);
    expect(result.current.panelVisible).toBe(false);
  });

  it("togglePanel flips remotePanelVisibleAtom", () => {
    const store = createStore();
    const { result } = renderHook(() => useRemoteControl(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.panelVisible).toBe(false);
    act(() => result.current.togglePanel());
    expect(result.current.panelVisible).toBe(true);
    expect(store.get(remotePanelVisibleAtom)).toBe(true);

    act(() => result.current.togglePanel());
    expect(result.current.panelVisible).toBe(false);
  });

  it("requestQr posts REQUEST_REMOTE_QR", () => {
    const store = createStore();
    const { result } = renderHook(() => useRemoteControl(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.requestQr());

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "REQUEST_REMOTE_QR" });
  });

  it("disconnect posts DISCONNECT_REMOTE", () => {
    const store = createStore();
    const { result } = renderHook(() => useRemoteControl(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.disconnect());

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "DISCONNECT_REMOTE" });
  });

  it("reflects pre-seeded connection status", () => {
    const store = createStore();
    store.set(remoteStatusAtom, "connected");

    const { result } = renderHook(() => useRemoteControl(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.status).toBe("connected");
  });

  it("reflects QR code data URL when set via setRemoteStatusAtom", () => {
    const store = createStore();
    store.set(setRemoteStatusAtom, {
      status: "waiting",
      qr_code_data_url: "data:image/png;base64,abc123",
    });

    const { result } = renderHook(() => useRemoteControl(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.qrCodeDataUrl).toBe("data:image/png;base64,abc123");
    expect(result.current.status).toBe("waiting");
  });

  it("reflects commands pushed via pushRemoteCommandAtom", () => {
    const store = createStore();
    const command = {
      id: "cmd-1" as RemoteCommandId,
      text: "hello",
      received_at_ms: Date.now(),
      executed: false,
    };
    store.set(pushRemoteCommandAtom, command);

    const { result } = renderHook(() => useRemoteControl(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.commands).toHaveLength(1);
    expect(result.current.commands[0]).toEqual(command);
  });

  it("qrCodeDataUrl is null when only status is set without QR code", () => {
    const store = createStore();
    store.set(remoteStatusAtom, "connected");

    const { result } = renderHook(() => useRemoteControl(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.qrCodeDataUrl).toBeNull();
  });

  it("requestQr and disconnect are separate actions and both post correctly", () => {
    const store = createStore();
    const { result } = renderHook(() => useRemoteControl(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.requestQr();
      result.current.disconnect();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(2);
    expect(mockPostMessage).toHaveBeenNthCalledWith(1, { type: "REQUEST_REMOTE_QR" });
    expect(mockPostMessage).toHaveBeenNthCalledWith(2, { type: "DISCONNECT_REMOTE" });
  });
});
