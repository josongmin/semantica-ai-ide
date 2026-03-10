import React from "react";

export interface VisuallyHiddenProps {
  children: React.ReactNode;
}

export const VisuallyHidden = React.memo(function VisuallyHidden({
  children,
}: VisuallyHiddenProps) {
  return <span className="sr-only">{children}</span>;
});
