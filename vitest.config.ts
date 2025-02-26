import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["./tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["node_modules/", "dist/", "tests/", "**/*.d.ts"],
    },
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
