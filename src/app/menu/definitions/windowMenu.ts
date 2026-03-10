import type { MenuGroupDef } from "../types";

export function buildWindowMenu(): MenuGroupDef {
  return {
    id: "window",
    label: "Window",
    items: [
      // Tauri bridge에서 OS 기본 항목(Minimize, Zoom, Fullscreen) 추가
      // JS 정의에서는 커스텀 항목만 선언
      { kind: "separator" },
    ],
  };
}
