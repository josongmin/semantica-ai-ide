import React from "react";
import { useAtomValue } from "jotai";

import { authStatusAtom } from "~features/auth-status";
import { quotaStatusAtom } from "~features/quota-status";
import { Badge, Icon, ProgressBar, StatusDot, Text } from "~shared/ui";

export const AccountSection = React.memo(function AccountSection() {
  const auth = useAtomValue(authStatusAtom);
  const quota = useAtomValue(quotaStatusAtom);

  let authState: "success" | "paused" | "error" | "idle";
  if (auth.state === "authenticated") {
    authState = "success";
  } else if (auth.state === "expired") {
    authState = "paused";
  } else if (auth.state === "error") {
    authState = "error";
  } else {
    authState = "idle";
  }

  return (
    <div className="px-6 py-6 space-y-4">
      {/* ── Auth ── */}
      <div className="space-y-3">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Authentication
        </Text>

        <div className="rounded-xl bg-vsc-surface-1 border border-vsc-border overflow-hidden">
          <div className="flex items-center gap-3 p-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-vsc-surface-3">
              <Icon name="account" tokenSize="sm" className="text-vsc-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <StatusDot status={authState} size="sm" />
                <Text size="xs" weight="medium" tone="primary" className="capitalize">
                  {auth.state}
                </Text>
                {auth.provider && <Badge variant="default" text={auth.provider} />}
              </div>
              {auth.user_email && (
                <Text size="2xs" tone="tertiary" truncate className="mt-0.5">
                  {auth.user_email}
                </Text>
              )}
            </div>
          </div>
          {auth.error_message && (
            <div className="px-3 pb-3">
              <Text size="2xs" tone="error">
                {auth.error_message}
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* ── Billing ── */}
      <div className="space-y-3">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Usage & billing
        </Text>

        <div className="rounded-xl bg-vsc-surface-1 border border-vsc-border overflow-hidden">
          <div className="p-3 space-y-4">
            {/* Alert Level */}
            <div className="flex items-center justify-between">
              <Text size="xs" tone="secondary">Status</Text>
              <Badge
                variant={
                  (() => {
                    if (quota.alert_level === "critical") return "error" as const;
                    if (quota.alert_level === "warning") return "warning" as const;
                    return "success" as const;
                  })()
                }
                text={quota.alert_level}
              />
            </div>

            {/* Budget info */}
            {quota.budget_usd !== undefined && quota.spent_usd !== undefined && (
              <div className="space-y-2">
                <ProgressBar
                  value={quota.spent_usd}
                  max={quota.budget_usd}
                  barClassName={
                    (() => {
                      if (quota.alert_level === "critical") return "bg-vsc-error";
                      if (quota.alert_level === "warning") return "bg-vsc-warning";
                      return "bg-vsc-success";
                    })()
                  }
                />
                <div className="flex items-center justify-between">
                  <Text size="2xs" tone="tertiary">
                    Spent
                  </Text>
                  <Text size="xs" weight="medium" tone="primary" mono>
                    ${quota.spent_usd.toFixed(2)}
                    <Text size="2xs" tone="ghost" as="span"> / ${quota.budget_usd.toFixed(2)}</Text>
                  </Text>
                </div>
                {quota.remaining_usd !== undefined && (
                  <div className="flex items-center justify-between">
                    <Text size="2xs" tone="tertiary">Remaining</Text>
                    <Text size="xs" weight="medium" tone="success" mono>
                      ${quota.remaining_usd.toFixed(2)}
                    </Text>
                  </div>
                )}
              </div>
            )}

            {quota.message && (
              <Text size="2xs" tone="ghost">{quota.message}</Text>
            )}

            {quota.budget_usd === undefined && quota.spent_usd === undefined && (
              <div className="flex items-center gap-2 py-2">
                <Icon name="info" tokenSize="xs" className="text-vsc-text-ghost" />
                <Text size="2xs" tone="ghost">
                  No billing data available yet.
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
