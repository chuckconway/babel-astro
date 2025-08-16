import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    "import.meta.env.PUBLIC_SITE_URL": JSON.stringify("http://localhost:4321"),
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
  },
});
