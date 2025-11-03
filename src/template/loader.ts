import { join } from "@std/path/join";
import { normalize } from "@std/path/normalize";
import { isAbsolute } from "@std/path/is-absolute";
import { fromFileUrl } from "@std/path/from-file-url";

import type {
  LoadedTemplate,
  LoadedTemplateFile,
  TemplateFileDescriptor,
  TemplateManifest,
  TemplatePlugin,
  TemplateRuntime,
} from "./types.ts";

const TEMPLATE_ROOT = fromFileUrl(import.meta.resolve("../../templates/"));

const VALID_RUNTIMES = new Set<TemplateRuntime>(["deno", "node", "bun"]);
const VALID_PLUGINS = new Set<TemplatePlugin>([
  "conversations",
  "menu",
  "rate-limiter",
  "i18n",
  "auto-retry",
  "parse-mode",
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface LoadTemplateCatalogOptions {
  readonly baseDirectory?: string;
  readonly validateFiles?: boolean;
}

export interface ValidateTemplateOptions {
  readonly baseDirectory?: string;
  readonly validateFiles?: boolean;
}

export class TemplateManifestError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "TemplateManifestError";
  }
}

export async function loadTemplateCatalog(
  options: LoadTemplateCatalogOptions = {},
): Promise<LoadedTemplate[]> {
  const module = await import("../../templates/index.ts");
  const manifestModule = module as {
    templates?: ReadonlyArray<TemplateManifest>;
    default?: ReadonlyArray<TemplateManifest>;
  };
  const manifests: ReadonlyArray<TemplateManifest> = manifestModule.templates ??
    manifestModule.default ?? [];
  return await validateTemplateCatalog(manifests, {
    baseDirectory: options.baseDirectory ?? TEMPLATE_ROOT,
    validateFiles: options.validateFiles ?? true,
  });
}

export async function validateTemplateCatalog(
  manifests: ReadonlyArray<TemplateManifest>,
  options: ValidateTemplateOptions = {},
): Promise<LoadedTemplate[]> {
  const baseDirectory = options.baseDirectory ?? TEMPLATE_ROOT;
  const validateFiles = options.validateFiles ?? true;

  const seenNames = new Set<string>();
  const results: LoadedTemplate[] = [];

  for (const manifest of manifests) {
    const name = validateName(manifest.name);
    if (seenNames.has(name)) {
      throw new TemplateManifestError(`Duplicate template name detected: ${name}`);
    }
    seenNames.add(name);

    const description = validateDescription(manifest.description, name);
    const runtimes = validateRuntimes(manifest.runtimes, name);
    const plugins = validatePlugins(manifest.plugins, name);
    const directorySegment = validateRelativePath(
      manifest.directory ?? name,
      `template '${name}' directory`,
    );
    const templateDirectory = join(baseDirectory, directorySegment);
    const directoryInfo = await safeStat(templateDirectory);
    if (!directoryInfo) {
      throw new TemplateManifestError(
        `Template directory not found for '${name}': ${templateDirectory}`,
      );
    }
    if (!directoryInfo.isDirectory) {
      throw new TemplateManifestError(
        `Template directory is not a folder for '${name}': ${templateDirectory}`,
      );
    }

    const files = await validateFilesDescriptors(
      manifest.files,
      templateDirectory,
      validateFiles,
      name,
    );

    const sanitizedDescriptors = files.map((file) => file.descriptor);

    results.push({
      manifest: {
        name,
        description,
        runtimes,
        plugins,
        files: sanitizedDescriptors,
        directory: directorySegment,
      },
      directory: templateDirectory,
      files,
    });
  }

  return results;
}

async function validateFilesDescriptors(
  descriptors: ReadonlyArray<TemplateFileDescriptor>,
  templateDirectory: string,
  validateExistence: boolean,
  templateName: string,
): Promise<LoadedTemplateFile[]> {
  if (!Array.isArray(descriptors) || descriptors.length === 0) {
    throw new TemplateManifestError(
      `Template '${templateName}' must declare at least one file descriptor`,
    );
  }

  const seenPaths = new Set<string>();
  const seenDestinations = new Set<string>();
  const files: LoadedTemplateFile[] = [];

  for (const descriptor of descriptors) {
    const path = validateRelativePath(
      descriptor.path,
      `template '${templateName}' file path`,
    );
    if (seenPaths.has(path)) {
      throw new TemplateManifestError(
        `Duplicate file path '${path}' in template '${templateName}'`,
      );
    }
    seenPaths.add(path);

    let destination: string | undefined;
    if (descriptor.destination) {
      destination = validateRelativePath(
        descriptor.destination,
        `template '${templateName}' file destination`,
      );
      if (seenDestinations.has(destination)) {
        throw new TemplateManifestError(
          `Duplicate file destination '${destination}' in template '${templateName}'`,
        );
      }
      seenDestinations.add(destination);
    }

    const absolutePath = join(templateDirectory, path);
    if (validateExistence) {
      const info = await safeStat(absolutePath);
      if (!info || !info.isFile) {
        throw new TemplateManifestError(
          `Template '${templateName}' file not found: ${absolutePath}`,
        );
      }
    }

    files.push({
      descriptor: { path, destination },
      absolutePath,
    });
  }

  return files;
}

function validateName(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TemplateManifestError("Template name must be a non-empty string");
  }

  const normalized = value.trim();
  if (!SLUG_PATTERN.test(normalized)) {
    throw new TemplateManifestError(
      `Template name must be kebab-case with lowercase alphanumerics: ${value}`,
    );
  }
  return normalized;
}

function validateDescription(value: unknown, templateName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TemplateManifestError(
      `Template '${templateName}' must provide a non-empty description`,
    );
  }
  return value.trim();
}

function validateRuntimes(
  runtimes: ReadonlyArray<TemplateRuntime> | undefined,
  templateName: string,
): TemplateRuntime[] {
  if (!Array.isArray(runtimes) || runtimes.length === 0) {
    throw new TemplateManifestError(
      `Template '${templateName}' must declare at least one runtime`,
    );
  }

  const normalized: TemplateRuntime[] = [];
  const seen = new Set<TemplateRuntime>();

  for (const runtime of runtimes) {
    if (!VALID_RUNTIMES.has(runtime)) {
      throw new TemplateManifestError(
        `Template '${templateName}' references unsupported runtime '${runtime}'`,
      );
    }
    if (seen.has(runtime)) {
      continue;
    }
    seen.add(runtime);
    normalized.push(runtime);
  }

  return normalized;
}

function validatePlugins(
  plugins: ReadonlyArray<TemplatePlugin> | undefined,
  templateName: string,
): TemplatePlugin[] {
  if (!Array.isArray(plugins)) {
    return [];
  }

  const normalized: TemplatePlugin[] = [];
  const seen = new Set<TemplatePlugin>();

  for (const plugin of plugins) {
    if (!VALID_PLUGINS.has(plugin)) {
      throw new TemplateManifestError(
        `Template '${templateName}' references unsupported plugin '${plugin}'`,
      );
    }
    if (seen.has(plugin)) {
      continue;
    }
    seen.add(plugin);
    normalized.push(plugin);
  }

  return normalized;
}

function validateRelativePath(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TemplateManifestError(`${label} must be a non-empty string`);
  }

  const trimmed = value.trim();
  if (isAbsolute(trimmed)) {
    throw new TemplateManifestError(`${label} must be a relative path`);
  }

  const normalized = normalize(trimmed).replaceAll("\\", "/");
  if (normalized.startsWith("../") || normalized === "..") {
    throw new TemplateManifestError(`${label} may not traverse upwards`);
  }
  if (normalized.includes("//")) {
    throw new TemplateManifestError(`${label} contains invalid path segments`);
  }

  return normalized;
}

async function safeStat(path: string): Promise<Deno.FileInfo | null> {
  try {
    return await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw new TemplateManifestError(`Unable to stat path: ${path}`, { cause: error });
  }
}
