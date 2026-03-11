import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { ptyDevServer } from "./dev/vite-plugin-pty";

export default defineConfig({
  plugins: [react(), tailwindcss(), ptyDevServer()],
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "jotai",
      "codemirror",
      "@codemirror/view",
      "@codemirror/state",
      "@codemirror/language",
      "react-markdown",
      "remark-gfm",
      "rehype-highlight",
      "highlight.js",
      "mermaid",
      "@xterm/xterm",
      "@xterm/addon-fit",
      "@xterm/addon-search",
    ],
    exclude: ["node-pty", "ws"],
  },
  server: {
    watch: {
      ignored: ["**/node_modules/**", "**/dist/**", "**/src-tauri/**", "**/.git/**"],
    },
    warmup: {
      clientFiles: ["./index.html", "./src/main.tsx", "./src/app/App.tsx"],
    },
  },
  resolve: {
    alias: {
      "@vscode/codicons": path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "node_modules/@vscode/codicons"
      ),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "~entities": fileURLToPath(new URL("./src/shared/entities", import.meta.url)),
      "~features": fileURLToPath(new URL("./src/features", import.meta.url)),
      "~widgets": fileURLToPath(new URL("./src/widgets", import.meta.url)),
      "~pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
      "~app": fileURLToPath(new URL("./src/app", import.meta.url)),
      "~surfaces": fileURLToPath(new URL("./src/surfaces", import.meta.url)),
      "~domains": fileURLToPath(new URL("./src/domains", import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          markdown: ["react-markdown", "remark-gfm", "rehype-highlight", "highlight.js"],
          codemirror: ["codemirror", "@codemirror/view", "@codemirror/state", "@codemirror/language", "@codemirror/commands"],
          mermaid: ["mermaid"],
          xterm: ["@xterm/xterm", "@xterm/addon-fit"],
        },
      },
    },
  },
});
