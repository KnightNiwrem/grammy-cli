import { createLogger, isInteractiveTerminal, Logger } from "../utils/index.ts";

type PromptModule = typeof import("prompts");
type InputPrompt = PromptModule["input"];
type SelectPrompt = PromptModule["select"];
type CheckboxPrompt = PromptModule["checkbox"];
type ConfirmPrompt = PromptModule["confirm"];

export interface PromptDrivers {
  readonly input?: InputPrompt;
  readonly select?: SelectPrompt;
  readonly checkbox?: CheckboxPrompt;
  readonly confirm?: ConfirmPrompt;
}

export interface BasePromptOptions<T> {
  readonly message: string;
  readonly fallback?: T;
  readonly logger?: Logger;
}

export interface TextPromptOptions extends BasePromptOptions<string> {
  readonly initial?: string;
}

export interface SelectChoice<T> {
  readonly value: T;
  readonly name?: string;
  readonly disabled?: boolean;
}

export interface SelectPromptOptions<T> extends BasePromptOptions<T> {
  readonly choices: ReadonlyArray<SelectChoice<T>>;
  readonly initial?: T;
}

export interface MultiSelectPromptOptions<T> extends BasePromptOptions<ReadonlyArray<T>> {
  readonly choices: ReadonlyArray<SelectChoice<T>>;
  readonly initial?: ReadonlyArray<T>;
}

export interface ConfirmPromptOptions extends BasePromptOptions<boolean> {
  readonly initial?: boolean;
}

export interface Prompter {
  text(options: TextPromptOptions): Promise<string>;
  select<T>(options: SelectPromptOptions<T>): Promise<T>;
  multiSelect<T>(options: MultiSelectPromptOptions<T>): Promise<ReadonlyArray<T>>;
  confirm(options: ConfirmPromptOptions): Promise<boolean>;
}

export interface CreatePrompterOptions {
  readonly interactive?: boolean;
  readonly logger?: Logger;
  readonly drivers?: PromptDrivers;
}

export class PromptUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptUnavailableError";
  }
}

function resolveFallback<T>(options: BasePromptOptions<T>): T {
  if (options.fallback !== undefined) {
    return options.fallback;
  }

  throw new PromptUnavailableError(
    `Interactive prompts disabled and no fallback provided for: ${options.message}`,
  );
}

function isAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "AbortError" || error.name === "ExitPromptError" ||
    error.name === "AbortPromptError" ||
    error.message?.toLowerCase?.().includes("force closed");
}

function handleAbort(logger: Logger | undefined): never {
  logger?.warn("Prompt cancelled by user");
  Deno.exit(130);
}

function normalizeChoices<T>(choices: ReadonlyArray<SelectChoice<T>>) {
  return choices.map((choice) => ({
    value: choice.value,
    name: choice.name ?? String(choice.value),
    disabled: choice.disabled,
  }));
}

let promptModulePromise: Promise<PromptModule> | undefined;

async function loadPromptModule(): Promise<PromptModule> {
  if (!promptModulePromise) {
    promptModulePromise = import("prompts");
  }
  return await promptModulePromise;
}

export function createPrompter(options: CreatePrompterOptions = {}): Prompter {
  const interactive = options.interactive ?? isInteractiveTerminal();
  const logger = options.logger ?? createLogger({ level: "info" });
  const providedDrivers = options.drivers ?? {};

  const runPrompt = async <T>(
    runner: () => Promise<T>,
    promptLogger: Logger | undefined,
  ): Promise<T> => {
    try {
      return await runner();
    } catch (error) {
      if (isAbortError(error)) {
        handleAbort(promptLogger);
      }
      throw error;
    }
  };

  return {
    async text(promptOptions) {
      if (!interactive) {
        return resolveFallback(promptOptions);
      }

      const driverLogger = promptOptions.logger ?? logger;
      const driver = providedDrivers.input ?? (await loadPromptModule()).input;
      return await runPrompt(() =>
        driver({
          message: promptOptions.message,
          default: promptOptions.initial,
        }), driverLogger);
    },

    async select<T>(promptOptions: SelectPromptOptions<T>) {
      if (!interactive) {
        return resolveFallback(promptOptions);
      }

      const driverLogger = promptOptions.logger ?? logger;
      const driver = providedDrivers.select ?? (await loadPromptModule()).select;
      return await runPrompt(() =>
        driver({
          message: promptOptions.message,
          choices: normalizeChoices(promptOptions.choices),
          default: promptOptions.initial,
        }), driverLogger);
    },

    async multiSelect<T>(promptOptions: MultiSelectPromptOptions<T>) {
      if (!interactive) {
        const fallback = resolveFallback(promptOptions);
        return fallback;
      }

      const driverLogger = promptOptions.logger ?? logger;
      const driver = providedDrivers.checkbox ?? (await loadPromptModule()).checkbox;
      return await runPrompt(() =>
        driver({
          message: promptOptions.message,
          choices: normalizeChoices(promptOptions.choices),
        }), driverLogger);
    },

    async confirm(promptOptions: ConfirmPromptOptions) {
      if (!interactive) {
        return resolveFallback(promptOptions);
      }

      const driverLogger = promptOptions.logger ?? logger;
      const driver = providedDrivers.confirm ?? (await loadPromptModule()).confirm;
      return await runPrompt(() =>
        driver({
          message: promptOptions.message,
          default: promptOptions.initial,
        }), driverLogger);
    },
  };
}
