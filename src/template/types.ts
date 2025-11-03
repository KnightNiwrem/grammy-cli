export type TemplateRuntime = "deno" | "node" | "bun";

export type TemplatePlugin =
  | "conversations"
  | "menu"
  | "rate-limiter"
  | "i18n"
  | "auto-retry"
  | "parse-mode";

export interface TemplateFileDescriptor {
  readonly path: string;
  readonly destination?: string;
}

export interface TemplateManifest {
  readonly name: string;
  readonly description: string;
  readonly runtimes: ReadonlyArray<TemplateRuntime>;
  readonly plugins: ReadonlyArray<TemplatePlugin>;
  readonly files: ReadonlyArray<TemplateFileDescriptor>;
  /**
   * Optional directory override relative to the templates root.
   * When omitted, the manifest `name` is used as the directory name.
   */
  readonly directory?: string;
}

export interface LoadedTemplateFile {
  readonly descriptor: TemplateFileDescriptor;
  readonly absolutePath: string;
}

export interface LoadedTemplate {
  readonly manifest: TemplateManifest;
  readonly directory: string;
  readonly files: ReadonlyArray<LoadedTemplateFile>;
}
