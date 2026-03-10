import type { ProtocolEnvelope } from "./envelope.js";
import type { Unsubscribe } from "./types.js";

// ── Capability system ───────────────────────────────────────

export type Capability =
  | "fs.read"
  | "fs.write"
  | "fs.watch"
  | "native.clipboard"
  | "native.notification"
  | "native.open-external"
  | "window.manage";

// ── Platform sub-interfaces ─────────────────────────────────

export interface FsEvent {
  readonly kind: "create" | "modify" | "remove";
  readonly path: string;
}

export interface NotificationOpts {
  readonly title: string;
  readonly body: string;
  readonly icon?: string;
}

export interface SystemInfo {
  readonly os: string;
  readonly arch: string;
  readonly version: string;
}

/** fs operates on relative paths from projectRoot only (no absolute paths) */
export interface PlatformFs {
  readFile(relativePath: string): Promise<Uint8Array>;
  writeFile(relativePath: string, data: Uint8Array): Promise<void>;
  watchDir(
    relativePath: string,
    cb: (events: FsEvent[]) => void,
  ): Unsubscribe;
  readonly projectRoot: string;
}

export interface PlatformNative {
  showNotification(opts: NotificationOpts): Promise<void>;
  openExternal(url: string): Promise<void>;
  getSystemInfo(): Promise<SystemInfo>;
  clipboard: {
    read(): Promise<string>;
    write(text: string): Promise<void>;
  };
}

export interface PlatformWindow {
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  close(): Promise<void>;
  setTitle(title: string): Promise<void>;
  onFocusChange(cb: (focused: boolean) => void): Unsubscribe;
}

// ── Communication sub-interface (ISP: separated from capability layers) ──

export interface PlatformComm {
  connect(endpoint: string): Promise<void>;
  send(envelope: ProtocolEnvelope): Promise<void>;
  subscribe(handler: (envelope: ProtocolEnvelope) => void): Unsubscribe;
}

// ── PlatformAdapter (thin wrapper) ──────────────────────────

export interface PlatformAdapter extends PlatformComm {
  // Capability-gated feature layers (use safe accessors below for null-safety)
  readonly fs: PlatformFs;
  readonly native: PlatformNative;
  readonly window: PlatformWindow;

  // Capability query
  getCapabilities(): Set<Capability>;
  hasCapability(cap: Capability): boolean;
  dispose(): void;
}

// ── Type-safe capability accessors (ISP) ────────────────────
// Use these instead of accessing adapter.fs/native/window directly
// to get null-safety based on runtime capabilities.

export function getAdapterFs(adapter: PlatformAdapter): PlatformFs | null {
  return adapter.hasCapability("fs.read") || adapter.hasCapability("fs.write")
    ? adapter.fs
    : null;
}

export function getAdapterNative(adapter: PlatformAdapter): PlatformNative | null {
  return adapter.hasCapability("native.clipboard") ||
    adapter.hasCapability("native.notification") ||
    adapter.hasCapability("native.open-external")
    ? adapter.native
    : null;
}

export function getAdapterWindow(adapter: PlatformAdapter): PlatformWindow | null {
  return adapter.hasCapability("window.manage") ? adapter.window : null;
}
