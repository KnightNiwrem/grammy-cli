export interface TemplateInfo {
  readonly name: string;
  readonly description: string;
  readonly plugins: readonly string[];
  readonly runtimes: readonly string[];
}

export const templates: TemplateInfo[] = [
  {
    name: "minimal-ts",
    description: "Minimal TypeScript bot with env config and lint/test tasks",
    plugins: [],
    runtimes: ["deno", "node", "bun"],
  },
  {
    name: "minimal-js",
    description: "Minimal JavaScript bot with JSDoc type hints",
    plugins: [],
    runtimes: ["deno", "node", "bun"],
  },
];
