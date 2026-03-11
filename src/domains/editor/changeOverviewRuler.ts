import type { Extension } from "@codemirror/state";
import { type EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";

// ── Types ──────────────────────────────────────────────

interface ChangedRange {
  fromLine: number;
  toLine: number;
  kind: "modified" | "added";
}

// ── Diff helper ────────────────────────────────────────

/**
 * Very lightweight line diff: compare original vs current line arrays,
 * returns ranges of changed/added lines in the current document.
 */
function diffLines(original: string[], current: string[]): ChangedRange[] {
  const ranges: ChangedRange[] = [];
  const maxLen = Math.max(original.length, current.length);

  let i = 0;
  while (i < maxLen) {
    if (i >= original.length) {
      // Lines added beyond original length
      const start = i;
      while (i < current.length) i++;
      ranges.push({ fromLine: start + 1, toLine: i, kind: "added" });
    } else if (i >= current.length) {
      break;
    } else if (original[i] !== current[i]) {
      const start = i;
      while (
        i < maxLen &&
        i < current.length &&
        (i >= original.length || original[i] !== current[i])
      ) {
        i++;
      }
      const kind = i > original.length ? "added" : "modified";
      ranges.push({ fromLine: start + 1, toLine: Math.min(i, current.length), kind });
    } else {
      i++;
    }
  }
  return ranges;
}

// ── Overview ruler element ─────────────────────────────

const RULER_WIDTH = 6;
const MIN_MARK_HEIGHT = 2;

function createRulerElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "cm-change-ruler";
  Object.assign(el.style, {
    position: "absolute",
    top: "0",
    right: "0",
    width: `${RULER_WIDTH}px`,
    height: "100%",
    pointerEvents: "none",
    zIndex: "5",
  });
  return el;
}

function renderMarks(
  ruler: HTMLDivElement,
  ranges: ChangedRange[],
  totalLines: number,
  colors: { modified: string; added: string },
) {
  ruler.innerHTML = "";
  if (totalLines === 0) return;

  for (const range of ranges) {
    const top = ((range.fromLine - 1) / totalLines) * 100;
    const height = Math.max(
      ((range.toLine - range.fromLine + 1) / totalLines) * 100,
      (MIN_MARK_HEIGHT / ruler.clientHeight) * 100,
    );

    const mark = document.createElement("div");
    Object.assign(mark.style, {
      position: "absolute",
      top: `${top}%`,
      height: `${height}%`,
      left: "1px",
      right: "1px",
      borderRadius: "1px",
      backgroundColor: range.kind === "added" ? colors.added : colors.modified,
    });
    ruler.appendChild(mark);
  }
}

// ── CodeMirror extension ───────────────────────────────

/**
 * Creates a scrollbar overview ruler that shows colored marks for changed/added lines.
 *
 * @param originalValue - The original file content to diff against
 * @param colors - Optional override colors for modified/added marks
 */
export function changeOverviewRuler(
  originalValue: string,
  colors: { modified?: string; added?: string } = {},
): Extension {
  const originalLines = originalValue.split("\n");
  const resolvedColors = {
    modified: colors.modified ?? "rgba(30, 139, 195, 0.6)",
    added: colors.added ?? "rgba(72, 186, 120, 0.6)",
  };

  return ViewPlugin.fromClass(
    class {
      ruler: HTMLDivElement;
      ranges: ChangedRange[] = [];

      constructor(view: EditorView) {
        this.ruler = createRulerElement();
        view.scrollDOM.style.position = "relative";
        view.scrollDOM.appendChild(this.ruler);
        this.compute(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.compute(update.view);
        }
      }

      compute(view: EditorView) {
        const currentLines = view.state.doc.toString().split("\n");
        this.ranges = diffLines(originalLines, currentLines);
        renderMarks(this.ruler, this.ranges, currentLines.length, resolvedColors);
      }

      destroy() {
        this.ruler.remove();
      }
    },
  );
}
