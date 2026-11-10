import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" lanza error fuera de React Server Components; en tests lo neutralizamos.
      "server-only": path.resolve(__dirname, "src/test/empty.ts"),
    },
  },
  test: { environment: "node" },
});
