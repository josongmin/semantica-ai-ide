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
 * MockAdapter — in-memory adapter for unit tests.
 * All operations are synchronous and inspectable.
 */
export class MockAdapter implements PlatformAdapter {
  /** Envelopes sent via send() — inspect in tests */
  readonly sent: ProtocolEnvelope[] = [];
  /** Envelopes received by subscribers — push here to simulate server messages */
  private subscribers = new Set<(envelope: ProtocolEnvelope) => void>();
  private _connected = false;
  private _disposed = false;

  readonly fs: PlatformFs = {
    projectRoot: "/mock/project",
    async readFile() { return new Uint8Array(); },
    async writeFile() { /* noop */ },
    watchDir(_path: string, _cb: (events: FsEvent[]) => void): Unsubscribe {
      return () => {};
    },
  };

  readonly native: PlatformNative = {
    async showNotification(_opts: NotificationOpts) { /* noop */ },
    async openExternal(_url: string) { /* noop */ },
    async getSystemInfo(): Promise<SystemInfo> {
      return { os: "mock", arch: "x64", version: "0.0.0" };
    },
    clipboard: {
      async read() { return ""; },
      async write(_text: string) { /* noop */ },
    },
  };

  readonly window: PlatformWindow = {
    async minimize() { /* noop */ },
    async maximize() { /* noop */ },
    async close() { /* noop */ },
    async setTitle(_title: string) { /* noop */ },
    onFocusChange(_cb: (focused: boolean) => void): Unsubscribe {
      return () => {};
    },
  };

  async connect(_endpoint: string): Promise<void> {
    this._connected = true;
  }

  async send(envelope: ProtocolEnvelope): Promise<void> {
    if (!this._connected) throw new Error("MockAdapter not connected");
    this.sent.push(envelope);
  }

  subscribe(handler: (envelope: ProtocolEnvelope) => void): Unsubscribe {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  getCapabilities(): Set<Capability> {
    return new Set([
      "fs.read",
      "fs.write",
      "native.clipboard",
      "native.notification",
      "native.open-external",
      "window.manage",
    ]);
  }

  hasCapability(cap: Capability): boolean {
    return this.getCapabilities().has(cap);
  }

  dispose(): void {
    this._disposed = true;
    this._connected = false;
    this.subscribers.clear();
  }

  // ── Test helpers ────────────────────────────────────────────

  /** Simulate receiving an envelope from the server */
  simulateReceive(envelope: ProtocolEnvelope): void {
    for (const cb of this.subscribers) cb(envelope);
  }

  get connected(): boolean { return this._connected; }
  get disposed(): boolean { return this._disposed; }
}
