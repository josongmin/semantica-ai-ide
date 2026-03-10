import { WsTransport } from "@semantica/core";
import type {
  Capability,
  FsEvent,
  NotificationOpts,
  PlatformAdapter,
  PlatformFs,
  PlatformNative,
  PlatformWindow,
  ProtocolEnvelope,
  SystemInfo,
  Unsubscribe,
} from "@semantica/protocol";
import { jsonCodec } from "@semantica/protocol";

/**
 * TauriAdapter — PlatformAdapter implementation for Tauri v2 desktop.
 * Connects to agentd via WsTransport, uses Tauri plugins for native features.
 */
export class TauriAdapter implements PlatformAdapter {
  private transport = new WsTransport({
    maxReconnects: Infinity,
    reconnectBaseDelay: 1000,
  });
  private subscribers = new Set<(envelope: ProtocolEnvelope) => void>();
  private unsubRaw: Unsubscribe | null = null;

  readonly fs: PlatformFs = createTauriFs();
  readonly native: PlatformNative = createTauriNative();
  readonly window: PlatformWindow = createTauriWindow();

  async connect(endpoint: string): Promise<void> {
    this.unsubRaw = this.transport.onRaw((data) => {
      const envelope = jsonCodec.decode(data);
      for (const cb of this.subscribers) cb(envelope);
    });
    await this.transport.open(endpoint);
  }

  async send(envelope: ProtocolEnvelope): Promise<void> {
    const data = jsonCodec.encode(envelope);
    await this.transport.sendRaw(data);
  }

  subscribe(handler: (envelope: ProtocolEnvelope) => void): Unsubscribe {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  getCapabilities(): Set<Capability> {
    return new Set([
      "fs.read",
      "fs.write",
      "fs.watch",
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
    this.unsubRaw?.();
    this.transport.close();
    this.subscribers.clear();
  }
}

// ── Tauri plugin wrappers (lazy-loaded) ─────────────────────

function createTauriFs(): PlatformFs {
  return {
    projectRoot: "", // Set during session init
    async readFile(relativePath: string) {
      const { readFile } = await import("@tauri-apps/plugin-fs");
      return readFile(relativePath);
    },
    async writeFile(relativePath: string, data: Uint8Array) {
      const { writeFile } = await import("@tauri-apps/plugin-fs");
      await writeFile(relativePath, data);
    },
    watchDir(
      _relativePath: string,
      _cb: (events: FsEvent[]) => void,
    ): Unsubscribe {
      // TODO: implement with @tauri-apps/plugin-fs watch
      return () => {};
    },
  };
}

function createTauriNative(): PlatformNative {
  return {
    async showNotification(opts: NotificationOpts) {
      const { sendNotification } = await import(
        "@tauri-apps/plugin-notification"
      );
      await sendNotification({ title: opts.title, body: opts.body });
    },
    async openExternal(url: string) {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
    },
    async getSystemInfo(): Promise<SystemInfo> {
      const { platform, arch, version } = await import(
        "@tauri-apps/plugin-os"
      );
      return {
        os: (await platform()) as string,
        arch: (await arch()) as string,
        version: (await version()) as string,
      };
    },
    clipboard: {
      async read() {
        const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
        return ((await readText()) as string) ?? "";
      },
      async write(text: string) {
        const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
        await writeText(text);
      },
    },
  };
}

function createTauriWindow(): PlatformWindow {
  return {
    async minimize() {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    },
    async maximize() {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().toggleMaximize();
    },
    async close() {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    },
    async setTitle(title: string) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setTitle(title);
    },
    onFocusChange(cb: (focused: boolean) => void): Unsubscribe {
      let unsub: (() => void) | null = null;
      let disposed = false;
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        if (disposed) return;
        getCurrentWindow()
          .onFocusChanged(({ payload }) => cb(payload))
          .then((u) => {
            if (disposed) { u(); return; }
            unsub = u;
          });
      });
      return () => {
        disposed = true;
        unsub?.();
      };
    },
  };
}
