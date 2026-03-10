import React from "react";

/** Mini theme preview — shows bg, fg, button, accent as a gradient bar + label. */
export const ThemePreview = React.memo(function ThemePreview({
  colors,
}: {
  colors: Readonly<Record<string, string>>;
}) {
  const bg = colors["--color-vsc-bg"];
  const fg = colors["--color-vsc-fg"];
  const btn = colors["--color-vsc-button"];
  const accent = colors["--color-vsc-accent"];
  const surface = colors["--color-vsc-surface-1"] ?? bg;

  return (
    <div className="rounded overflow-hidden border border-vsc-fg/10" style={{ backgroundColor: bg }}>
      {/* Mini mockup: header bar + content area */}
      <div className="flex items-center gap-2 px-2 py-2" style={{ backgroundColor: surface }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: btn }} />
        <span className="flex-1 h-1 rounded-full opacity-40" style={{ backgroundColor: fg }} />
      </div>
      <div className="px-2 py-2 space-y-2">
        <span className="block w-3/4 h-1 rounded-full opacity-25" style={{ backgroundColor: fg }} />
        <span className="block w-1/2 h-1 rounded-full opacity-15" style={{ backgroundColor: fg }} />
        <div className="flex gap-2">
          <span className="h-1.5 w-6 rounded-sm" style={{ backgroundColor: btn }} />
          <span className="h-1.5 w-4 rounded-sm opacity-50" style={{ backgroundColor: accent }} />
        </div>
        {/* Syntax color swatches */}
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors["--color-vsc-keyword"] }} title="keyword" />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors["--color-vsc-success"] }} title="string" />
          <span className="w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: fg }} title="comment" />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors["--color-vsc-warning"] }} title="number" />
        </div>
      </div>
    </div>
  );
});
