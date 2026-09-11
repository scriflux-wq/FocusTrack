import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    // Production runs on a UTC server while development runs in Europe/Madrid.
    // Pinning the host zone to UTC here keeps the date tests honest: formatting
    // that silently used the host offset passed locally and broke in production.
    env: { TZ: "UTC" },
  },
});
