import { confirm, input, select } from "npm:@inquirer/prompts@7.8.6";

export interface PromptOptions {
  interactive: boolean;
}

/**
 * Wrapper around prompt utilities that falls back to defaults when non-interactive
 */
export class PromptHandler {
  constructor(private options: PromptOptions) {}

  async confirm(message: string, defaultValue = false): Promise<boolean> {
    if (!this.options.interactive) {
      return defaultValue;
    }

    try {
      return await confirm({ message });
    } catch {
      // User cancelled via Ctrl+C
      return defaultValue;
    }
  }

  async input(message: string, defaultValue = ""): Promise<string> {
    if (!this.options.interactive) {
      return defaultValue;
    }

    try {
      return await input({ message, default: defaultValue });
    } catch {
      // User cancelled via Ctrl+C
      return defaultValue;
    }
  }

  async select<T extends string>(
    message: string,
    choices: { name: string; value: T }[],
    defaultValue?: T,
  ): Promise<T> {
    if (!this.options.interactive) {
      return defaultValue ?? choices[0].value;
    }

    try {
      return await select({
        message,
        choices,
        default: defaultValue,
      });
    } catch {
      // User cancelled via Ctrl+C
      return defaultValue ?? choices[0].value;
    }
  }
}

export function createPromptHandler(options: PromptOptions): PromptHandler {
  return new PromptHandler(options);
}
