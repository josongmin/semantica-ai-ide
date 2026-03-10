import { createStore } from "jotai";

import {
  closeSlashPaletteAtom,
  openSlashPaletteAtom,
  slashCommandOpenAtom,
  slashCommandQueryAtom,
  slashCommandSelectedIndexAtom,
} from "../model/atoms";

describe("slash-command atoms", () => {
  it("openSlashPaletteAtom opens palette and resets state", () => {
    const store = createStore();

    // Set some pre-existing state
    store.set(slashCommandQueryAtom, "old");
    store.set(slashCommandSelectedIndexAtom, 5);

    store.set(openSlashPaletteAtom);

    expect(store.get(slashCommandOpenAtom)).toBe(true);
    expect(store.get(slashCommandQueryAtom)).toBe("");
    expect(store.get(slashCommandSelectedIndexAtom)).toBe(0);
  });

  it("closeSlashPaletteAtom closes palette but preserves query for exit animation", () => {
    const store = createStore();

    store.set(slashCommandOpenAtom, true);
    store.set(slashCommandQueryAtom, "test");
    store.set(slashCommandSelectedIndexAtom, 3);

    store.set(closeSlashPaletteAtom);

    expect(store.get(slashCommandOpenAtom)).toBe(false);
    // Query and index stay intact during exit animation to prevent content flash
    expect(store.get(slashCommandQueryAtom)).toBe("test");
    expect(store.get(slashCommandSelectedIndexAtom)).toBe(3);
  });

  it("slashCommandQueryAtom updates independently", () => {
    const store = createStore();
    store.set(slashCommandQueryAtom, "hello");
    expect(store.get(slashCommandQueryAtom)).toBe("hello");
  });

  it("slashCommandSelectedIndexAtom updates independently", () => {
    const store = createStore();
    store.set(slashCommandSelectedIndexAtom, 7);
    expect(store.get(slashCommandSelectedIndexAtom)).toBe(7);
  });
});
