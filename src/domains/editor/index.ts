import { lazy } from "react";

import { registerSurface } from "~app/surfaceRegistry";

registerSurface({
  id: "editor",
  label: "Editor",
  icon: "edit",
  persistence: "session",
  priority: 20,
  component: lazy(() =>
    import("./EditorSurface").then((m) => ({ default: m.EditorSurface })),
  ),
});

export { DEMO_DEFAULT_FILE,DEMO_FILES } from "./demoFiles";
export type { EditorTab } from "./editorAtoms";
export {
  activeEditorTabAtom,
  activeFileContentAtom,
  activeFileLanguageAtom,
  activeTabAtom,
  closeEditorTabAtom,
  editorSplitModeAtom,
  editorTabsAtom,
  fileContentsAtom,
  inferLanguage,
  openFileInEditorAtom,
  updateFileContentAtom,
} from "./editorAtoms";
export { EditorSurface } from "./EditorSurface";
export { EditorTabBar } from "./EditorTabBar";
