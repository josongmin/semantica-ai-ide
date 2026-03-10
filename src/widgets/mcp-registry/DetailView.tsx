import React, { useCallback } from "react";

import type { McpRegistryEntry } from "../../shared/protocol";
import { Badge, Button, Icon, Text } from "../../shared/ui";
import { formatInstallCount } from "./formatInstallCount";
import { StarRating } from "./StarRating";

interface DetailViewProps {
  entry: McpRegistryEntry;
  onBack: () => void;
  onToggleInstall: (id: string) => void;
}

export const DetailView = React.memo(function DetailView({
  entry,
  onBack,
  onToggleInstall,
}: DetailViewProps) {
  const handleInstall = useCallback(() => {
    onToggleInstall(entry.id);
  }, [entry.id, onToggleInstall]);

  return (
    <div className="flex flex-col gap-3" data-testid="mcp-registry-detail">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-vsc-text-secondary hover:text-vsc-text-primary transition-colors duration-fast cursor-pointer focus-ring"
        aria-label="Back to registry list"
      >
        <Icon name="arrow-left" tokenSize="2xs" />
        <Text size="xs">Back to registry</Text>
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Text size="lg" weight="medium">
            {entry.name}
          </Text>
          <Text size="xs" tone="tertiary">
            by {entry.author}
          </Text>
        </div>
        <Button variant={entry.installed ? "ghost" : "primary"} size="sm" onClick={handleInstall}>
          <Icon
            name={entry.installed ? "check" : "cloud-download"}
            tokenSize="2xs"
            className="mr-1"
          />
          {entry.installed ? "Installed" : "Install"}
        </Button>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 flex-wrap">
        <StarRating rating={entry.rating} />
        <Text size="2xs" tone="ghost">
          {formatInstallCount(entry.install_count)} installs
        </Text>
        <Text size="2xs" tone="ghost">
          Compatibility: {entry.compatibility}
        </Text>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {entry.categories.map((cat) => (
          <Badge key={cat} text={cat} />
        ))}
      </div>

      {/* Description (README preview) */}
      <div className="p-3 rounded-md border border-vsc-border bg-vsc-bg-secondary">
        <Text size="xs" className="whitespace-pre-wrap">
          {entry.description}
        </Text>
      </div>
    </div>
  );
});
