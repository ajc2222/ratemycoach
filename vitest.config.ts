import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globals: false,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // The repository modules import `server-only`, which has no meaning (and
      // no valid export) outside a Next build. Point it at a no-op for tests.
      "server-only": path.resolve(import.meta.dirname, "./tests/stubs/server-only.ts"),
    },
  },
});
