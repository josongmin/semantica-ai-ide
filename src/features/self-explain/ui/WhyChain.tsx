/**
 * WhyChain — Visual cascading "why" chain showing the reasoning
 * behind a symbol's existence.
 */

import React from "react";

import { cn, Text } from "~shared/ui";

interface WhyChainProps {
  chain: readonly string[];
  className?: string;
}

export const WhyChain = React.memo(function WhyChain({ chain, className }: WhyChainProps) {
  if (chain.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {chain.map((step, i) => {
        const isRoot = i === chain.length - 1;
        return (
          <div
            key={`step-${step.slice(0, 20)}`}
            className="flex items-start gap-1.5"
            style={{ paddingLeft: `${i * 12}px` }}
          >
            <Text
              size="xs"
              className={cn(
                "leading-relaxed",
                isRoot
                  ? "font-medium text-vsc-accent"
                  : "text-vsc-text-secondary",
              )}
            >
              {step}
            </Text>
          </div>
        );
      })}
    </div>
  );
});
