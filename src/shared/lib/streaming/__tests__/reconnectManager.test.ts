import { createReconnectManager } from "../reconnectManager";

describe("createReconnectManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts inactive", () => {
    const mgr = createReconnectManager();
    expect(mgr.active).toBe(false);
    expect(mgr.retryCount).toBe(0);
  });

  it("becomes active on start", () => {
    const mgr = createReconnectManager();
    mgr.start();
    expect(mgr.active).toBe(true);
    mgr.stop();
  });

  it("triggers onReconnect after heartbeat timeout", () => {
    const onReconnect = vi.fn();
    const mgr = createReconnectManager({
      heartbeatTimeoutMs: 1000,
      onReconnect,
    });

    mgr.start();
    vi.advanceTimersByTime(1000);

    expect(onReconnect).toHaveBeenCalledWith(1);
    expect(mgr.retryCount).toBe(1);

    mgr.stop();
  });

  it("does not trigger if activity is recorded", () => {
    const onReconnect = vi.fn();
    const mgr = createReconnectManager({
      heartbeatTimeoutMs: 1000,
      onReconnect,
    });

    mgr.start();
    vi.advanceTimersByTime(500);
    mgr.recordActivity(); // resets timer
    vi.advanceTimersByTime(500);

    expect(onReconnect).not.toHaveBeenCalled();

    mgr.stop();
  });

  it("calls onGiveUp after max retries", () => {
    const onReconnect = vi.fn();
    const onGiveUp = vi.fn();
    const mgr = createReconnectManager({
      heartbeatTimeoutMs: 100,
      maxRetries: 2,
      onReconnect,
      onGiveUp,
    });

    mgr.start();

    // First retry
    vi.advanceTimersByTime(100);
    expect(onReconnect).toHaveBeenCalledTimes(1);

    // Second retry
    vi.advanceTimersByTime(100);
    expect(onReconnect).toHaveBeenCalledTimes(2);

    // Third attempt exceeds maxRetries
    vi.advanceTimersByTime(100);
    expect(onGiveUp).toHaveBeenCalledOnce();
  });

  it("resetRetries clears retry counter", () => {
    const onReconnect = vi.fn();
    const mgr = createReconnectManager({
      heartbeatTimeoutMs: 100,
      onReconnect,
    });

    mgr.start();
    vi.advanceTimersByTime(100);
    expect(mgr.retryCount).toBe(1);

    mgr.resetRetries();
    expect(mgr.retryCount).toBe(0);

    mgr.stop();
  });

  it("stop prevents further triggers", () => {
    const onReconnect = vi.fn();
    const mgr = createReconnectManager({
      heartbeatTimeoutMs: 100,
      onReconnect,
    });

    mgr.start();
    mgr.stop();
    vi.advanceTimersByTime(200);

    expect(onReconnect).not.toHaveBeenCalled();
  });

  it("calls onHeartbeat on recordActivity", () => {
    const onHeartbeat = vi.fn();
    const mgr = createReconnectManager({ onHeartbeat });

    mgr.start();
    mgr.recordActivity();

    expect(onHeartbeat).toHaveBeenCalledOnce();

    mgr.stop();
  });

  it("recordActivity is no-op when not active", () => {
    const onHeartbeat = vi.fn();
    const mgr = createReconnectManager({ onHeartbeat });

    mgr.recordActivity(); // not started
    expect(onHeartbeat).not.toHaveBeenCalled();
  });
});
