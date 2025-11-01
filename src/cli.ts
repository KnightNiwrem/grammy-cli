import { Command } from "commander";
import { createLogger, Logger, selectLogLevel } from "./utils/logger.ts";
import { detectRuntime } from "./utils/runtime.ts";

export interface CreateCliOptions {
  readonly logger?: Logger;
  readonly version?: string;
  readonly name?: string;
}

export function createCli(options: CreateCliOptions = {}): Command {
  const level = selectLogLevel();
  const logger = options.logger ?? createLogger({ level });
  const version = options.version ?? "0.0.0";
  const name = options.name ?? "grammy";

  const program = new Command();
  program
    .name(name)
    .description("Scaffold grammY bot starters across runtimes")
    .version(version)
    .hook("preAction", () => {
      logger.debug(`runtime=${detectRuntime()}`);
    })
    .action(() => {
      logger.info("CLI features are under construction. Track progress in Phase 1 of the plan.");
    });

  return program;
}

export async function run(args: string[] = Array.from(Deno.args)): Promise<void> {
  const program = createCli();
  await program.parseAsync(args);
}

if (import.meta.main) {
  await run();
}
