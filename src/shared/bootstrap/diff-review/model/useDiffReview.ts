import { useCallback } from "react";
import { useSetAtom } from "jotai";

import { setFileApprovalAtom } from "~entities/diff";
import { getVscodeApi } from "~shared/lib";
import type { ApprovalStatus } from "~shared/protocol";

/**
 * Hook for reviewing file changes (accept/reject per file or all).
 */
export function useDiffReview(): {
  approve: (turnId: string, filePath: string) => void;
  reject: (turnId: string, filePath: string) => void;
  approveAll: (turnId: string, filePaths: string[]) => void;
  rejectAll: (turnId: string, filePaths: string[]) => void;
  openInEditor: (filePath: string, line?: number, column?: number) => void;
  setApprovalStatus: (turnId: string, filePath: string, status: ApprovalStatus) => void;
} {
  const setApproval = useSetAtom(setFileApprovalAtom);

  const approve = useCallback(
    (turnId: string, filePath: string) => {
      setApproval({ turn_id: turnId, file_path: filePath, status: "accepted" });
      getVscodeApi().postMessage({
        type: "DIFF_APPROVE",
        turn_id: turnId,
        file_path: filePath,
      });
    },
    [setApproval],
  );

  const reject = useCallback(
    (turnId: string, filePath: string) => {
      setApproval({ turn_id: turnId, file_path: filePath, status: "rejected" });
      getVscodeApi().postMessage({
        type: "DIFF_REJECT",
        turn_id: turnId,
        file_path: filePath,
      });
    },
    [setApproval],
  );

  const approveAll = useCallback(
    (turnId: string, filePaths: string[]) => {
      for (const fp of filePaths) {
        setApproval({ turn_id: turnId, file_path: fp, status: "accepted" });
      }
      getVscodeApi().postMessage({
        type: "DIFF_APPROVE_ALL",
        turn_id: turnId,
        file_paths: filePaths,
      });
    },
    [setApproval],
  );

  const rejectAll = useCallback(
    (turnId: string, filePaths: string[]) => {
      for (const fp of filePaths) {
        setApproval({ turn_id: turnId, file_path: fp, status: "rejected" });
      }
      getVscodeApi().postMessage({
        type: "DIFF_REJECT_ALL",
        turn_id: turnId,
        file_paths: filePaths,
      });
    },
    [setApproval],
  );

  const openInEditor = useCallback((filePath: string, line?: number, column?: number) => {
    getVscodeApi().postMessage({
      type: "OPEN_FILE",
      file_path: filePath,
      ...(line !== undefined && { line }),
      ...(column !== undefined && { column }),
    });
  }, []);

  const setApprovalStatus = useCallback(
    (turnId: string, filePath: string, status: ApprovalStatus) => {
      setApproval({ turn_id: turnId, file_path: filePath, status });
    },
    [setApproval],
  );

  return { approve, reject, approveAll, rejectAll, openInEditor, setApprovalStatus };
}
