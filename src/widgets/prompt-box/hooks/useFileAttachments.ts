import { useCallback } from "react";

import { useFileAttachment } from "../../../features/file-attachment";
import { usePromptDragDrop } from "../usePromptDragDrop";

/**
 * Manages file attachment state, drag-drop handlers, paste-image,
 * and file removal.
 */
export function useFileAttachments() {
  const {
    attachments,
    projectFiles,
    addFile,
    removeFile,
    clearAll: clearAttachments,
    requestProjectFiles,
    pasteImage,
  } = useFileAttachment();

  // Drag & Drop (extracted hook)
  const dragDrop = usePromptDragDrop({ addFile, projectFiles });

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const name = file.name || `paste-${Date.now()}.png`;
            pasteImage(dataUrl, name);
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    },
    [pasteImage],
  );

  return {
    attachments,
    projectFiles,
    addFile,
    removeFile,
    clearAttachments,
    requestProjectFiles,
    pasteImage,
    dragDrop,
    handlePaste,
  };
}
