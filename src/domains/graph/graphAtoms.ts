import { atom } from "jotai";

export type GraphLayout = "force" | "hierarchy" | "radial" | "grid";
export type GraphFilter = "all" | "functions" | "classes" | "modules" | "services";

export const graphLayoutAtom = atom<GraphLayout>("force");
export const graphFilterAtom = atom<GraphFilter>("all");
export const graphSearchAtom = atom("");
export const graphZoomAtom = atom(1);
export const selectedNodeIdAtom = atom<string | null>(null);
