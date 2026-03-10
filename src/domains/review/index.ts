import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "review",
  label: "Review",
  icon: "shield",
  persistence: "session",
  priority: 30,
  component: lazy(() =>
    import("./ReviewSurface").then((m) => ({ default: m.ReviewSurface })),
  ),
});

export { EvidenceSidebar } from "./EvidenceSidebar";
export type { ReviewTab } from "./reviewAtoms";
export {
  activeReviewTabAtom,
  selectedPatchIdAtom,
} from "./reviewAtoms";
export { ReviewControls } from "./ReviewControls";
export { ReviewSurface } from "./ReviewSurface";
