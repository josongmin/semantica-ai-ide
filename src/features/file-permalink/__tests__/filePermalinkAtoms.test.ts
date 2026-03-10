import { createStore } from "jotai";

import { upsertFileChangeAtom } from "~entities/diff";
import { turnOrderAtom } from "~entities/message/turns";

import { createFileChange } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import {
  filePermalinkMapAtom,
  filePermalinkTurnIndexAtom,
  fileTurnLabelAtom,
} from "../model/atoms";

describe("filePermalinkAtoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe("filePermalinkMapAtom", () => {
    it("returns empty map when no turns", () => {
      const map = store.get(filePermalinkMapAtom);
      expect(map.size).toBe(0);
    });

    it("maps file paths to their turn IDs", () => {
      const turnId = "turn_1" as TurnId;
      store.set(turnOrderAtom, [turnId]);
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turnId, status: "modified" }),
      );

      const map = store.get(filePermalinkMapAtom);
      expect(map.size).toBe(1);
      expect(map.get("src/app.ts")?.turnId).toBe(turnId);
    });

    it("latest turn wins when multiple turns touch the same file", () => {
      const turn1 = "turn_1" as TurnId;
      const turn2 = "turn_2" as TurnId;
      store.set(turnOrderAtom, [turn1, turn2]);

      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turn1, status: "added" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turn2, status: "modified" }),
      );

      const map = store.get(filePermalinkMapAtom);
      expect(map.size).toBe(1);
      expect(map.get("src/app.ts")?.turnId).toBe(turn2);
    });

    it("tracks multiple files across turns", () => {
      const turn1 = "turn_1" as TurnId;
      const turn2 = "turn_2" as TurnId;
      store.set(turnOrderAtom, [turn1, turn2]);

      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/a.ts", turn_id: turn1, status: "added" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/b.ts", turn_id: turn2, status: "added" }),
      );

      const map = store.get(filePermalinkMapAtom);
      expect(map.size).toBe(2);
      expect(map.get("src/a.ts")?.turnId).toBe(turn1);
      expect(map.get("src/b.ts")?.turnId).toBe(turn2);
    });
  });

  describe("filePermalinkTurnIndexAtom", () => {
    it("returns empty map when no turns", () => {
      const map = store.get(filePermalinkTurnIndexAtom);
      expect(map.size).toBe(0);
    });

    it("maps turn IDs to 1-based indices", () => {
      const turn1 = "turn_1" as TurnId;
      const turn2 = "turn_2" as TurnId;
      store.set(turnOrderAtom, [turn1, turn2]);

      const map = store.get(filePermalinkTurnIndexAtom);
      expect(map.get(turn1)).toBe(1);
      expect(map.get(turn2)).toBe(2);
    });
  });

  describe("fileTurnLabelAtom", () => {
    it("returns null for files with no permalink", () => {
      const getLabel = store.get(fileTurnLabelAtom);
      expect(getLabel("nonexistent.ts")).toBeNull();
    });

    it("returns Turn N label for files with a permalink", () => {
      const turn1 = "turn_1" as TurnId;
      store.set(turnOrderAtom, [turn1]);
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turn1, status: "modified" }),
      );

      const getLabel = store.get(fileTurnLabelAtom);
      const result = getLabel("src/app.ts");
      expect(result).not.toBeNull();
      expect(result!.label).toBe("Turn 1");
      expect(result!.turnId).toBe(turn1);
    });

    it("returns correct turn number for later turns", () => {
      const turn1 = "turn_1" as TurnId;
      const turn2 = "turn_2" as TurnId;
      const turn3 = "turn_3" as TurnId;
      store.set(turnOrderAtom, [turn1, turn2, turn3]);
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turn3, status: "modified" }),
      );

      const getLabel = store.get(fileTurnLabelAtom);
      const result = getLabel("src/app.ts");
      expect(result!.label).toBe("Turn 3");
      expect(result!.turnId).toBe(turn3);
    });
  });
});
