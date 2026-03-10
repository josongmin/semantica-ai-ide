import React from "react";
import { useAtomValue } from "jotai";

import { webReferencesAtomFamily } from "../../entities/web-reference";
import { Badge, cn, Collapsible, Icon } from "../../shared/ui";

interface WebReferenceCardProps { turnId: string }

export const WebReferenceCard = React.memo(function WebReferenceCard({ turnId }: WebReferenceCardProps) {
  const refs = useAtomValue(webReferencesAtomFamily(turnId));
  if (refs.length === 0) return null;

  return (
    <Collapsible title="Web References" icon="globe" badge={`${refs.length}`} defaultCollapsed>
      <div className="px-2 py-1.5 flex flex-col gap-1.5">
        {refs.map((ref) => (
          <a
            key={ref.id}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "block p-2 rounded-md text-2xs",
              "bg-vsc-surface-2 border border-vsc-border/30",
              "hover:border-vsc-link/40 transition-colors duration-fast",
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon name="link-external" tokenSize="2xs" className="text-vsc-link" />
              <span className="text-vsc-link truncate min-w-0 font-medium" title={ref.title}>{ref.title}</span>
              <Badge text={ref.domain} variant="default" className="ml-auto shrink-0" />
            </div>
            <p className="mt-1 text-vsc-text-tertiary line-clamp-2">{ref.snippet}</p>
          </a>
        ))}
      </div>
    </Collapsible>
  );
});
