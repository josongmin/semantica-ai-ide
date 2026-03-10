import { useCallback } from "react";
import { useStore } from "jotai";

import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";

import { writeToClipboard } from "../../../shared/lib";

/**
 * Hook to copy the entire conversation as markdown to the clipboard.
 */
export function useCopyConversation(): {
  copyAsMarkdown: () => Promise<void>;
} {
  const store = useStore();

  const copyAsMarkdown = useCallback(() => {
    const msgIds = store.get(messageOrderAtom);
    const lines: string[] = [];

    for (const id of msgIds) {
      const msg = store.get(messageAtomFamily(id));
      if (!msg || !msg.text) continue;

      let role: string;
      if (msg.role === "user") role = "**You**";
      else if (msg.role === "system") role = "**System**";
      else role = "**Agent**";
      lines.push(`${role}:\n${msg.text}\n`);
    }

    if (lines.length === 0) return Promise.resolve();

    const markdown = lines.join("\n---\n\n");
    return writeToClipboard(markdown);
  }, [store]);

  return { copyAsMarkdown };
}
