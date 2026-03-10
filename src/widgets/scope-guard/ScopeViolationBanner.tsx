import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { isScopeViolationAtom } from "~shared/bootstrap/scope-guard";

import { Button, Icon, Text } from "../../shared/ui";

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
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-vsc-warning/30 bg-vsc-warning/5"
      role="alert"
      data-testid="scope-violation-banner"
    >
      <Icon name="shield" tokenSize="sm" className="text-vsc-warning shrink-0" />
      <Text size="xs" className="flex-1">
        This file is outside the allowed scope.
      </Text>
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
    </div>
  );
});
