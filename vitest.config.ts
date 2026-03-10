import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "~entities": fileURLToPath(new URL("./src/shared/entities", import.meta.url)),
      "~domains": fileURLToPath(new URL("./src/domains", import.meta.url)),
      "~surfaces": fileURLToPath(new URL("./src/surfaces", import.meta.url)),
      "~features": fileURLToPath(new URL("./src/features", import.meta.url)),
      "~widgets": fileURLToPath(new URL("./src/widgets", import.meta.url)),
      "~pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
      "~app": fileURLToPath(new URL("./src/app", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    passWithNoTests: true,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.*", "src/**/*.spec.*", "src/main.tsx"],
    },
  },
});
