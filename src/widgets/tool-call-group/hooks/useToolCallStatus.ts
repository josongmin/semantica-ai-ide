import { useRef, useState } from "react";

import { useElapsedTime } from "../../../shared/lib/hooks/useElapsedTime";

interface ToolCallLike {
  status: string;
  category: string;
  result_summary?: string;
  args_summary?: string;
  duration_ms?: number;
}

export interface ToolCallStatusInfo {
  isRunning: boolean;
  isError: boolean;
  isSuccess: boolean;
  isAwaitingApproval: boolean;
  isDone: boolean;
  isTerminal: boolean;
  showFlash: boolean;
  contextText: string | undefined;
  elapsedTime: string | null;
  onFlashEnd: () => void;
}

/**
 * Derives display status, flash animation state, and elapsed time from a tool call.
 */
export function useToolCallStatus(tc: ToolCallLike | null | undefined): ToolCallStatusInfo {
  const isRunning = tc?.status === "running";
  const isError = tc?.status === "error";
  const isSuccess = tc?.status === "success";
  const isAwaitingApproval = tc?.status === "awaiting_approval";
  const isDone = isSuccess || isError;
  const isTerminal = tc?.category === "terminal";

  // Flash once on success — track previous status to avoid replaying on re-render
  const prevStatusRef = useRef(tc?.status);
  const [flashed, setFlashed] = useState(false);
  // eslint-disable-next-line react-hooks/refs -- reading ref during render is intentional for flash-once logic; prevStatus never triggers re-renders
  if (isSuccess && !flashed && prevStatusRef.current !== "success") {
    setFlashed(true);
  }
  // eslint-disable-next-line react-hooks/refs -- writing ref during render is intentional for flash-once logic
  prevStatusRef.current = tc?.status;
  const showFlash = isSuccess && flashed;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- tc narrowing through isDone boolean is not tracked by TS
  const contextText = isDone ? tc?.result_summary ?? tc?.args_summary : tc?.args_summary;

  const elapsedTime = useElapsedTime(isRunning);

  return {
    isRunning,
    isError,
    isSuccess,
    isAwaitingApproval,
    isDone,
    isTerminal,
    showFlash,
    contextText,
    elapsedTime,
    onFlashEnd: () => setFlashed(false),
  };
}
