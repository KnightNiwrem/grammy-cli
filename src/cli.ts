import { Command } from "commander";
import { createLogger, Logger, selectLogLevel } from "./utils/logger.ts";
import { detectRuntime, Runtime } from "./utils/runtime.ts";
import { listCommand } from "./commands/list.ts";
import { doctorCommand } from "./commands/doctor.ts";

export interface CreateCliOptions {
  readonly logger?: Logger;
  readonly version?: string;
  readonly name?: string;
}

export interface GlobalOptions {
  verbose: boolean;
  runtime?: Runtime;
  interactive: boolean;
}

export function createCli(options: CreateCliOptions = {}): Command {
  const version = options.version ?? "0.0.0";
  const name = options.name ?? "grammy";

  const program = new Command();
  program
    .name(name)
    .description("Scaffold grammY bot starters across runtimes")
    .version(version)
    .option("-v, --verbose", "enable verbose logging", false)
    .option("--runtime <runtime>", "target runtime (deno|node|bun)")
    .option("--no-interactive", "disable interactive prompts", false)
    .hook("preAction", (thisCommand) => {
      const opts = thisCommand.opts<GlobalOptions>();
      const level = opts.verbose ? "debug" : selectLogLevel();
      const logger = options.logger ?? createLogger({ level });

      logger.debug(`runtime=${detectRuntime()}`);
      logger.debug(`options=${JSON.stringify(opts)}`);
    });

  // Add subcommands
  program.addCommand(listCommand);
  program.addCommand(doctorCommand);

  // No default action - let Commander handle help and unknown commands

  return program;
}

export async function run(args: string[] = Array.from(Deno.args)): Promise<void> {
  const program = createCli();
  await program.parseAsync(args);
}

if (import.meta.main) {
  await run();
}
