import { Command } from "commander";
import { createLogger } from "../utils/logger.ts";

export interface TemplateManifest {
  name: string;
  description: string;
  plugins: string[];
  runtime: string[];
  path: string;
}

function loadTemplateManifests(): TemplateManifest[] {
  // Stub implementation for Phase 1 - this will be expanded in Phase 2
  return [
    {
      name: "minimal-ts",
      description: "Minimal grammY bot with TypeScript",
      plugins: [],
      runtime: ["deno", "node", "bun"],
      path: "templates/minimal-ts",
    },
    {
      name: "minimal-js",
      description: "Minimal grammY bot with JavaScript",
      plugins: [],
      runtime: ["deno", "node", "bun"],
      path: "templates/minimal-js",
    },
    {
      name: "advanced",
      description: "Advanced bot with conversations and plugins",
      plugins: ["@grammyjs/conversations", "@grammyjs/menu", "@grammyjs/ratelimiter"],
      runtime: ["deno", "node", "bun"],
      path: "templates/advanced",
    },
  ];
}

function formatTemplateList(templates: TemplateManifest[]): string {
  if (templates.length === 0) {
    return "No templates available.";
  }

  const maxWidth = Math.max(
    ...templates.map((t) => t.name.length),
    15,
  );

  const header = `${"Template Name".padEnd(maxWidth)}  ${"Description".padEnd(40)}  ${
    "Runtime".padEnd(12)
  }  ${"Plugins"}`;
  const separator = "-".repeat(header.length);

  const rows = templates.map((template) => {
    const name = template.name.padEnd(maxWidth);
    const description = template.description.padEnd(40);
    const runtime = template.runtime.join(", ").padEnd(12);
    const plugins = template.plugins.length > 0 ? template.plugins.join(", ") : "none";
    return `${name}  ${description}  ${runtime}  ${plugins}`;
  });

  return [header, separator, ...rows].join("\n");
}

export const listCommand = new Command("list")
  .description("List available templates")
  .option("--json", "output templates in JSON format", false)
  .action((options) => {
    const logger = createLogger();

    try {
      const templates = loadTemplateManifests();

      if (options.json) {
        console.log(JSON.stringify(templates, null, 2));
      } else {
        console.log(formatTemplateList(templates));
      }

      logger.debug(`Listed ${templates.length} templates`);
    } catch (error) {
      logger.error(
        `Failed to list templates: ${error instanceof Error ? error.message : String(error)}`,
      );
      Deno.exit(1);
    }
  });
