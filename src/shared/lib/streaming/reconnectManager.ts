/**
 * Streaming reconnection manager.
 * Detects when the postMessage bridge becomes unresponsive,
 * and triggers reconnection via the extension host.
 *
 * Uses heartbeat-based detection: the extension host sends periodic
 * NOP serverEvents as heartbeats. If no serverEvent arrives within the timeout,
 * we trigger a reconnect.
 */

interface ReconnectManagerOptions {
  /** Heartbeat timeout in ms — if no serverEvent for this duration, reconnect */
  heartbeatTimeoutMs?: number;
  /** Max reconnection attempts before giving up */
  maxRetries?: number;
  /** Callback when reconnection is triggered */
  onReconnect?: (attempt: number) => void;
  /** Callback when all retry attempts are exhausted */
  onGiveUp?: () => void;
  /** Callback on each heartbeat received (for monitoring) */
  onHeartbeat?: () => void;
}

interface ReconnectManager {
  /** Call on every received serverEvent/message to reset heartbeat timer */
  recordActivity(): void;
  /** Start monitoring (call when session begins running) */
  start(): void;
  /** Stop monitoring (call when session finishes or pauses) */
  stop(): void;
  /** Reset retry counter (call on successful reconnection) */
  resetRetries(): void;
  /** Current retry attempt count */
  readonly retryCount: number;
  /** Whether currently monitoring */
  readonly active: boolean;
}

const DEFAULT_HEARTBEAT_TIMEOUT = 30_000; // 30s
const DEFAULT_MAX_RETRIES = 3;

export function createReconnectManager(options: ReconnectManagerOptions = {}): ReconnectManager {
  const heartbeatTimeout = options.heartbeatTimeoutMs ?? DEFAULT_HEARTBEAT_TIMEOUT;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  let timerId: ReturnType<typeof setTimeout> | null = null;
  let retries = 0;
  let active = false;

  function clearTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function scheduleCheck() {
    clearTimer();
    if (!active) return;
    timerId = setTimeout(() => {
      if (!active) return;
      retries++;
      if (retries > maxRetries) {
        options.onGiveUp?.();
        stop();
        return;
      }
      options.onReconnect?.(retries);
      // Schedule next check in case reconnect takes time
      scheduleCheck();
    }, heartbeatTimeout);
  }

  function recordActivity() {
    if (!active) return;
    options.onHeartbeat?.();
    // Reset timer on every activity
    scheduleCheck();
  }

  function start() {
    active = true;
    retries = 0;
    scheduleCheck();
  }

  function stop() {
    active = false;
    clearTimer();
  }

  function resetRetries() {
    retries = 0;
  }

  return {
    recordActivity,
    start,
    stop,
    resetRetries,
    get retryCount() {
      return retries;
    },
    get active() {
      return active;
    },
  };
}
