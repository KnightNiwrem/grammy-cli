import { assertEquals, assertStringIncludes } from "@std/assert";
import { createLogger } from "../utils/index.ts";
import { listCommand } from "./list.ts";

const quietLogger = createLogger({ level: "debug", sink: () => {} });

Deno.test("listCommand formats templates in table view", async () => {
  let output = "";
  await listCommand({
    logger: quietLogger,
    loader: () =>
      Promise.resolve([
        {
          name: "minimal-ts",
          description: "Minimal TypeScript bot with env config and lint/test tasks",
          plugins: [],
          runtimes: ["deno", "node", "bun"],
          files: [{ path: "bot.ts.eta" }],
        },
        {
          name: "minimal-js",
          description: "Minimal JavaScript bot with JSDoc type hints",
          plugins: ["menu"],
          runtimes: ["deno", "node"],
          files: [{ path: "bot.js.eta" }],
        },
      ]),
    writer: (value) => {
      output = value;
    },
  });

  assertStringIncludes(output, "Available Templates:");
  assertStringIncludes(output, "Template");
  assertStringIncludes(output, "minimal-ts");
  assertStringIncludes(output, "minimal-js");
  assertStringIncludes(output, "menu");
});

Deno.test("listCommand emits templates as JSON when requested", async () => {
  let output = "";
  await listCommand({
    logger: quietLogger,
    json: true,
    loader: () =>
      Promise.resolve([
        {
          name: "minimal-ts",
          description: "Example",
          plugins: [],
          runtimes: ["deno"],
          files: [{ path: "bot.ts.eta" }],
        },
      ]),
    writer: (value) => {
      output = value;
    },
  });

  assertStringIncludes(output, "minimal-ts");
  assertStringIncludes(output, '"runtimes":');
});

Deno.test("listCommand reports when no templates are available", async () => {
  let output = "";
  await listCommand({
    logger: quietLogger,
    loader: () => Promise.resolve([]),
    writer: (value) => {
      output = value;
    },
  });

  assertEquals(output, "No templates available.");
});
