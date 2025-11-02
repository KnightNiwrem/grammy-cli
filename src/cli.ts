import { Command } from "commander";
import { createLogger, Logger, selectLogLevel } from "./utils/index.ts";
import { detectRuntime, Runtime } from "./utils/index.ts";
import { doctorCommand } from "./commands/doctor.ts";
import { listCommand } from "./commands/list.ts";

export interface GlobalOptions {
  verbose?: boolean;
  runtime?: Runtime;
  interactive?: boolean;
}

export interface CreateCliOptions {
  readonly logger?: Logger;
  readonly version?: string;
  readonly name?: string;
}

function getTerminalWidth(): number {
  try {
    const size = Deno.consoleSize();
    return size.columns;
  } catch {
    return 80;
  }
}

export function createCli(options: CreateCliOptions = {}): Command {
  const level = selectLogLevel();
  const logger = options.logger ?? createLogger({ level });
  const version = options.version ?? "0.0.0";
  const name = options.name ?? "grammy-cli";

  const program = new Command();
  program
    .name(name)
    .description("Scaffold grammY bot starters across runtimes")
    .version(version)
    .configureOutput({
      getOutHelpWidth: getTerminalWidth,
      getErrHelpWidth: getTerminalWidth,
    })
    .option("-v, --verbose", "enable verbose logging")
    .option(
      "-r, --runtime <runtime>",
      "target runtime (deno, node, or bun)",
      /^(deno|node|bun)$/i,
    )
    .option("--no-interactive", "disable interactive prompts")
    .hook("preAction", (thisCommand) => {
      const opts = thisCommand.opts<GlobalOptions>();
      if (opts.verbose) {
        const verboseLogger = createLogger({ level: "debug" });
        thisCommand.setOptionValue("logger", verboseLogger);
        verboseLogger.debug(`runtime=${detectRuntime()}`);
        verboseLogger.debug(`options=${JSON.stringify(opts)}`);
      } else {
        thisCommand.setOptionValue("logger", logger);
      }
    });

  program
    .command("list")
    .description("List available templates")
    .option("--json", "output in JSON format")
    .action(async (cmdOpts) => {
      const opts = program.opts<GlobalOptions>();
      const cmdLogger = opts.verbose ? createLogger({ level: "debug" }) : logger;
      await listCommand({ logger: cmdLogger, json: cmdOpts.json });
    });

  program
    .command("doctor")
    .description("Validate environment and dependencies")
    .action(async () => {
      const opts = program.opts<GlobalOptions>();
      const cmdLogger = opts.verbose ? createLogger({ level: "debug" }) : logger;
      await doctorCommand({ logger: cmdLogger });
    });

  return program;
}

export async function run(args: string[] = Array.from(Deno.args)): Promise<void> {
  const program = createCli();
  await program.parseAsync(args, { from: "user" });
}

if (import.meta.main) {
  await run();
}
