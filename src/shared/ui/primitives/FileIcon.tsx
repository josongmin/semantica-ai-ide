import React from "react";

import { cn } from "../variants";

// ─── Types ──────────────────────────────────────────────

interface FileIconProps {
  name: string;
  size?: number;
  className?: string;
}

// ─── Icon registry ──────────────────────────────────────
// Language-colored file icons — minimal, modern IDE style.

interface IconDef {
  /** Badge / accent color */
  color: string;
  /** 1–3 char label inside badge */
  label: string;
}

const ICONS: Readonly<Record<string, IconDef>> = {
  // ── Languages ─────────────────────────────
  ts: { color: "#3178c6", label: "TS" },
  tsx: { color: "#3178c6", label: "TX" },
  js: { color: "#f0db4f", label: "JS" },
  jsx: { color: "#61dafb", label: "JX" },
  mjs: { color: "#f0db4f", label: "MJ" },
  cjs: { color: "#f0db4f", label: "CJ" },
  py: { color: "#3776ab", label: "PY" },
  rs: { color: "#dea584", label: "RS" },
  go: { color: "#00add8", label: "GO" },
  c: { color: "#5c6bc0", label: "C" },
  cpp: { color: "#5c6bc0", label: "++" },
  h: { color: "#5c6bc0", label: ".h" },
  cs: { color: "#68217a", label: "C#" },
  java: { color: "#e76f00", label: "JA" },
  kt: { color: "#7f52ff", label: "KT" },
  rb: { color: "#cc342d", label: "RB" },
  php: { color: "#777bb4", label: "PH" },
  swift: { color: "#f05138", label: "SW" },
  dart: { color: "#0175c2", label: "DA" },
  lua: { color: "#000080", label: "LU" },
  r: { color: "#276dc3", label: "R" },
  zig: { color: "#f7a41d", label: "ZG" },
  ex: { color: "#6e4a7e", label: "EX" },
  exs: { color: "#6e4a7e", label: "EX" },
  erl: { color: "#a90533", label: "ER" },
  clj: { color: "#5881d8", label: "CJ" },

  // ── Web ───────────────────────────────────
  html: { color: "#e44d26", label: "HT" },
  css: { color: "#663399", label: "CS" },
  scss: { color: "#cd6799", label: "SC" },
  less: { color: "#1d365d", label: "LE" },
  vue: { color: "#41b883", label: "VU" },
  svelte: { color: "#ff3e00", label: "SV" },
  astro: { color: "#ff5d01", label: "AS" },

  // ── Data / Config ─────────────────────────
  json: { color: "#9e9e3c", label: "{}" },
  jsonc: { color: "#9e9e3c", label: "{}" },
  yaml: { color: "#cb171e", label: "YM" },
  yml: { color: "#cb171e", label: "YM" },
  toml: { color: "#9c4121", label: "TL" },
  xml: { color: "#e37933", label: "XM" },
  csv: { color: "#4caf50", label: "CV" },
  ini: { color: "#6d8086", label: "IN" },
  conf: { color: "#6d8086", label: "CF" },

  // ── Docs ──────────────────────────────────
  md: { color: "#519aba", label: "MD" },
  mdx: { color: "#519aba", label: "MX" },
  txt: { color: "#78909c", label: "TX" },
  pdf: { color: "#e53935", label: "PD" },
  rst: { color: "#78909c", label: "RS" },

  // ── Shell / Script ────────────────────────
  sh: { color: "#4eaa25", label: "SH" },
  bash: { color: "#4eaa25", label: "SH" },
  zsh: { color: "#4eaa25", label: "SH" },
  fish: { color: "#4eaa25", label: "SH" },
  ps1: { color: "#012456", label: "PS" },

  // ── Database / Query ──────────────────────
  sql: { color: "#e38c00", label: "SQ" },
  graphql: { color: "#e535ab", label: "GQ" },
  gql: { color: "#e535ab", label: "GQ" },
  prisma: { color: "#2d3748", label: "PR" },

  // ── Images ────────────────────────────────
  png: { color: "#a074c4", label: "PN" },
  jpg: { color: "#a074c4", label: "JP" },
  jpeg: { color: "#a074c4", label: "JP" },
  svg: { color: "#ffb13b", label: "SV" },
  gif: { color: "#a074c4", label: "GI" },
  webp: { color: "#a074c4", label: "WP" },
  ico: { color: "#a074c4", label: "IC" },
  avif: { color: "#a074c4", label: "AV" },

  // ── DevOps / Config ───────────────────────
  dockerfile: { color: "#2496ed", label: "DK" },
  gitignore: { color: "#f05032", label: "GI" },
  env: { color: "#c4a700", label: "EN" },
  lock: { color: "#6b7280", label: "LK" },
  wasm: { color: "#654ff0", label: "WA" },
  docker: { color: "#2496ed", label: "DK" },
  tf: { color: "#5c4ee5", label: "TF" },
  hcl: { color: "#5c4ee5", label: "HC" },
};

const SPECIAL_FILES: Readonly<Record<string, string>> = {
  dockerfile: "dockerfile",
  "docker-compose.yml": "docker",
  "docker-compose.yaml": "docker",
  ".gitignore": "gitignore",
  ".gitattributes": "gitignore",
  ".env": "env",
  ".env.local": "env",
  ".env.development": "env",
  ".env.production": "env",
  ".env.test": "env",
  "tsconfig.json": "ts",
  "jsconfig.json": "js",
  "package.json": "json",
  "pnpm-lock.yaml": "lock",
  "yarn.lock": "lock",
  "package-lock.json": "lock",
  "cargo.lock": "lock",
  "gemfile.lock": "lock",
  "bun.lockb": "lock",
  ".prettierrc": "json",
  ".eslintrc": "json",
  ".eslintrc.cjs": "js",
  ".eslintrc.js": "js",
  "eslint.config.js": "js",
  "eslint.config.mjs": "js",
  "vite.config.ts": "ts",
  "vite.config.js": "js",
  "tailwind.config.ts": "ts",
  "tailwind.config.js": "js",
  "next.config.js": "js",
  "next.config.mjs": "js",
  "jest.config.ts": "ts",
  "vitest.config.ts": "ts",
  "cargo.toml": "toml",
  "go.mod": "go",
  "go.sum": "lock",
  makefile: "sh",
  rakefile: "rb",
  gemfile: "rb",
  procfile: "sh",
  "readme.md": "md",
  license: "txt",
  "license.md": "md",
  "changelog.md": "md",
};

const DEFAULT_ICON: IconDef = { color: "#6b7280", label: "" };

function resolveIcon(name: string): IconDef {
  const lower = name.toLowerCase();
  const special = SPECIAL_FILES[lower];
  const specialIcon = special ? ICONS[special] : undefined;
  if (specialIcon) return specialIcon;
  if (lower.endsWith("-lock.json") || lower.endsWith(".lock")) {
    const lockIcon = ICONS.lock;
    return lockIcon ?? DEFAULT_ICON;
  }
  const ext = lower.split(".").pop() ?? "";
  return ICONS[ext] ?? DEFAULT_ICON;
}

// ─── Component ──────────────────────────────────────────

export const FileIcon = React.memo(function FileIcon({
  name,
  size = 16,
  className,
}: FileIconProps) {
  const icon = resolveIcon(name);
  const s = size;

  // Default file icon: minimal blank document
  if (!icon.label) {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 16 16"
        className={cn("shrink-0", className)}
        role="img"
        aria-label="File"
      >
        <rect x="3" y="1" width="10" height="14" rx="1.5" fill="#3a3d45" opacity=".25" />
        <rect
          x="3"
          y="1"
          width="10"
          height="14"
          rx="1.5"
          fill="none"
          stroke="#6b7280"
          strokeWidth=".4"
          opacity=".3"
        />
      </svg>
    );
  }

  // Minimal colored badge icon — no document outline, just the badge
  const badgeW = icon.label.length > 2 ? 16 : 14;
  const badgeH = 10;
  const badgeX = (16 - badgeW) / 2;
  const badgeY = (16 - badgeH) / 2;
  const fontSize = icon.label.length > 2 ? 5.5 : 6;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 16 16"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={icon.label}
    >
      {/* Colored pill badge */}
      <rect
        x={badgeX}
        y={badgeY}
        width={badgeW}
        height={badgeH}
        rx="2.5"
        fill={icon.color}
        opacity=".85"
      />
      <text
        x="8"
        y="8"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize={fontSize}
        fontWeight="700"
        fill="#fff"
        letterSpacing=".4"
      >
        {icon.label}
      </text>
    </svg>
  );
});

// ─── Folder icon ────────────────────────────────────────

// Special folder colors for well-known directory names
const FOLDER_COLORS: Readonly<Record<string, { closed: string; open: string }>> = {
  src: { closed: "#42a5f5", open: "#64b5f6" },
  lib: { closed: "#42a5f5", open: "#64b5f6" },
  app: { closed: "#42a5f5", open: "#64b5f6" },
  apps: { closed: "#42a5f5", open: "#64b5f6" },
  packages: { closed: "#42a5f5", open: "#64b5f6" },
  test: { closed: "#66bb6a", open: "#81c784" },
  tests: { closed: "#66bb6a", open: "#81c784" },
  __tests__: { closed: "#66bb6a", open: "#81c784" },
  spec: { closed: "#66bb6a", open: "#81c784" },
  e2e: { closed: "#66bb6a", open: "#81c784" },
  docs: { closed: "#7e57c2", open: "#9575cd" },
  doc: { closed: "#7e57c2", open: "#9575cd" },
  ".github": { closed: "#78909c", open: "#90a4ae" },
  ".vscode": { closed: "#0078d4", open: "#2196f3" },
  node_modules: { closed: "#546e7a", open: "#607d8b" },
  dist: { closed: "#8d6e63", open: "#a1887f" },
  build: { closed: "#8d6e63", open: "#a1887f" },
  out: { closed: "#8d6e63", open: "#a1887f" },
  public: { closed: "#66bb6a", open: "#81c784" },
  static: { closed: "#66bb6a", open: "#81c784" },
  assets: { closed: "#ffb74d", open: "#ffcc80" },
  images: { closed: "#ce93d8", open: "#e1bee7" },
  styles: { closed: "#ec407a", open: "#f48fb1" },
  components: { closed: "#42a5f5", open: "#64b5f6" },
  hooks: { closed: "#26a69a", open: "#4db6ac" },
  utils: { closed: "#78909c", open: "#90a4ae" },
  helpers: { closed: "#78909c", open: "#90a4ae" },
  config: { closed: "#78909c", open: "#90a4ae" },
  scripts: { closed: "#4eaa25", open: "#66bb6a" },
  types: { closed: "#3178c6", open: "#42a5f5" },
  model: { closed: "#ef5350", open: "#e57373" },
  models: { closed: "#ef5350", open: "#e57373" },
  features: { closed: "#ab47bc", open: "#ba68c8" },
  pages: { closed: "#42a5f5", open: "#64b5f6" },
  views: { closed: "#42a5f5", open: "#64b5f6" },
  ui: { closed: "#26c6da", open: "#4dd0e1" },
  api: { closed: "#ef6c00", open: "#ff9800" },
  routes: { closed: "#ef6c00", open: "#ff9800" },
  middleware: { closed: "#ffa726", open: "#ffb74d" },
  shared: { closed: "#78909c", open: "#90a4ae" },
  vendor: { closed: "#546e7a", open: "#607d8b" },
  surfaces: { closed: "#26c6da", open: "#4dd0e1" },
  frames: { closed: "#26c6da", open: "#4dd0e1" },
  widgets: { closed: "#ab47bc", open: "#ba68c8" },
  entities: { closed: "#ef5350", open: "#e57373" },
};

const DEFAULT_FOLDER_CLOSED = "#78909c";
const DEFAULT_FOLDER_OPEN = "#a0b4c0";

export const FolderIcon = React.memo(function FolderIcon({
  open,
  name,
  size = 16,
  className,
}: {
  open?: boolean;
  name?: string;
  size?: number;
  className?: string;
}) {
  const folderName = name?.toLowerCase() ?? "";
  const palette = FOLDER_COLORS[folderName];
  const color = open
    ? (palette?.open ?? DEFAULT_FOLDER_OPEN)
    : (palette?.closed ?? DEFAULT_FOLDER_CLOSED);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={open ? "Open folder" : "Folder"}
    >
      {open ? (
        <>
          {/* Back panel */}
          <path
            d="M1.5 3.5A1 1 0 012.5 2.5h3.2l1.3 1.5H13a1 1 0 011 1v7.5a1 1 0 01-1 1H2.5a1 1 0 01-1-1V3.5z"
            fill={color}
            opacity=".2"
          />
          {/* Open flap — clean modern shape */}
          <path
            d="M1.2 7h12.1a1 1 0 01.98 1.2l-.9 4.5a1 1 0 01-.98.8H2.6a1 1 0 01-.98-.8l-.9-4.5A1 1 0 011.2 7z"
            fill={color}
            opacity=".75"
          />
        </>
      ) : (
        /* Closed — flat, single-shape */
        <path
          d="M1.5 3A1 1 0 012.5 2h3.6l1.4 1.5H13a1 1 0 011 1V13a1 1 0 01-1 1H2.5a1 1 0 01-1-1V3z"
          fill={color}
          opacity=".6"
        />
      )}
    </svg>
  );
});
