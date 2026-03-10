import React, { useCallback } from "react";

import type { McpRegistryEntry } from "../../shared/protocol";
import { Badge, Button, cn, Icon, Text } from "../../shared/ui";
import { formatInstallCount } from "./formatInstallCount";
import { StarRating } from "./StarRating";

interface ServerCardProps {
  entry: McpRegistryEntry;
  onToggleInstall: (id: string) => void;
  onSelect: (entry: McpRegistryEntry) => void;
}

export const ServerCard = React.memo(function ServerCard({
  entry,
  onToggleInstall,
  onSelect,
}: ServerCardProps) {
  const handleInstallClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleInstall(entry.id);
    },
    [entry.id, onToggleInstall],
  );

  const handleSelect = useCallback(() => {
    onSelect(entry);
  }, [entry, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(entry);
      }
    },
    [entry, onSelect],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 p-3 rounded-md",
        "border border-vsc-border bg-vsc-bg-secondary",
        "hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer focus-ring",
      )}
      data-testid={`mcp-server-card-${entry.id}`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${entry.name} by ${entry.author}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Text size="sm" weight="medium" truncate>
            {entry.name}
          </Text>
          <Text size="2xs" tone="tertiary">
            by {entry.author}
          </Text>
        </div>
        <Button
          variant={entry.installed ? "ghost" : "primary"}
          size="sm"
          onClick={handleInstallClick}
          aria-label={entry.installed ? `Uninstall ${entry.name}` : `Install ${entry.name}`}
        >
          <Icon
            name={entry.installed ? "check" : "cloud-download"}
            tokenSize="2xs"
            className="mr-1"
          />
          {entry.installed ? "Installed" : "Install"}
        </Button>
      </div>

      {/* Description */}
      <Text size="xs" tone="secondary" className="line-clamp-2">
        {entry.description}
      </Text>

      {/* Footer: rating + install count + categories */}
      <div className="flex items-center gap-2 flex-wrap">
        <StarRating rating={entry.rating} />
        <Text size="2xs" tone="ghost">
          {formatInstallCount(entry.install_count)} installs
        </Text>
        {entry.categories.slice(0, 3).map((cat) => (
          <Badge key={cat} text={cat} />
        ))}
      </div>
    </div>
  );
});
