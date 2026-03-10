import { createStore } from "jotai";

import { upsertFileChangeAtom } from "~entities/diff";
import { turnOrderAtom } from "~entities/message/turns";
import { allWorkspaceFileChangesAtom } from "~shared/bootstrap/workspace-awareness";

import {
  buildFileTree,
  fileTreePanelVisibleAtom,
  filterTree,
  projectFilesAtom,
  setProjectFilesAtom,
} from "../../../shared/lib";
import { createFileChange } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
describe("FileTree integration", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe("panel visibility", () => {
    it("defaults to hidden", () => {
      expect(store.get(fileTreePanelVisibleAtom)).toBe(false);
    });

    it("can be toggled", () => {
      store.set(fileTreePanelVisibleAtom, true);
      expect(store.get(fileTreePanelVisibleAtom)).toBe(true);
    });
  });

  describe("project files tree building", () => {
    it("builds tree from project files atom", () => {
      store.set(setProjectFilesAtom, ["src/app.ts", "src/lib/utils.ts", "README.md"]);
      const files = store.get(projectFilesAtom);
      const tree = buildFileTree(files);

      expect(tree).toHaveLength(2); // src folder + README.md file
      const srcFolder = tree.find((n) => n.name === "src");
      expect(srcFolder).toBeDefined();
      expect(srcFolder!.isFolder).toBe(true);
    });
  });

  describe("file change status overlay", () => {
    it("workspace file changes reflect file change statuses", () => {
      const turnId = "turn_1" as TurnId;
      store.set(turnOrderAtom, [turnId]);

      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turnId, status: "modified" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/new.ts", turn_id: turnId, status: "added" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/old.ts", turn_id: turnId, status: "deleted" }),
      );

      const changes = store.get(allWorkspaceFileChangesAtom);
      const statusMap = new Map(changes.map((e) => [e.file_path, e.action]));

      expect(statusMap.get("src/app.ts")).toBe("modified");
      expect(statusMap.get("src/new.ts")).toBe("created");
      expect(statusMap.get("src/old.ts")).toBe("deleted");
    });
  });

  describe("filter integration", () => {
    it("filters project files tree", () => {
      const files = ["src/app.ts", "src/lib/utils.ts", "src/lib/helpers.ts", "README.md"];
      const tree = buildFileTree(files);
      const filtered = filterTree(tree, "utils");

      // Should contain src/lib/utils.ts only (with parent folders preserved)
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.name).toBe("src");
      const lib = filtered[0]?.children[0];
      if (lib === undefined) throw new Error("expected lib node");
      expect(lib.name).toBe("lib");
      expect(lib.children).toHaveLength(1);
      expect(lib.children[0]?.name).toBe("utils.ts");
    });
  });
});
