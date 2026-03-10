import { useCallback, useEffect, useState } from "react";

import { useSessionShare } from "../../../features/session-share";
import { writeToClipboard } from "../../../shared/lib";

interface ExpiryOption {
  readonly label: string;
  readonly hours: number | null;
}

export const EXPIRY_OPTIONS: readonly ExpiryOption[] = [
  { label: "1 hour", hours: 1 },
  { label: "24 hours", hours: 24 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
  { label: "Never", hours: null },
];

/**
 * Encapsulates SessionShareDialog local state: expiry selection,
 * secret masking toggle, link generation, and clipboard copy.
 */
export function useSessionShareState() {
  const { shareSession, dialogOpen, closeDialog, currentLink, sessionId } = useSessionShare();

  const [selectedExpiryIdx, setSelectedExpiryIdx] = useState(1); // default: 24h
  const [maskSecrets, setMaskSecrets] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    const expiry = EXPIRY_OPTIONS[selectedExpiryIdx];
    if (expiry === undefined) return;
    setGenerating(true);
    shareSession(sessionId, {
      expires_in_hours: expiry.hours ?? undefined,
      mask_secrets: maskSecrets,
    });
  }, [shareSession, sessionId, selectedExpiryIdx, maskSecrets]);

  const handleCopy = useCallback(async () => {
    if (!currentLink) return;
    await writeToClipboard(currentLink.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentLink]);

  // Clear generating state when link arrives
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear generating flag when share link arrives
    if (currentLink) setGenerating(false);
  }, [currentLink]);

  return {
    dialogOpen,
    closeDialog,
    currentLink,
    selectedExpiryIdx,
    setSelectedExpiryIdx,
    maskSecrets,
    setMaskSecrets,
    copied,
    generating,
    handleGenerate,
    handleCopy,
  } as const;
}
