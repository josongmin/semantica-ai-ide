import type { ProtocolEnvelope } from "./envelope.js";
import type {
  Capability,
  FsEvent,
  NotificationOpts,
  PlatformAdapter,
  PlatformFs,
  PlatformNative,
  PlatformWindow,
  SystemInfo,
} from "./adapter.js";
import type { Unsubscribe } from "./types.js";

/**
 * DevAdapter — browser-based adapter for local development with `vite dev`.
 * Uses native WebSocket (no Tauri plugins). FS/native ops are no-ops or browser fallbacks.
 */
export class DevAdapter implements PlatformAdapter {
  private ws: WebSocket | null = null;
  private subscribers = new Set<(envelope: ProtocolEnvelope) => void>();
  private _capabilities = new Set<Capability>([
    "native.open-external",
    "native.clipboard",
    "window.manage",
  ]);

  readonly fs: PlatformFs = {
    projectRoot: "",
    async readFile() {
      return new Uint8Array();
    },
    async writeFile() {
      /* noop — browser environment has no filesystem */
    },
    watchDir(_path: string, _cb: (events: FsEvent[]) => void): Unsubscribe {
      return () => {};
    },
  };

  readonly native: PlatformNative = {
    async showNotification(opts: NotificationOpts) {
      if ("Notification" in globalThis && Notification.permission === "granted") {
        new Notification(opts.title, { body: opts.body });
      }
    },
    async openExternal(url: string) {
      globalThis.open(url, "_blank");
    },
    async getSystemInfo(): Promise<SystemInfo> {
      return {
        os: navigator.platform,
        arch: "browser",
        version: navigator.userAgent,
      };
    },
    clipboard: {
      async read() {
        return navigator.clipboard.readText();
      },
      async write(text: string) {
        await navigator.clipboard.writeText(text);
      },
    },
  };

  readonly window: PlatformWindow = {
    async minimize() { /* noop in browser */ },
    async maximize() {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    },
    async close() { globalThis.close(); },
    async setTitle(title: string) { document.title = title; },
    onFocusChange(cb: (focused: boolean) => void): Unsubscribe {
      const onFocus = () => cb(true);
      const onBlur = () => cb(false);
      globalThis.addEventListener("focus", onFocus);
      globalThis.addEventListener("blur", onBlur);
      return () => {
        globalThis.removeEventListener("focus", onFocus);
        globalThis.removeEventListener("blur", onBlur);
      };
    },
  };

  async connect(endpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(endpoint);
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error(`DevAdapter: connection failed to ${endpoint}`));
      this.ws.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data as string) as ProtocolEnvelope;
          for (const cb of this.subscribers) cb(envelope);
        } catch (err) {
          console.error("[DevAdapter] parse error:", err);
        }
      };
      this.ws.onclose = () => {
        console.log("[DevAdapter] disconnected");
      };
    });
  }

  async send(envelope: ProtocolEnvelope): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("DevAdapter not connected");
    }
    this.ws.send(JSON.stringify(envelope));
  }

  subscribe(handler: (envelope: ProtocolEnvelope) => void): Unsubscribe {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  getCapabilities(): Set<Capability> {
    return new Set(this._capabilities);
  }

  hasCapability(cap: Capability): boolean {
    return this._capabilities.has(cap);
  }

  dispose(): void {
    this.ws?.close(1000, "dispose");
    this.ws = null;
    this.subscribers.clear();
  }
}
