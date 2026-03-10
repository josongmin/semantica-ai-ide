import React from "react";

const SettingsPage = React.lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.SettingsPage })),
);

export const SettingsSurface = React.memo(function SettingsSurface() {
  return (
    <React.Suspense fallback={null}>
      <SettingsPage />
    </React.Suspense>
  );
});
