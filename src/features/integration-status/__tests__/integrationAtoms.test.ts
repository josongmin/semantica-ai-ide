import { createStore } from "jotai";

import { createIntegrationConnection, resetIdCounter } from "../../../shared/lib/mocks";
import {
  activeIntegrationsAtom,
  connectedIntegrationsCountAtom,
  integrationPanelOpenAtom,
  integrationsListAtom,
  integrationsMapAtom,
  resetIntegrationsStoreAtom,
  setIntegrationsAtom,
} from "../model/integrationAtoms";
beforeEach(() => {
  resetIdCounter();
});

describe("integrationAtoms", () => {
  it("starts with empty map and closed panel", () => {
    const store = createStore();
    expect(store.get(integrationsMapAtom).size).toBe(0);
    expect(store.get(integrationPanelOpenAtom)).toBe(false);
  });

  it("setIntegrationsAtom populates the map", () => {
    const store = createStore();
    const conn1 = createIntegrationConnection({ id: "int-1", platform: "slack" });
    const conn2 = createIntegrationConnection({ id: "int-2", platform: "teams" });

    store.set(setIntegrationsAtom, [conn1, conn2]);

    const map = store.get(integrationsMapAtom);
    expect(map.size).toBe(2);
    expect(map.get("int-1")).toEqual(conn1);
    expect(map.get("int-2")).toEqual(conn2);
  });

  it("integrationsListAtom returns sorted by platform then channel", () => {
    const store = createStore();
    store.set(setIntegrationsAtom, [
      createIntegrationConnection({ id: "i1", platform: "teams", channel: "#general" }),
      createIntegrationConnection({ id: "i2", platform: "slack", channel: "#dev" }),
      createIntegrationConnection({ id: "i3", platform: "slack", channel: "#alerts" }),
    ]);

    const list = store.get(integrationsListAtom);
    expect(list).toHaveLength(3);
    expect(list[0]?.platform).toBe("slack");
    expect(list[0]?.channel).toBe("#alerts");
    expect(list[1]?.platform).toBe("slack");
    expect(list[1]?.channel).toBe("#dev");
    expect(list[2]?.platform).toBe("teams");
  });

  it("activeIntegrationsAtom excludes disconnected", () => {
    const store = createStore();
    store.set(setIntegrationsAtom, [
      createIntegrationConnection({ id: "i1", status: "connected" }),
      createIntegrationConnection({ id: "i2", status: "disconnected" }),
      createIntegrationConnection({ id: "i3", status: "syncing" }),
    ]);

    const active = store.get(activeIntegrationsAtom);
    expect(active).toHaveLength(2);
    expect(active.every((c) => c.status !== "disconnected")).toBe(true);
  });

  it("connectedIntegrationsCountAtom counts only connected", () => {
    const store = createStore();
    store.set(setIntegrationsAtom, [
      createIntegrationConnection({ id: "i1", status: "connected" }),
      createIntegrationConnection({ id: "i2", status: "connected" }),
      createIntegrationConnection({ id: "i3", status: "syncing" }),
      createIntegrationConnection({ id: "i4", status: "disconnected" }),
    ]);

    expect(store.get(connectedIntegrationsCountAtom)).toBe(2);
  });

  it("resetIntegrationsStoreAtom clears all state", () => {
    const store = createStore();
    store.set(setIntegrationsAtom, [createIntegrationConnection({ id: "i1" })]);
    store.set(integrationPanelOpenAtom, true);

    store.set(resetIntegrationsStoreAtom);

    expect(store.get(integrationsMapAtom).size).toBe(0);
    expect(store.get(integrationPanelOpenAtom)).toBe(false);
  });

  it("replacing integrations replaces the map entirely", () => {
    const store = createStore();
    store.set(setIntegrationsAtom, [createIntegrationConnection({ id: "i1", channel: "#first" })]);
    expect(store.get(integrationsMapAtom).size).toBe(1);

    store.set(setIntegrationsAtom, [createIntegrationConnection({ id: "i2", channel: "#second" })]);
    const map = store.get(integrationsMapAtom);
    expect(map.size).toBe(1);
    expect(map.has("i2")).toBe(true);
    expect(map.has("i1")).toBe(false);
  });
});
