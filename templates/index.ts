import type { TemplateManifest } from "../src/template/types.ts";

export const templates: TemplateManifest[] = [
  {
    name: "minimal-ts",
    description: "Minimal TypeScript bot with env config and lint/test tasks",
    plugins: [],
    runtimes: ["deno", "node", "bun"],
    files: [
      { path: "bot.ts.eta" },
    ],
  },
  {
    name: "minimal-js",
    description: "Minimal JavaScript bot with JSDoc type hints",
    plugins: [],
    runtimes: ["deno", "node", "bun"],
    files: [
      { path: "bot.js.eta" },
    ],
  },
];
