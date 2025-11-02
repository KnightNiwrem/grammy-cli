import { Logger } from "../utils/index.ts";

export interface ListCommandOptions {
  readonly logger: Logger;
  readonly json?: boolean;
}

interface TemplateInfo {
  readonly name: string;
  readonly description: string;
  readonly plugins: readonly string[];
  readonly runtimes: readonly string[];
}

async function loadTemplates(): Promise<TemplateInfo[]> {
  try {
    const module = await import("../../templates/index.ts");
    return module.templates ?? [];
  } catch {
    return [];
  }
}

function formatTable(templates: TemplateInfo[]): string {
  if (templates.length === 0) {
    return "No templates available.";
  }

  const lines: string[] = [];
  lines.push("Available Templates:\n");

  for (const template of templates) {
    lines.push(`  ${template.name}`);
    lines.push(`    Description: ${template.description}`);
    lines.push(`    Runtimes: ${template.runtimes.join(", ")}`);
    if (template.plugins.length > 0) {
      lines.push(`    Plugins: ${template.plugins.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function listCommand(options: ListCommandOptions): Promise<void> {
  const { logger, json } = options;

  logger.debug("Loading templates");
  const templates = await loadTemplates();
  logger.debug(`Found ${templates.length} templates`);

  if (json) {
    console.log(JSON.stringify(templates, null, 2));
  } else {
    console.log(formatTable(templates));
  }
}
