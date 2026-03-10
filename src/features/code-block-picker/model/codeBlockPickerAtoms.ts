/** Whether the code block picker dialog is open — canonical atom lives in shared/lib/atoms/dialogAtoms */
export { codeBlockPickerOpenAtom } from "../../../shared/lib/atoms/dialogAtoms";

/** Extracted code block from messages */
export interface CodeBlockEntry {
  readonly id: string;
  readonly messageId: string;
  readonly language: string;
  readonly code: string;
  readonly lineCount: number;
  readonly preview: string;
}

/** Regex for fenced code blocks in markdown */
const FENCED_CODE_RE = /```(\w*)\n([\s\S]*?)```/g;

/** Extract all code blocks from a markdown string */
export function extractCodeBlocks(messageId: string, text: string): CodeBlockEntry[] {
  const blocks: CodeBlockEntry[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;

  // Reset regex state
  FENCED_CODE_RE.lastIndex = 0;

  while ((match = FENCED_CODE_RE.exec(text)) !== null) {
    const lang = match[1] ?? "text";
    const code = (match[2] ?? "").trimEnd();
    const lines = code.split("\n");
    blocks.push({
      id: `${messageId}-cb-${idx}`,
      messageId,
      language: lang,
      code,
      lineCount: lines.length,
      preview: lines.slice(0, 3).join("\n"),
    });
    idx++;
  }

  return blocks;
}
