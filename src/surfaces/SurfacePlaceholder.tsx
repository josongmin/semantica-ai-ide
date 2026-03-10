import React from "react";

import { Icon } from "~shared/ui";

export interface SurfacePlaceholderProps {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

export const SurfacePlaceholder = React.memo(function SurfacePlaceholder({
  title,
  description,
  icon,
}: SurfacePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-vsc-text-tertiary">
      <Icon name={icon} size={32} className="opacity-30" />
      <h2 className="text-sm font-medium text-vsc-fg">{title}</h2>
      <p className="text-xs max-w-[320px] text-center leading-relaxed">{description}</p>
    </div>
  );
});
