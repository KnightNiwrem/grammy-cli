import { Logger } from "../utils/index.ts";
import type { TemplateInfo } from "../../templates/index.ts";

export interface ListCommandOptions {
  readonly logger: Logger;
  readonly json?: boolean;
  readonly loader?: () => Promise<TemplateInfo[]>;
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
