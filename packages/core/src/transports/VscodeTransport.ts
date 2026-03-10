import type { Unsubscribe } from "@semantica/protocol"
import type { Transport, TransportState } from "../transport.js"

/**
 * Transport bridge for VSCode webview ↔ extension host.
 * Uses window.postMessage/onmessage instead of WebSocket.
 */
export class VscodeTransport implements Transport {
  private _state: TransportState = "closed"
  private rawListeners = new Set<(data: Uint8Array) => void>()
  private stateListeners = new Set<(state: TransportState) => void>()
  private vscodeApi: { postMessage(msg: unknown): void } | null = null
  private messageHandler: ((e: MessageEvent) => void) | null = null

  get state(): TransportState {
    return this._state
  }

  async open(_url: string): Promise<void> {
    // acquireVsCodeApi is available in VSCode webview
    if (typeof acquireVsCodeApi === "function") {
      this.vscodeApi = acquireVsCodeApi() as { postMessage(msg: unknown): void }
    }
    this.messageHandler = (e: MessageEvent) => {
      if (e.data && typeof e.data === "object") {
        const encoded = new TextEncoder().encode(JSON.stringify(e.data))
        for (const cb of this.rawListeners) cb(encoded)
      }
    }
    window.addEventListener("message", this.messageHandler)
    this.setState("open")
  }

  async close(): Promise<void> {
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler)
      this.messageHandler = null
    }
    this.vscodeApi = null
    this.setState("closed")
  }

  async sendRaw(data: Uint8Array): Promise<void> {
    if (!this.vscodeApi) throw new Error("VscodeTransport not open")
    const decoded = new TextDecoder().decode(data)
    this.vscodeApi.postMessage(JSON.parse(decoded))
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

declare function acquireVsCodeApi(): unknown
