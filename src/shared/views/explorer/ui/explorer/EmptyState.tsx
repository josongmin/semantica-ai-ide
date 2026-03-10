import { memo } from "react";

import { Icon, Text } from "~shared/ui";

export const EmptyState = memo(function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2.5">
      <Icon name={icon} size={24} className="text-vsc-text-ghost/60" />
      <Text size="xs" tone="tertiary" className="opacity-60">
        {message}
      </Text>
    </div>
  );
});
