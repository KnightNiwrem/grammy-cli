import { Command } from "commander";
import { createLogger } from "../utils/logger.ts";
import { createPromptHandler, type PromptOptions } from "../utils/prompts.ts";

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
  .option("--interactive", "interactive template selection", false)
  .action(async (options, command) => {
    const logger = createLogger();

    // Get global options from parent command
    const globalOpts = command.parent?.opts() || {};
    const promptOptions: PromptOptions = {
      interactive: options.interactive && globalOpts.interactive !== false,
    };
    const prompts = createPromptHandler(promptOptions);

    try {
      const templates = loadTemplateManifests();

      if (options.json) {
        console.log(JSON.stringify(templates, null, 2));
      } else if (options.interactive && promptOptions.interactive) {
        // Interactive mode: let user select a template
        console.log("Available templates:\n");
        console.log(formatTemplateList(templates));

        const selectedTemplate = await prompts.select(
          "Select a template to learn more about",
          templates.map((t) => ({ name: `${t.name} - ${t.description}`, value: t.name })),
        );

        const template = templates.find((t) => t.name === selectedTemplate);
        if (template) {
          console.log(`\nTemplate: ${template.name}`);
          console.log(`Description: ${template.description}`);
          console.log(`Runtime support: ${template.runtime.join(", ")}`);
          console.log(
            `Plugins: ${template.plugins.length > 0 ? template.plugins.join(", ") : "none"}`,
          );
        }
      } else {
        console.log(formatTemplateList(templates));
      }

      logger.debug(`Listed ${templates.length} templates`);
    } catch (error) {
      logger.error(
        `Failed to list templates: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (error instanceof Error && error.name === "ExitPromptError") {
        // User cancelled with Ctrl+C
        Deno.exit(130);
      } else {
        Deno.exit(1);
      }
    }
  });
