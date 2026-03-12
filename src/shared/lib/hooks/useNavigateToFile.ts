import { useCallback } from "react";
import { atom, useSetAtom } from "jotai";

import { navigateAtom } from "../../../app/shell/model/surfaceLifecycleAtoms";

import { openFileInEditorAtom } from "~domains/editor/editorAtoms";

/**
 * Atom that holds a pending scroll-to line number.
 * Set when navigating to a file:line; consumed by the editor surface
 * to scroll to the target line after the file is opened.
 */
export const pendingScrollLineAtom = atom<number | null>(null);

/**
 * Shared cross-feature hook that navigates to a file (and optional line)
 * in the editor surface.
 *
 * Usage:
 * ```ts
 * const navigateToFile = useNavigateToFile();
 * navigateToFile("src/foo.ts", 42);
 * ```
 */
export function useNavigateToFile() {
  const openFile = useSetAtom(openFileInEditorAtom);
  const navigate = useSetAtom(navigateAtom);
  const setPendingLine = useSetAtom(pendingScrollLineAtom);

  return useCallback(
    (filePath: string, line?: number) => {
      openFile(filePath);
      navigate({ surfaceId: "code" });
      setPendingLine(line ?? null);
    },
    [openFile, navigate, setPendingLine],
  );
}
