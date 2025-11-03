import { ensureDir } from "@std/fs/ensure-dir";
import { walk } from "@std/fs/walk";
import { dirname } from "@std/path/dirname";
import { join } from "@std/path/join";
import { normalize } from "@std/path/normalize";
import { relative } from "@std/path/relative";
import { Eta, EtaError } from "eta";

interface EtaLike {
  renderAsync(templatePath: string, data: unknown, meta?: RenderMeta): Promise<unknown>;
  renderStringAsync(template: string, data: unknown, meta?: RenderMeta): Promise<unknown>;
  resolvePath?(templatePath: string, meta?: RenderMeta): string;
  configure(config: Record<string, unknown>): void;
  readFile(path: string): string;
  config: {
    views?: string;
    defaultExtension?: string;
  };
}

interface RenderMeta {
  filepath?: string;
}

export interface RenderTemplateOptions {
  /**
   * Absolute path to the directory containing Eta template files.
   */
  readonly templateRoot: string;
  /**
   * Absolute path to the output directory where rendered files will be emitted.
   */
  readonly destinationRoot: string;
  /**
   * Data object made available to templates under the default `it` binding.
   */
  readonly context?: Record<string, unknown>;
  /**
   * Directory names (relative to {@link templateRoot}) that should be treated as partial-only folders.
   * Files within these directories are available for includes but are not emitted to the destination.
   */
  readonly partialDirectories?: readonly string[];
  /**
   * Optional Eta instance for advanced customization (primarily used in testing).
   */
  readonly eta?: EtaLike;
}

export interface RenderTemplateResult {
  /** Relative file paths (from destination root) that were rendered from Eta templates. */
  readonly renderedFiles: readonly string[];
  /** Relative file paths (from destination root) that were copied without rendering. */
  readonly copiedFiles: readonly string[];
}

export class TemplateRendererError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "TemplateRendererError";
  }
}

const TEMPLATE_EXTENSION = ".eta";
const DEFAULT_PARTIAL_DIRECTORIES = ["_partials", "partials"] as const;

export async function renderTemplateDirectory(
  options: RenderTemplateOptions,
): Promise<RenderTemplateResult> {
  const templateRoot = normalizePath(options.templateRoot);
  const destinationRoot = normalizePath(options.destinationRoot);

  if (!templateRoot) {
    throw new TemplateRendererError("Template root path is required");
  }
  if (!destinationRoot) {
    throw new TemplateRendererError("Destination root path is required");
  }

  const templateRootInfo = await safeStat(templateRoot);
  if (!templateRootInfo) {
    throw new TemplateRendererError(`Template root not found: ${templateRoot}`);
  }
  if (!templateRootInfo.isDirectory) {
    throw new TemplateRendererError(`Template root is not a directory: ${templateRoot}`);
  }

  await ensureDir(destinationRoot);

  const etaInstance = createEtaInstance(templateRoot, options.eta);
  const partialDirectories = normalizePartialDirectories(options.partialDirectories);
  const renderedFiles: string[] = [];
  const copiedFiles: string[] = [];

  for await (const entry of walk(templateRoot, { includeDirs: false, followSymlinks: false })) {
    if (!entry.isFile) {
      continue;
    }

    const relativePath = relative(templateRoot, normalizePath(entry.path));
    if (!relativePath) {
      continue;
    }

    if (isInPartialDirectory(relativePath, partialDirectories)) {
      continue;
    }

    const destinationPath = join(destinationRoot, stripTemplateExtension(relativePath));
    await ensureDir(dirname(destinationPath));

    if (entry.path.endsWith(TEMPLATE_EXTENSION)) {
      const rendered = await renderTemplateFile(
        etaInstance,
        relativePath,
        options.context ?? {},
      );
      await Deno.writeTextFile(destinationPath, rendered);
      renderedFiles.push(stripTemplateExtension(relativePath));
    } else {
      await Deno.copyFile(entry.path, destinationPath);
      copiedFiles.push(stripTemplateExtension(relativePath));
    }
  }

  return {
    renderedFiles,
    copiedFiles,
  };
}

function createEtaInstance(templateRoot: string, providedEta?: EtaLike): EtaLike {
  const eta: EtaLike = providedEta ?? new Eta();
  eta.configure({
    cache: false,
    views: templateRoot,
    defaultExtension: TEMPLATE_EXTENSION,
  });
  eta.readFile = (path) => Deno.readTextFileSync(path);
  return eta;
}

async function safeStat(path: string): Promise<Deno.FileInfo | null> {
  try {
    return await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw new TemplateRendererError(`Unable to stat path: ${path}`, { cause: error });
  }
}

async function renderTemplateFile(
  eta: EtaLike,
  templatePath: string,
  context: Record<string, unknown>,
): Promise<string> {
  try {
    const result = await eta.renderAsync(templatePath, context);
    return serializeTemplateResult(result);
  } catch (error) {
    if (error instanceof EtaError) {
      throw new TemplateRendererError(`Failed to render template: ${templatePath}`, {
        cause: error,
      });
    }
    throw new TemplateRendererError(`Unexpected error while rendering template: ${templatePath}`, {
      cause: error,
    });
  }
}

function serializeTemplateResult(result: unknown): string {
  if (result === undefined || result === null) {
    return "";
  }
  if (typeof result === "string") {
    return result;
  }
  return String(result);
}

function stripTemplateExtension(path: string): string {
  return path.endsWith(TEMPLATE_EXTENSION) ? path.slice(0, -TEMPLATE_EXTENSION.length) : path;
}

function normalizePath(path: string): string {
  return normalize(path);
}

function normalizePartialDirectories(directories?: readonly string[]): readonly string[] {
  if (!directories || directories.length === 0) {
    return DEFAULT_PARTIAL_DIRECTORIES;
  }
  return directories.map((dir) => dir.replaceAll("\\", "/"));
}

function isInPartialDirectory(relativePath: string, partialDirs: readonly string[]): boolean {
  const normalized = relativePath.replaceAll("\\", "/");
  return partialDirs.some((dir) => normalized === dir || normalized.startsWith(`${dir}/`));
}
