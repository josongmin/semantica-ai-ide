import React from "react";

import { Icon } from "~shared/ui";

interface InspectorSection {
  readonly label: string;
  readonly icon: string;
}

const SECTIONS: InspectorSection[] = [
  { label: "Files", icon: "files" },
  { label: "Symbols", icon: "symbol-class" },
  { label: "Tests", icon: "beaker" },
  { label: "Constraints", icon: "lock" },
];

export const ContextInspector = React.memo(function ContextInspector() {
  return (
    <div className="w-[240px] shrink-0 border-l border-vsc-border bg-vsc-surface-1 overflow-y-auto scroll-shadow" data-scroll-contain>
      <div className="flex items-center gap-1.5 px-3 h-8 border-b border-vsc-border shrink-0">
        <Icon name="inspect" tokenSize="2xs" className="text-vsc-text-tertiary" />
        <h3 className="text-xs font-semibold text-vsc-fg">Context Inspector</h3>
      </div>

      {SECTIONS.map((section) => (
        <div
          key={section.label}
          className="px-3 py-2.5 border-b border-vsc-border"
        >
          <div className="flex items-center gap-1.5 text-xs text-vsc-text-secondary">
            <Icon name={section.icon} tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
            <span>{section.label}</span>
          </div>
          <p className="text-2xs text-vsc-text-ghost mt-1 pl-5">
            No data
          </p>
        </div>
      ))}
    </div>
  );
});
