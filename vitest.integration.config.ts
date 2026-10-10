import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Full-stack tests: the real backend (server/) driven by the real frontend
 * API code. Requires `npm install --prefix server`.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["integration/**/*.test.ts"],
    testTimeout: 20_000,
  },
});
