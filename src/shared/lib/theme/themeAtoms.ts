import { createStateAtomSet } from "~shared/lib";

import type { ThemeId } from "./themePresets";

export const [themeIdAtom, setThemeIdAtom, resetThemeIdAtom] =
  createStateAtomSet<ThemeId>("github-light");
