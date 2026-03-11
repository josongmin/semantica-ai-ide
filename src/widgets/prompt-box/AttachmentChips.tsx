import React, { useCallback } from "react";

import type { Attachment } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";

export interface AttachmentChipsProps {
  attachments: readonly Attachment[];
  onRemove: (path: string) => void;
  className?: string;
}

export const AttachmentChips = React.memo(function AttachmentChips({
  attachments,
  onRemove,
  className,
}: AttachmentChipsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)} data-testid="attachment-chips">
      {attachments.map((att) => (
        <AttachmentChip key={att.path} attachment={att} onRemove={onRemove} />
      ))}
    </div>
  );
});

const AttachmentChip = React.memo(function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: (path: string) => void;
}) {
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove(attachment.path);
    },
    [attachment.path, onRemove],
  );

  // Image thumbnail card
  if (attachment.type === "image" && attachment.data_url) {
    return (
      <div
        className="relative group w-16 h-16 rounded-lg overflow-hidden border border-vsc-border bg-vsc-surface-2"
        data-testid={`attachment-chip-${attachment.name}`}
      >
        <img
          src={attachment.data_url}
          alt={attachment.name}
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove ${attachment.name}`}
          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-vsc-fg/60 text-vsc-bg
                     opacity-0 group-hover:opacity-100 cursor-pointer focus-ring"
        >
          <Icon name="x" tokenSize="xs" />
        </button>
      </div>
    );
  }

  // File / URL pill chip
  let iconName: string;
  if (attachment.type === "image") {
    iconName = "file-media";
  } else if (attachment.type === "url") {
    iconName = "link";
  } else {
    iconName = "file";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "bg-vsc-badge-bg text-vsc-badge-fg text-2xs",
        "border border-vsc-border",
      )}
      data-testid={`attachment-chip-${attachment.name}`}
    >
      <Icon name={iconName} tokenSize="xs" />
      <Text size="2xs" as="span" truncate className="max-w-[120px]" title={attachment.name}>
        {attachment.name}
      </Text>
      <button
        type="button"
        onClick={handleRemove}
        aria-label={`Remove ${attachment.name}`}
        className="p-0.5 rounded-full hover:bg-vsc-error/20 cursor-pointer focus-ring"
      >
        <Icon name="x" tokenSize="xs" className="text-vsc-text-tertiary hover:text-vsc-error" />
      </button>
    </span>
  );
});
