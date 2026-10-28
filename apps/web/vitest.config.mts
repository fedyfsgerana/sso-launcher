import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const DOM_TESTS = ["src/**/use-*.test.ts", "src/**/*.test.tsx"];

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "logic",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: [...configDefaults.exclude, ...DOM_TESTS],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: DOM_TESTS,
        },
      },
    ],
  },
});
