import { createStore } from "jotai";

import { resetIdCounter } from "../../../shared/lib/mocks";
import type { RemoteCommand, RemoteCommandId } from "../../../shared/protocol";
import {
  MAX_REMOTE_COMMANDS,
  pushRemoteCommandAtom,
  remoteCommandsAtom,
  remoteQrCodeAtom,
  remoteStatusAtom,
  resetRemoteStoreAtom,
  setRemoteStatusAtom,
} from "../model/atoms";

function createRemoteCommand(overrides: Partial<RemoteCommand> = {}): RemoteCommand {
  return {
    id: "cmd_1" as RemoteCommandId,
    text: "run tests",
    received_at_ms: Date.now(),
    executed: false,
    ...overrides,
  };
}

beforeEach(() => {
  resetIdCounter();
});

describe("remoteStatusAtom", () => {
  it("defaults to disconnected", () => {
    const store = createStore();
    expect(store.get(remoteStatusAtom)).toBe("disconnected");
  });
});

describe("remoteQrCodeAtom", () => {
  it("defaults to null", () => {
    const store = createStore();
    expect(store.get(remoteQrCodeAtom)).toBeNull();
  });
});

describe("setRemoteStatusAtom", () => {
  it("sets status to waiting", () => {
    const store = createStore();
    store.set(setRemoteStatusAtom, { status: "waiting" });
    expect(store.get(remoteStatusAtom)).toBe("waiting");
  });

  it("sets status to connected", () => {
    const store = createStore();
    store.set(setRemoteStatusAtom, { status: "connected" });
    expect(store.get(remoteStatusAtom)).toBe("connected");
  });

  it("sets qr_code when provided", () => {
    const store = createStore();
    store.set(setRemoteStatusAtom, {
      status: "waiting",
      qr_code_data_url: "data:image/png;base64,abc123",
    });
    expect(store.get(remoteQrCodeAtom)).toBe("data:image/png;base64,abc123");
  });

  it("does not overwrite qr_code when not provided", () => {
    const store = createStore();
    store.set(setRemoteStatusAtom, {
      status: "waiting",
      qr_code_data_url: "data:image/png;base64,abc123",
    });
    store.set(setRemoteStatusAtom, { status: "connected" });

    // qr_code should remain unchanged since it was not provided in second call
    expect(store.get(remoteQrCodeAtom)).toBe("data:image/png;base64,abc123");
    expect(store.get(remoteStatusAtom)).toBe("connected");
  });
});

describe("pushRemoteCommandAtom", () => {
  it("prepends command to the front of the list", () => {
    const store = createStore();
    const cmd1 = createRemoteCommand({ id: "cmd_1" as RemoteCommandId, text: "first" });
    const cmd2 = createRemoteCommand({ id: "cmd_2" as RemoteCommandId, text: "second" });

    store.set(pushRemoteCommandAtom, cmd1);
    store.set(pushRemoteCommandAtom, cmd2);

    const commands = store.get(remoteCommandsAtom);
    expect(commands[0]?.text).toBe("second");
    expect(commands[1]?.text).toBe("first");
  });

  it("caps list at MAX_REMOTE_COMMANDS", () => {
    const store = createStore();

    for (let i = 0; i < MAX_REMOTE_COMMANDS + 5; i++) {
      store.set(
        pushRemoteCommandAtom,
        createRemoteCommand({ id: `cmd_${i}` as RemoteCommandId, text: `command ${i}` }),
      );
    }

    expect(store.get(remoteCommandsAtom).length).toBe(MAX_REMOTE_COMMANDS);
  });

  it("oldest commands are dropped when cap is exceeded", () => {
    const store = createStore();
    const firstCommand = createRemoteCommand({
      id: "cmd_first" as RemoteCommandId,
      text: "very first",
    });
    store.set(pushRemoteCommandAtom, firstCommand);

    for (let i = 0; i < MAX_REMOTE_COMMANDS; i++) {
      store.set(
        pushRemoteCommandAtom,
        createRemoteCommand({ id: `cmd_${i}` as RemoteCommandId, text: `cmd ${i}` }),
      );
    }

    const commands = store.get(remoteCommandsAtom);
    expect(commands.length).toBe(MAX_REMOTE_COMMANDS);
    const texts = commands.map((c) => c.text);
    expect(texts).not.toContain("very first");
  });

  it("stores executed flag correctly", () => {
    const store = createStore();
    const cmd = createRemoteCommand({ id: "cmd_1" as RemoteCommandId, executed: true });
    store.set(pushRemoteCommandAtom, cmd);

    expect(store.get(remoteCommandsAtom)[0]?.executed).toBe(true);
  });
});

describe("resetRemoteStoreAtom", () => {
  it("resets status to disconnected, clears qr code and commands", () => {
    const store = createStore();
    store.set(setRemoteStatusAtom, {
      status: "connected",
      qr_code_data_url: "data:image/png;base64,xyz",
    });
    store.set(pushRemoteCommandAtom, createRemoteCommand({ id: "cmd_1" as RemoteCommandId }));
    store.set(pushRemoteCommandAtom, createRemoteCommand({ id: "cmd_2" as RemoteCommandId }));

    store.set(resetRemoteStoreAtom);

    expect(store.get(remoteStatusAtom)).toBe("disconnected");
    expect(store.get(remoteQrCodeAtom)).toBeNull();
    expect(store.get(remoteCommandsAtom)).toEqual([]);
  });
});

describe("MAX_REMOTE_COMMANDS constant", () => {
  it("is 20", () => {
    expect(MAX_REMOTE_COMMANDS).toBe(20);
  });
});
