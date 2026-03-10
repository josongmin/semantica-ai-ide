import { atom } from "jotai";

import type { SurfaceId } from "../../protocol/types/ui";

/** Active surface routing atom — shared across app and surfaces layers. */
export const activeSurfaceAtom = atom<SurfaceId>("chat");
