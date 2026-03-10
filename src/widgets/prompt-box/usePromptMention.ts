import { useCallback, useLayoutEffect, useRef, useState } from "react";

interface UsePromptMentionOptions {
  addFile: (path: string) => void;
  requestProjectFiles: () => void;
  setText: (val: string) => void;
  textRef: React.RefObject<string>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function usePromptMention({
  addFile,
  requestProjectFiles,
  setText,
  textRef,
  textareaRef,
}: UsePromptMentionOptions) {
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionAnchorRect, setMentionAnchorRect] = useState<DOMRect | null>(null);
  const mentionOpenRef = useRef(mentionOpen);
  useLayoutEffect(() => { mentionOpenRef.current = mentionOpen; });

  const closeMention = useCallback(() => {
    setMentionOpen(false);
    setMentionQuery("");
  }, []);

  const handleMentionSelect = useCallback(
    (filePath: string) => {
      addFile(filePath);
      const current = textRef.current ?? "";
      const cursorPos = textareaRef.current?.selectionStart ?? current.length;
      const beforeCursor = current.slice(0, cursorPos);
      const atIndex = beforeCursor.lastIndexOf("@");
      if (atIndex !== -1) {
        const newText = current.slice(0, atIndex) + current.slice(cursorPos);
        setText(newText);
      }
      closeMention();
    },
    [addFile, closeMention, setText, textRef, textareaRef],
  );

  /** Call from handleInput to detect @mention triggers */
  const detectMention = useCallback(
    (val: string, el: HTMLTextAreaElement) => {
      const cursorPos = el.selectionStart;
      const beforeCursor = val.slice(0, cursorPos);
      const atMatch = /@([^\s]*)$/.exec(beforeCursor);
      if (atMatch) {
        setMentionQuery(atMatch[1] ?? "");
        setMentionAnchorRect(el.getBoundingClientRect());
        if (!mentionOpenRef.current) {
          requestProjectFiles();
          setMentionOpen(true);
        }
      } else if (mentionOpenRef.current) {
        closeMention();
      }
    },
    [requestProjectFiles, closeMention],
  );

  return {
    mentionOpen,
    mentionQuery,
    mentionAnchorRect,
    closeMention,
    handleMentionSelect,
    detectMention,
  };
}
