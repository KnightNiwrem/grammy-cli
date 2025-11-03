import { Logger } from "../utils/index.ts";
import { loadTemplateCatalog } from "../template/loader.ts";
import type { TemplateManifest } from "../template/types.ts";

export interface ListCommandOptions {
  readonly logger: Logger;
  readonly json?: boolean;
  readonly loader?: () => Promise<TemplateManifest[]>;
  readonly writer?: (message: string) => void;
}

interface ConsoleLike {
  readonly log?: (...args: unknown[]) => void;
}

function writeLine(logger: Logger, message = ""): void {
  const consoleLike = (globalThis as { console?: ConsoleLike }).console;
  if (typeof consoleLike?.log === "function") {
    consoleLike.log(message);
  } else {
    logger.info(message);
  }
}

async function loadTemplates(): Promise<TemplateManifest[]> {
  try {
    const catalog = await loadTemplateCatalog();
    return catalog.map((entry) => entry.manifest);
  } catch {
    return [];
  }
}

function formatTable(templates: TemplateManifest[]): string {
  if (templates.length === 0) {
    return "No templates available.";
  }

  const header = ["Template", "Description", "Runtimes", "Plugins"];
  const rows = templates.map((template) => [
    template.name,
    template.description,
    template.runtimes.join(", "),
    template.plugins.length > 0 ? template.plugins.join(", ") : "—",
  ]);

  const matrix = [header, ...rows];
  const widths = header.map((_, index) =>
    Math.max(...matrix.map((row) => row[index]?.length ?? 0))
  );

  const separator = widths.map((width) => "-".repeat(width)).join("  ");

  const formatRow = (row: readonly string[]) =>
    row.map((cell, index) => cell.padEnd(widths[index])).join("  ");

  const lines: string[] = [];
  lines.push("Available Templates:\n");
  lines.push(formatRow(header));
  lines.push(separator);
  for (const row of rows) {
    lines.push(formatRow(row));
  }

  return lines.join("\n");
}

export async function listCommand(options: ListCommandOptions): Promise<void> {
  const { logger, json } = options;
  const loader = options.loader ?? loadTemplates;
  const writer = options.writer ?? ((message: string) => writeLine(logger, message));

  logger.debug("Loading templates");
  const templates = await loader();
  logger.debug(`Found ${templates.length} templates`);

  if (json) {
    writer(JSON.stringify(templates, null, 2));
  } else {
    writer(formatTable(templates));
  }
}
