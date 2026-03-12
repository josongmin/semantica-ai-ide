import React from "react";

import { ViewEmptyState } from "~shared/ui";

export const LogView = React.memo(function LogView() {
  return <ViewEmptyState icon="output" title="Log" />;
});
