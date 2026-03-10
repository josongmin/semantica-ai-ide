import type { Unsubscribe } from "@semantica/protocol";

// ── Transport state ─────────────────────────────────────────

export type TransportState = "connecting" | "open" | "closing" | "closed";

// ── Transport interface ─────────────────────────────────────

/**
 * Low-level binary transport.
 * Owned by packages/core. Protocol layer sits above this.
 */
export interface Transport {
  open(url: string): Promise<void>;
  close(): Promise<void>;
  sendRaw(data: Uint8Array): Promise<void>;
  onRaw(cb: (data: Uint8Array) => void): Unsubscribe;
  readonly state: TransportState;
  onStateChange(cb: (state: TransportState) => void): Unsubscribe;
}

// ── WsTransport options ─────────────────────────────────────

export interface WsTransportOptions {
  /** Max reconnect attempts (default: Infinity) */
  maxReconnects?: number;
  /** Base delay between reconnects in ms (default: 1000) */
  reconnectBaseDelay?: number;
  /** Max reconnect delay in ms (default: 30000) */
  reconnectMaxDelay?: number;
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
  /** Max send buffer in bytes before rejecting (default: 1MB) */
  maxBufferedAmount?: number;
}

// ── WsTransport implementation ──────────────────────────────

export class WsTransport implements Transport {
  private ws: WebSocket | null = null;
  private _state: TransportState = "closed";
  private rawListeners: Set<(data: Uint8Array) => void> = new Set();
  private stateListeners: Set<(state: TransportState) => void> = new Set();
  private url = "";
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private connectPromise: Promise<void> | null = null;
  private readonly opts: Required<WsTransportOptions>;

  constructor(options?: WsTransportOptions) {
    this.opts = {
      maxReconnects: options?.maxReconnects ?? Infinity,
      reconnectBaseDelay: options?.reconnectBaseDelay ?? 1000,
      reconnectMaxDelay: options?.reconnectMaxDelay ?? 30_000,
      heartbeatInterval: options?.heartbeatInterval ?? 30_000,
      maxBufferedAmount: options?.maxBufferedAmount ?? 1_048_576, // 1MB
    };
  }

  get state(): TransportState {
    return this._state;
  }

  async open(url: string): Promise<void> {
    // Guard against multiple concurrent open() calls
    if (this.connectPromise) {
      return this.connectPromise;
    }
    // Close existing connection if open
    if (this.ws) {
      await this.close();
    }
    this.url = url;
    this.reconnectAttempt = 0;
    await this.connect();
  }

  async close(): Promise<void> {
    this.connectPromise = null;
    this.setState("closing");
    this.clearTimers();
    this.ws?.close(1000, "client_close");
    this.ws = null;
    this.setState("closed");
  }

  async sendRaw(data: Uint8Array): Promise<void> {
    if (this._state !== "open" || !this.ws) {
      throw new Error(`Transport not open (state: ${this._state})`);
    }
    // Backpressure: reject if send buffer is too large
    if (this.ws.bufferedAmount > this.opts.maxBufferedAmount) {
      throw new Error(
        `Send buffer overflow: ${this.ws.bufferedAmount} bytes pending (max: ${this.opts.maxBufferedAmount})`,
      );
    }
    this.ws.send(data);
  }

  onRaw(cb: (data: Uint8Array) => void): Unsubscribe {
    this.rawListeners.add(cb);
    return () => this.rawListeners.delete(cb);
  }

  onStateChange(cb: (state: TransportState) => void): Unsubscribe {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  // ── Private ─────────────────────────────────────────────

  private connect(): Promise<void> {
    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.setState("connecting");
      const ws = new WebSocket(this.url);
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        this.ws = ws;
        this.reconnectAttempt = 0;
        this.connectPromise = null;
        this.setState("open");
        this.startHeartbeat();
        resolve();
      };

      ws.onerror = () => {
        this.connectPromise = null;
        if (this._state === "connecting") {
          reject(new Error(`WebSocket connection failed: ${this.url}`));
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        const data =
          event.data instanceof ArrayBuffer
            ? new Uint8Array(event.data)
            : new TextEncoder().encode(event.data as string);
        for (const cb of this.rawListeners) cb(data);
      };

      ws.onclose = () => {
        this.clearTimers();
        this.connectPromise = null;
        if (this._state !== "closing" && this._state !== "closed") {
          this.setState("closed");
          this.scheduleReconnect();
        }
      };
    });
    return this.connectPromise;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= this.opts.maxReconnects) return;

    // Exponential backoff with jitter to prevent thundering herd
    const base = Math.min(
      this.opts.reconnectBaseDelay * 2 ** this.reconnectAttempt,
      this.opts.reconnectMaxDelay,
    );
    const jitter = base * 0.2 * Math.random();
    const delay = base + jitter;
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Will trigger onclose → scheduleReconnect again
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send protocol-level heartbeat (empty JSON object)
        // Browser WebSocket API doesn't support ws.ping(), so we send
        // a lightweight data frame that agentd recognizes as heartbeat
        this.ws.send("{}");
      }
    }, this.opts.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
  }

  private setState(state: TransportState): void {
    this._state = state;
    for (const cb of this.stateListeners) cb(state);
  }
}
