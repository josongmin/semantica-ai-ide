import { createStateAtomSet } from "~shared/lib";

/** Chat font family presets */
export type ChatFont =
  | "default"
  | "sans"
  | "system"
  | "dyslexic"
  | "jetbrains-mono"
  | "fira-code"
  | "ibm-plex"
  | "nunito"
  | "plus-jakarta"
  | "noto-sans-kr"
  | "outfit"
  | "manrope"
  | "source-serif"
  | "editor-default"
  | "panel-ui"
  | "roboto"
  | "arial"
  | "helvetica"
  | "verdana"
  | "tahoma"
  | "trebuchet";

export const CHAT_FONT_OPTIONS = [
  { id: "default" as const, label: "Georgia", fontFamily: "'Georgia', serif" },
  { id: "source-serif" as const, label: "Source Serif", fontFamily: "'Source Serif 4', Georgia, serif" },
  { id: "editor-default" as const, label: "Editor (Menlo/Monaco)", fontFamily: "Menlo, Monaco, 'Courier New', monospace" },
  { id: "panel-ui" as const, label: "Panel UI (SF Pro)", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif" },
  { id: "sans" as const, label: "Inter", fontFamily: "'Inter', 'Helvetica Neue', sans-serif" },
  { id: "roboto" as const, label: "Roboto", fontFamily: "'Roboto', sans-serif" },
  { id: "arial" as const, label: "Arial", fontFamily: "Arial, 'Helvetica Neue', sans-serif" },
  { id: "helvetica" as const, label: "Helvetica", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { id: "verdana" as const, label: "Verdana", fontFamily: "Verdana, Geneva, sans-serif" },
  { id: "tahoma" as const, label: "Tahoma", fontFamily: "Tahoma, Geneva, sans-serif" },
  { id: "trebuchet" as const, label: "Trebuchet MS", fontFamily: "'Trebuchet MS', 'Lucida Grande', sans-serif" },
  { id: "system" as const, label: "System", fontFamily: "system-ui, sans-serif" },
  { id: "jetbrains-mono" as const, label: "JetBrains Mono", fontFamily: "'JetBrains Mono', monospace" },
  { id: "fira-code" as const, label: "Fira Code", fontFamily: "'Fira Code', monospace" },
  { id: "ibm-plex" as const, label: "IBM Plex Sans", fontFamily: "'IBM Plex Sans', sans-serif" },
  { id: "nunito" as const, label: "Nunito", fontFamily: "'Nunito', sans-serif" },
  { id: "plus-jakarta" as const, label: "Plus Jakarta Sans", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  { id: "noto-sans-kr" as const, label: "Noto Sans KR", fontFamily: "'Noto Sans KR', sans-serif" },
  { id: "outfit" as const, label: "Outfit", fontFamily: "'Outfit', sans-serif" },
  { id: "manrope" as const, label: "Manrope", fontFamily: "'Manrope', sans-serif" },
  { id: "dyslexic" as const, label: "Dyslexic friendly", fontFamily: "'OpenDyslexic', 'Comic Sans MS', sans-serif" },
] as const;

export const [chatFontAtom, setChatFontAtom, resetChatFontAtom] =
  createStateAtomSet<ChatFont>("system");

/** Voice style presets */
export type VoiceStyle = "buttery" | "airy" | "mellow" | "glassy" | "rounded";

export const VOICE_STYLE_OPTIONS = [
  { id: "buttery" as const, label: "Buttery" },
  { id: "airy" as const, label: "Airy" },
  { id: "mellow" as const, label: "Mellow" },
  { id: "glassy" as const, label: "Glassy" },
  { id: "rounded" as const, label: "Rounded" },
] as const;

export const [voiceStyleAtom, setVoiceStyleAtom, resetVoiceStyleAtom] =
  createStateAtomSet<VoiceStyle>("buttery");
