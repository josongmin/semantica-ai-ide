import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { useSlashCommand } from "~shared/bootstrap/slash-command";

import { historySearchOpenAtom, usePromptHistory } from "../../../features/prompt-history";
import { useArgCompletion } from "../../../features/slash-command-args";
import { clearPendingQuoteAtom, pendingQuoteAtom } from "../../../shared/lib";
import { usePromptMention } from "../usePromptMention";
import { useFileAttachments } from "./useFileAttachments";
import { usePromptSend } from "./usePromptSend";
import { useTextareaResize } from "./useTextareaResize";

/** Navigate prompt history on ArrowUp/Down, returns true if handled. */
function tryHistoryNav(
  dir: "up" | "down",
  e: React.KeyboardEvent,
  el: HTMLTextAreaElement | null,
  text: string,
  navigate: (d: "up" | "down", t: string) => string | null,
  setText: (v: string) => void,
): boolean {
  if (!el || e.shiftKey) return false;
  if (dir === "up" && !(el.selectionStart === 0 && el.selectionEnd === 0)) return false;
  if (dir === "down" && el.selectionStart !== el.value.length) return false;
  const result = navigate(dir, text);
  if (result === null) return false;
  e.preventDefault();
  setText(result);
  queueMicrotask(() => {
    el.selectionStart = el.selectionEnd = result.length;
  });
  return true;
}

/** Composition hook — combines all sub-hooks and wires them together. */
export function usePromptBoxLogic() {
  const promptHistory = usePromptHistory();
  const pendingQuote = useAtomValue(pendingQuoteAtom);
  const clearQuote = useSetAtom(clearPendingQuoteAtom);
  const setHistorySearchOpen = useSetAtom(historySearchOpenAtom);

  // handleOpenCommands → useTextareaResize bridged via stable ref
  const openCmdRef = useRef<() => void>();
  const textarea = useTextareaResize(() => openCmdRef.current?.());
  const fileCtx = useFileAttachments();

  const mention = usePromptMention({
    addFile: fileCtx.addFile,
    requestProjectFiles: fileCtx.requestProjectFiles,
    setText: textarea.setText,
    textRef: textarea.textRef,
    textareaRef: textarea.textareaRef,
  });

  const sendCtx = usePromptSend({
    text: textarea.text,
    setText: textarea.setText,
    textareaRef: textarea.textareaRef,
    resetTextareaHeight: textarea.resetTextareaHeight,
    attachments: fileCtx.attachments,
    clearAttachments: fileCtx.clearAttachments,
    pushHistory: promptHistory.push,
  });

  const slashCallbacks = useMemo(
    () => ({
      onSendMessage: (msg: string) => {
        const trimmed = msg.trim();
        if (!trimmed) return;
        if (sendCtx.isRunning) {
          sendCtx.enqueueMessage({ text: trimmed, attachments: [...fileCtx.attachments] });
        } else {
          sendCtx.send?.(trimmed);
        }
      },
      onClearText: () => {
        textarea.setText("");
        textarea.resetTextareaHeight();
      },
      onGetText: () => textarea.textRef.current,
    }),
    [sendCtx, fileCtx.attachments, textarea],
  );

  const slashCmd = useSlashCommand(slashCallbacks);

  const selectedCommandId = useMemo(() => {
    if (!slashCmd.isOpen) return null;
    const flat = slashCmd.flatMatches;
    return flat.length === 0 ? null : (flat[slashCmd.selectedIndex]?.command.id ?? null);
  }, [slashCmd.isOpen, slashCmd.flatMatches, slashCmd.selectedIndex]);

  const argCompletion = useArgCompletion(selectedCommandId, slashCmd.query);
  const argHint = useMemo(() => {
    if (!argCompletion.hasArgs || !argCompletion.currentArg) return null;
    return {
      placeholder: argCompletion.currentArg.placeholder ?? argCompletion.currentArg.description,
      suggestions: argCompletion.suggestions,
    };
  }, [argCompletion]);

  const handleOpenCommands = useCallback(() => {
    if (slashCmd.isOpen) {
      textarea.setText("");
      slashCmd.close();
      textarea.textareaRef.current?.focus();
      return;
    }
    textarea.setText("/");
    textarea.textareaRef.current?.focus();
    queueMicrotask(() => slashCmd.handleTextChange("/"));
  }, [slashCmd, textarea]);

  useLayoutEffect(() => {
    openCmdRef.current = handleOpenCommands;
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (mention.mentionOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          mention.closeMention();
          return;
        }
        if (["ArrowDown", "ArrowUp", "Enter", "Tab"].includes(e.key)) return;
      }
      if (slashCmd.handleKeyDown(e)) return;
      const el = textarea.textareaRef.current;
      if (
        e.key === "ArrowUp" &&
        tryHistoryNav("up", e, el, textarea.text, promptHistory.navigate, textarea.setText)
      )
        return;
      if (
        e.key === "ArrowDown" &&
        tryHistoryNav("down", e, el, textarea.text, promptHistory.navigate, textarea.setText)
      )
        return;
      if (e.key === "r" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setHistorySearchOpen(true);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        sendCtx.handleSend();
      }
      if (e.key === "Escape" && sendCtx.isRunning) {
        e.preventDefault();
        sendCtx.handleStop();
      }
    },
    [mention, slashCmd, sendCtx, promptHistory, textarea, setHistorySearchOpen],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      textarea.setText(val);
      promptHistory.resetNavigation();
      textarea.resizeTextarea();
      slashCmd.handleTextChange(val);
      mention.detectMention(val, e.target);
    },
    [slashCmd, mention, promptHistory, textarea],
  );

  const activeDescendant = useMemo(() => {
    if (slashCmd.isOpen && slashCmd.flatMatches.length > 0)
      return `slash-cmd-${slashCmd.flatMatches[slashCmd.selectedIndex]?.command.id}`;
    return undefined;
  }, [slashCmd.isOpen, slashCmd.flatMatches, slashCmd.selectedIndex]);

  const handleHistorySelect = useCallback((t: string) => textarea.setText(t), [textarea]);

  return {
    text: textarea.text,
    isRunning: sendCtx.isRunning,
    pendingQuote,
    attachments: fileCtx.attachments,
    projectFiles: fileCtx.projectFiles,
    textareaRef: textarea.textareaRef,
    containerRef: textarea.containerRef,
    slashCmd,
    mention,
    dragDrop: fileCtx.dragDrop,
    activeDescendant,
    argHint,
    canSend: sendCtx.canSend,
    handleSend: sendCtx.handleSend,
    handleStop: sendCtx.handleStop,
    handleHistorySelect,
    handleOpenCommands,
    handleKeyDown,
    handleInput,
    handlePaste: fileCtx.handlePaste,
    clearQuote,
    removeFile: fileCtx.removeFile,
  };
}
