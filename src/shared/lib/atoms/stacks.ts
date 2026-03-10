/**
 * Sub-barrel: Overlay / Toast / Progress stacks.
 *
 * Usage: import { pushOverlayAtom, pushToastAtom } from "~shared/lib/atoms/stacks"
 */

// Overlay stack
export type { OverlayEntry, OverlayId, OverlayType } from "./overlayAtoms";
export {
  overlayStackAtom,
  popOverlayAtom,
  pushOverlayAtom,
  resetOverlayAtomsAtom,
  topOverlayAtom,
} from "./overlayAtoms";

// Toast stack
export type { ToastData, ToastVariant } from "./toastAtoms";
export {
  dismissToastAtom,
  pushToastAtom,
  resetToastAtomsAtom,
  toastStackAtom,
} from "./toastAtoms";

// Progress tracking
export type { ProgressItem } from "./progressAtoms";
export {
  progressItemFamily,
  progressKeysAtom,
  removeProgressAtom,
  resetProgressStoreAtom,
  setProgressAtom,
} from "./progressAtoms";
