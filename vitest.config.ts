import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
    "server-only": fileURLToPath(new URL("./tests/server-only.ts", import.meta.url)),
  } },
  // .tsx is included so component tests can render the primitives as JSX rather
  // than through React.createElement, which cannot pass required children.
  test: { include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"], environment: "node" },
});
