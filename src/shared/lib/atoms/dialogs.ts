/**
 * Sub-barrel: Dialog & modal visibility atoms.
 *
 * Usage: import { mcpRegistryOpenAtom } from "~shared/lib/atoms/dialogs"
 */

export {
  activityFeedVisibleAtom,
  codeBlockPickerOpenAtom,
  commitGenDialogOpenAtom,
  conversationSearchOpenAtom,
  demoModalOpenAtom,
  keyboardShortcutsOpenAtom,
  mcpRegistryOpenAtom,
  modeGalleryOpenAtom,
  playbookMarketOpenAtom,
  rewindPanelOpenAtom,
} from "./dialogAtoms";

// Feature sheet (mutex bottom-sheet controller)
export type { FeatureSheetId } from "./featureSheetAtoms";
export { activeFeatureSheetAtom, toggleFeatureSheetAtom } from "./featureSheetAtoms";
