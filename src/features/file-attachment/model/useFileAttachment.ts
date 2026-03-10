import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  addAttachmentAtom,
  clearAttachmentsAtom,
  pendingAttachmentsAtom,
  projectFilesAtom,
  removeAttachmentAtom,
} from "../../../shared/lib";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { Attachment } from "../../../shared/protocol";

export function useFileAttachment(): {
  attachments: readonly Attachment[];
  projectFiles: readonly string[];
  addFile: (filePath: string) => void;
  removeFile: (path: string) => void;
  clearAll: () => void;
  requestProjectFiles: () => void;
  pasteImage: (dataUrl: string, name: string) => void;
} {
  const attachments = useAtomValue(pendingAttachmentsAtom);
  const projectFiles = useAtomValue(projectFilesAtom);
  const addAttachment = useSetAtom(addAttachmentAtom);
  const removeAttachment = useSetAtom(removeAttachmentAtom);
  const clearAttachments = useSetAtom(clearAttachmentsAtom);

  const addFile = useCallback(
    (filePath: string) => {
      const name = filePath.split("/").pop() ?? filePath;
      addAttachment({ type: "file", name, path: filePath });
    },
    [addAttachment],
  );

  const removeFile = useCallback(
    (path: string) => {
      removeAttachment(path);
    },
    [removeAttachment],
  );

  const clearAll = useCallback(() => {
    clearAttachments();
  }, [clearAttachments]);

  const requestProjectFiles = useCallback(() => {
    getVscodeApi().postMessage({ type: "REQUEST_PROJECT_FILES" });
  }, []);

  const pasteImage = useCallback(
    (dataUrl: string, name: string) => {
      getVscodeApi().postMessage({ type: "PASTE_IMAGE", data_url: dataUrl, name });
      addAttachment({ type: "image", name, path: `[image] ${name}`, data_url: dataUrl });
    },
    [addAttachment],
  );

  return {
    attachments,
    projectFiles,
    addFile,
    removeFile,
    clearAll,
    requestProjectFiles,
    pasteImage,
  };
}
