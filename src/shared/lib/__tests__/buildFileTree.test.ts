import { buildFileTree, filterTree, flattenTree } from "../buildFileTree";

/** Helper to safely access an array element in tests, throwing if undefined */
function at<T>(arr: readonly T[], index: number): T {
  const item = arr[index];
  if (item === undefined) {
    throw new Error(`Expected element at index ${index} but got undefined`);
  }
  return item;
}

describe("buildFileTree", () => {
  it("returns empty array for empty input", () => {
    expect(buildFileTree([])).toEqual([]);
  });

  it("builds a flat list of files with no directories", () => {
    const result = buildFileTree(["a.ts", "b.ts"]);
    expect(result).toHaveLength(2);
    expect(at(result, 0).name).toBe("a.ts");
    expect(at(result, 0).isFolder).toBe(false);
    expect(at(result, 1).name).toBe("b.ts");
    expect(at(result, 1).isFolder).toBe(false);
  });

  it("creates nested folder structure", () => {
    const result = buildFileTree(["src/app/App.tsx", "src/app/index.ts", "src/lib/utils.ts"]);

    expect(result).toHaveLength(1); // 'src' folder
    const src = at(result, 0);
    expect(src.name).toBe("src");
    expect(src.isFolder).toBe(true);
    expect(src.children).toHaveLength(2); // 'app' and 'lib' folders

    const appFolder = src.children.find((n) => n.name === "app");
    expect(appFolder).toBeDefined();
    if (appFolder === undefined) return;
    expect(appFolder.isFolder).toBe(true);
    expect(appFolder.children).toHaveLength(2);
  });

  it("sorts folders before files, both alphabetically", () => {
    const result = buildFileTree(["z.ts", "a.ts", "src/b.ts", "lib/a.ts"]);

    // Folders first: lib, src, then files: a.ts, z.ts
    expect(at(result, 0).name).toBe("lib");
    expect(at(result, 0).isFolder).toBe(true);
    expect(at(result, 1).name).toBe("src");
    expect(at(result, 1).isFolder).toBe(true);
    expect(at(result, 2).name).toBe("a.ts");
    expect(at(result, 2).isFolder).toBe(false);
    expect(at(result, 3).name).toBe("z.ts");
    expect(at(result, 3).isFolder).toBe(false);
  });

  it("handles deeply nested paths", () => {
    const result = buildFileTree(["a/b/c/d/e.ts"]);
    expect(result).toHaveLength(1);
    expect(at(result, 0).name).toBe("a");
    let node = at(result, 0);
    const names = ["a", "b", "c", "d"];
    for (const name of names) {
      expect(node.name).toBe(name);
      expect(node.isFolder).toBe(true);
      const firstChild = node.children[0];
      if (firstChild?.isFolder) {
        node = firstChild;
      }
    }
    // The leaf
    const leaf = at(at(at(at(at(result, 0).children, 0).children, 0).children, 0).children, 0);
    expect(leaf.name).toBe("e.ts");
    expect(leaf.isFolder).toBe(false);
  });

  it("sets correct path property for each node", () => {
    const result = buildFileTree(["src/lib/utils.ts"]);
    const src = at(result, 0);
    expect(src.path).toBe("src");
    const lib = at(src.children, 0);
    expect(lib.path).toBe("src/lib");
    const utils = at(lib.children, 0);
    expect(utils.path).toBe("src/lib/utils.ts");
  });

  it("handles backslash paths (Windows)", () => {
    const result = buildFileTree(["src\\app\\App.tsx"]);
    const src = at(result, 0);
    expect(src.name).toBe("src");
    const app = at(src.children, 0);
    expect(app.name).toBe("app");
    const appTsx = at(app.children, 0);
    expect(appTsx.name).toBe("App.tsx");
  });

  it("deduplicates shared parent folders", () => {
    const result = buildFileTree(["src/a.ts", "src/b.ts"]);
    expect(result).toHaveLength(1);
    const src = at(result, 0);
    expect(src.name).toBe("src");
    expect(src.children).toHaveLength(2);
  });
});

describe("flattenTree", () => {
  it("returns empty for empty tree", () => {
    expect(flattenTree([], new Set())).toEqual([]);
  });

  it("flattens only root nodes when nothing expanded", () => {
    const tree = buildFileTree(["src/a.ts", "src/b.ts", "root.ts"]);
    const flat = flattenTree(tree, new Set());
    // Only the src folder and root.ts should be visible
    expect(flat).toHaveLength(2);
    expect(at(flat, 0).node.name).toBe("src");
    expect(at(flat, 0).depth).toBe(0);
    expect(at(flat, 1).node.name).toBe("root.ts");
    expect(at(flat, 1).depth).toBe(0);
  });

  it("shows children when folder is expanded", () => {
    const tree = buildFileTree(["src/a.ts", "src/b.ts"]);
    const flat = flattenTree(tree, new Set(["src"]));
    expect(flat).toHaveLength(3); // src + a.ts + b.ts
    expect(at(flat, 0).node.name).toBe("src");
    expect(at(flat, 0).depth).toBe(0);
    expect(at(flat, 1).node.name).toBe("a.ts");
    expect(at(flat, 1).depth).toBe(1);
    expect(at(flat, 2).node.name).toBe("b.ts");
    expect(at(flat, 2).depth).toBe(1);
  });

  it("handles deeply nested expanded paths", () => {
    const tree = buildFileTree(["a/b/c.ts"]);
    const flat = flattenTree(tree, new Set(["a", "a/b"]));
    expect(flat).toHaveLength(3); // a, b, c.ts
    expect(at(flat, 0).depth).toBe(0);
    expect(at(flat, 1).depth).toBe(1);
    expect(at(flat, 2).depth).toBe(2);
  });
});

describe("filterTree", () => {
  it("returns full tree when query is empty", () => {
    const tree = buildFileTree(["src/a.ts"]);
    expect(filterTree(tree, "")).toEqual(tree);
    expect(filterTree(tree, "  ")).toEqual(tree);
  });

  it("filters files by name", () => {
    const tree = buildFileTree(["src/app.ts", "src/utils.ts", "lib/other.ts"]);
    const filtered = filterTree(tree, "app");

    // Should keep src folder with only app.ts
    expect(filtered).toHaveLength(1);
    const src = at(filtered, 0);
    expect(src.name).toBe("src");
    expect(src.children).toHaveLength(1);
    expect(at(src.children, 0).name).toBe("app.ts");
  });

  it("is case-insensitive", () => {
    const tree = buildFileTree(["src/App.tsx"]);
    const filtered = filterTree(tree, "app");
    expect(filtered).toHaveLength(1);
    expect(at(at(filtered, 0).children, 0).name).toBe("App.tsx");
  });

  it("matches on full path", () => {
    const tree = buildFileTree(["src/lib/utils.ts", "test/lib/helpers.ts"]);
    const filtered = filterTree(tree, "lib/utils");
    expect(filtered).toHaveLength(1); // only src
    expect(at(filtered, 0).name).toBe("src");
  });

  it("returns empty when nothing matches", () => {
    const tree = buildFileTree(["src/app.ts"]);
    const filtered = filterTree(tree, "zzz");
    expect(filtered).toHaveLength(0);
  });

  it("preserves parent folders for matching files", () => {
    const tree = buildFileTree(["a/b/c/target.ts", "a/b/other.ts"]);
    const filtered = filterTree(tree, "target");
    expect(filtered).toHaveLength(1);
    const a = at(filtered, 0);
    expect(a.name).toBe("a");
    const b = at(a.children, 0);
    expect(b.name).toBe("b");
    const c = at(b.children, 0);
    expect(c.name).toBe("c");
    const target = at(c.children, 0);
    expect(target.name).toBe("target.ts");
  });
});
