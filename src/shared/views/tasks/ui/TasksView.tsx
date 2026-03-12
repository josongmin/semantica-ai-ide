import React from "react";

import { ViewEmptyState } from "~shared/ui";

export const TasksView = React.memo(function TasksView() {
  return <ViewEmptyState icon="tasklist" title="Tasks" />;
});
