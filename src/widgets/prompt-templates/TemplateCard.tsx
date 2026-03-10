import React, { useCallback } from "react";

import type { PromptTemplate } from "../../shared/protocol";
import { Badge, Button, cn, Icon, Text } from "../../shared/ui";

interface TemplateCardProps {
  readonly template: PromptTemplate;
  readonly onApply: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export const TemplateCard = React.memo(function TemplateCard({
  template,
  onApply,
  onDelete,
}: TemplateCardProps) {
  const handleApply = useCallback(() => onApply(template.id), [template.id, onApply]);
  const handleDelete = useCallback(() => onDelete(template.id), [template.id, onDelete]);

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 px-3 py-2 rounded",
        "border border-vsc-panel-border hover:border-vsc-focusBorder/50",
        "transition-colors duration-fast",
      )}
      data-testid={`template-card-${template.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Text size="xs" weight="medium" className="truncate min-w-0">
            {template.name}
          </Text>
          {template.category && <Badge variant="info" text={template.category} />}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            data-testid={`template-delete-${template.id}`}
          >
            <Icon name="trash" tokenSize="sm" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            data-testid={`template-use-${template.id}`}
          >
            Use
          </Button>
        </div>
      </div>
      <Text size="xs" tone="secondary" className="line-clamp-2">
        {template.description}
      </Text>
      {template.created_by && (
        <Text size="xs" tone="tertiary">
          by {template.created_by}
        </Text>
      )}
    </div>
  );
});
