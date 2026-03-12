import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { isScopeViolationAtom } from "~shared/bootstrap/scope-guard";

import { Button, InlineBanner, Text } from "../../shared/ui";

interface ScopeViolationBannerProps {
  readonly filePath: string;
  readonly onAllow?: () => void;
  readonly onDeny?: () => void;
}

/**
 * Warning banner shown when a file change is outside the scope guard rules.
 * Provides "Allow" and "Deny" actions for the user to override.
 */
export const ScopeViolationBanner = React.memo(function ScopeViolationBanner({
  filePath,
  onAllow,
  onDeny,
}: ScopeViolationBannerProps) {
  const isViolation = useAtomValue(isScopeViolationAtom(filePath));

  const handleAllow = useCallback(() => {
    onAllow?.();
  }, [onAllow]);

  const handleDeny = useCallback(() => {
    onDeny?.();
  }, [onDeny]);

  if (!isViolation) return null;

  return (
    <InlineBanner
      variant="warning"
      icon="shield"
      bordered
      actions={
        <>
          {onAllow && (
            <Button variant="ghost" size="sm" onClick={handleAllow}>
              Allow
            </Button>
          )}
          {onDeny && (
            <Button variant="ghost" size="sm" onClick={handleDeny}>
              Deny
            </Button>
          )}
        </>
      }
    >
      <Text size="xs">This file is outside the allowed scope.</Text>
    </InlineBanner>
  );
});
