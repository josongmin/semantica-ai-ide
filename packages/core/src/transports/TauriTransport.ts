import type { Unsubscribe } from "@semantica/protocol"
import type { Transport, TransportState } from "../transport.js"

/**
 * Transport bridge for Tauri IPC.
 * Uses Tauri's invoke/listen API instead of WebSocket.
 */
export class TauriTransport implements Transport {
  private _state: TransportState = "closed"
  private rawListeners = new Set<(data: Uint8Array) => void>()
  private stateListeners = new Set<(state: TransportState) => void>()
  private unlisten: (() => void) | null = null

  get state(): TransportState {
    return this._state
  }

  async open(_url: string): Promise<void> {
    // Dynamically import Tauri API to avoid bundling issues
    const { listen } = await import("@tauri-apps/api/event")
    this.unlisten = await listen<Uint8Array>("devos-event", (event) => {
      const data = event.payload instanceof Uint8Array
        ? event.payload
        : new TextEncoder().encode(JSON.stringify(event.payload))
      for (const cb of this.rawListeners) cb(data)
    }) as unknown as () => void
    this.setState("open")
  }

  async close(): Promise<void> {
    this.unlisten?.()
    this.unlisten = null
    this.setState("closed")
  }

  async sendRaw(data: Uint8Array): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core")
    const decoded = new TextDecoder().decode(data)
    await invoke("devos_send", { payload: JSON.parse(decoded) })
  }

  onRaw(cb: (data: Uint8Array) => void): Unsubscribe {
    this.rawListeners.add(cb)
    return () => this.rawListeners.delete(cb)
  }

  onStateChange(cb: (state: TransportState) => void): Unsubscribe {
    this.stateListeners.add(cb)
    return () => this.stateListeners.delete(cb)
  }

  private setState(state: TransportState): void {
    this._state = state
    for (const cb of this.stateListeners) cb(state)
  }
}
