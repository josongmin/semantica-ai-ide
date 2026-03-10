/**
 * Layout Lint Gate — static analysis of Tailwind classes to prevent
 * viewport-breaking patterns.
 *
 * happy-dom has no CSS layout engine (offsetWidth/scrollWidth = 0),
 * so layout overflow bugs are invisible in unit tests. This gate
 * scans .tsx source files for risky class patterns and fails if
 * viewport-safe guards are missing.
 *
 * Patterns detected:
 * 1. Fixed widths (w-XX where XX >= 48) without max-w viewport cap
 * 2. Fixed max-heights (max-h-XX or max-h-[Npx]) > 200px without vh cap
 * 3. Dialog/popover min-widths (min-w-[Npx]) > 280px without viewport cap
 */
import fs from "node:fs";
import path from "node:path";

// ─── Helpers ─────────────────────────────────────────────

function collectTsxFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith("__")) {
      result.push(...collectTsxFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      result.push(full);
    }
  }
  return result;
}

const root = path.resolve(__dirname, "../../src");
const widgetFiles = collectTsxFiles(path.join(root, "widgets"));
const pageFiles = fs.existsSync(path.join(root, "pages"))
  ? collectTsxFiles(path.join(root, "pages"))
  : [];
const allFiles = [...widgetFiles, ...pageFiles];

type Violation = { file: string; line: number; pattern: string; raw: string };

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const rel = path.relative(root, filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments and test files
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) continue;

    // Pattern 1: Fixed width w-XX (XX >= 48 = 192px) without max-w viewport guard
    // Matches: w-48, w-52, w-56, w-64, w-72, w-80, w-96
    const fixedWidthMatch = line.match(/\bw-(4[89]|[5-9]\d|\d{3,})\b/);
    if (fixedWidthMatch) {
      const hasVwGuard = /max-w-\[.*vw.*\]|max-w-\[calc\(100vw/.test(line);
      if (!hasVwGuard) {
        violations.push({
          file: rel,
          line: i + 1,
          pattern: "fixed-width-no-vw-cap",
          raw: fixedWidthMatch[0],
        });
      }
    }

    // Pattern 2: Fixed max-h > 200px without vh cap
    // max-h-XX where Tailwind XX maps to > 200px (max-h-52 = 208px, max-h-56, max-h-64, etc.)
    const fixedMaxHMatch = line.match(/\bmax-h-(5[2-9]|[6-9]\d|\d{3,})\b/);
    if (fixedMaxHMatch) {
      const hasVhGuard = /max-h-\[min\(/.test(line);
      if (!hasVhGuard) {
        violations.push({
          file: rel,
          line: i + 1,
          pattern: "fixed-max-height-no-vh-cap",
          raw: fixedMaxHMatch[0],
        });
      }
    }

    // Also check max-h-[Npx] where N > 200
    const fixedMaxHPxMatch = line.match(/max-h-\[(\d+)px\]/);
    if (fixedMaxHPxMatch && Number(fixedMaxHPxMatch[1]) > 200) {
      const hasVhGuard = /max-h-\[min\(/.test(line);
      if (!hasVhGuard) {
        violations.push({
          file: rel,
          line: i + 1,
          pattern: "fixed-max-height-px-no-vh-cap",
          raw: fixedMaxHPxMatch[0],
        });
      }
    }

    // Pattern 3: min-w-[Npx] where N > 280 without viewport cap
    const minWPxMatch = line.match(/min-w-\[(\d+)px\]/);
    if (minWPxMatch && Number(minWPxMatch[1]) > 280) {
      const hasVwGuard = /min-w-\[min\(/.test(line);
      if (!hasVwGuard) {
        violations.push({
          file: rel,
          line: i + 1,
          pattern: "dialog-min-width-no-vw-cap",
          raw: minWPxMatch[0],
        });
      }
    }
  }

  return violations;
}

// ─── Tests ───────────────────────────────────────────────

describe("Layout lint — viewport safety", () => {
  const allViolations: Violation[] = [];

  beforeAll(() => {
    for (const f of allFiles) {
      allViolations.push(...scanFile(f));
    }
  });

  it("no fixed widths (w-48+) without max-w viewport cap", () => {
    const hits = allViolations.filter((v) => v.pattern === "fixed-width-no-vw-cap");
    const msg = hits
      .map((h) => `  ${h.file}:${h.line} — ${h.raw}`)
      .join("\n");
    expect(hits, `Fixed-width violations (add max-w-[calc(100vw-Xrem)]):\n${msg}`).toHaveLength(0);
  });

  it("no fixed max-heights (> 200px) without vh cap", () => {
    const hits = allViolations.filter((v) => v.pattern.startsWith("fixed-max-height"));
    const msg = hits
      .map((h) => `  ${h.file}:${h.line} — ${h.raw}`)
      .join("\n");
    expect(hits, `Max-height violations (use max-h-[min(Xpx,Yvh)]):\n${msg}`).toHaveLength(0);
  });

  it("no dialog min-widths (> 280px) without viewport cap", () => {
    const hits = allViolations.filter((v) => v.pattern === "dialog-min-width-no-vw-cap");
    const msg = hits
      .map((h) => `  ${h.file}:${h.line} — ${h.raw}`)
      .join("\n");
    expect(hits, `Min-width violations (use min-w-[min(Xpx,calc(100vw-2rem))]):\n${msg}`).toHaveLength(0);
  });

  it("scanned at least 50 widget files", () => {
    expect(allFiles.length).toBeGreaterThanOrEqual(50);
  });
});
