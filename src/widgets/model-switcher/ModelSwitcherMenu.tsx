import React, { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { useModelSwitcher } from "../../features/model-switcher";
import { Button, DropdownMenu, type DropdownMenuItem, Icon, Text } from "../../shared/ui";

export const ModelSwitcherMenu = React.memo(function ModelSwitcherMenu({
  className,
}: {
  className?: string;
}) {
  const { models, currentModelId, switchModel } = useModelSwitcher();
  const meta = useAtomValue(sessionMetaAtom);

  const items: DropdownMenuItem[] = useMemo(
    () =>
      models.map((m) => ({
        id: m.id,
        label: m.id === currentModelId ? `${m.label} \u2713` : m.label,
      })),
    [models, currentModelId],
  );

  const handleSelect = useCallback(
    (id: string) => {
      if (id !== currentModelId) {
        switchModel(id);
      }
    },
    [currentModelId, switchModel],
  );

  const currentLabel =
    models.find((m) => m.id === currentModelId)?.label ?? (meta.model_label || currentModelId);

  if (models.length === 0) {
    return (
      <Text size="3xs" tone="tertiary" className={className}>
        {currentLabel}
      </Text>
    );
  }

  return (
    <DropdownMenu
      items={items}
      onSelect={handleSelect}
      align="left"
      className={className}
      trigger={
        <Button
          variant="ghost"
          size="xs"
          className="gap-0.5 text-vsc-text-tertiary hover:text-vsc-text-secondary min-w-0"
          data-testid="model-switcher-trigger"
        >
          <Icon name="chip" tokenSize="3xs" />
          <Text size="3xs">{currentLabel}</Text>
          <Icon name="chevron-down" tokenSize="3xs" className="opacity-60" />
        </Button>
      }
    />
  );
});
