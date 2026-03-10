/**
 * Barrel Export Gate — ensures every FSD barrel (index.ts) resolves at import time.
 *
 * happy-dom + vitest can catch this class of bug that vite build also catches:
 * a barrel re-exports a symbol that doesn't exist in the source module.
 * Since tsc with `isolatedModules` or SWC won't always flag re-export
 * mismatches, this gate catches them at module evaluation time.
 *
 * How it works:
 * 1. Collects every index.ts under src/ (excluding __tests__, node_modules)
 * 2. Dynamic-imports each barrel
 * 3. Asserts no import throws
 *
 * If a barrel is broken (missing re-export, circular dep, runtime error),
 * the specific barrel path appears in the failure message.
 */
import fs from "node:fs";
import path from "node:path";

// ─── Helpers ─────────────────────────────────────────────

function collectBarrels(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip dirs that are not FSD barrels or cause heavy side-effects
      if (["__tests__", "node_modules", "mocks", "dev"].includes(entry.name)) continue;
      result.push(...collectBarrels(full));
    } else if (entry.name === "index.ts") {
      result.push(full);
    }
  }
  return result;
}

const srcRoot = path.resolve(__dirname, "../../src");
const barrels = collectBarrels(srcRoot).filter(
  // Exclude app root barrel — bootstraps React, too heavy for unit import
  (b) => !b.endsWith("src/app/index.ts"),
);

// Convert absolute path to relative import path for error messages
function toRelative(abs: string): string {
  return path.relative(srcRoot, abs);
}

// ─── Tests ───────────────────────────────────────────────

describe("Barrel export gate — all index.ts files resolve", () => {
  it("discovered at least 50 barrels", () => {
    expect(barrels.length).toBeGreaterThanOrEqual(50);
  });

  // Dynamic import each barrel — if it throws, the barrel is broken
  it.each(barrels.map((b) => [toRelative(b), b]))(
    "%s imports without error",
    async (_label, barrelPath) => {
      // vi.importActual bypasses mocks and evaluates the real module
      await expect(vi.importActual(barrelPath)).resolves.toBeDefined();
    },
  );
});
