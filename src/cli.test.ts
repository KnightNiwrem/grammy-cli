import { assertEquals, assertExists } from "@std/assert";
import denoConfig from "../deno.json" with { type: "json" };
import { createCli, GlobalOptions } from "./cli.ts";
import { createLogger } from "./utils/index.ts";

Deno.test("createCli uses configuration defaults", () => {
  const program = createCli();
  assertEquals(program.name(), denoConfig.name ?? "grammy-cli");
  assertEquals(program.version(), denoConfig.version ?? "0.0.0");
});

Deno.test("createCli parses global options", async () => {
  const program = createCli({ name: "test-cli" });
  program.exitOverride();
  program.command("noop").action(() => {});

  await program.parseAsync([
    "--runtime",
    "bun",
    "--no-interactive",
    "noop",
  ], { from: "user" });

  const options = program.opts<GlobalOptions>();
  assertEquals(options.runtime, "bun");
  assertEquals(options.interactive, false);
  assertEquals(options.verbose, undefined);
});

Deno.test("createCli enables verbose logger by default", async () => {
  const program = createCli({ name: "test-cli" });
  program.exitOverride();

  program.command("noop").action(() => {});

  await program.parseAsync(["--verbose", "noop"], { from: "user" });

  const options = program.opts<GlobalOptions>();
  assertExists(options.logger);
  assertEquals(options.logger?.level, "debug");
});

Deno.test("createCli preserves injected logger when verbose", async () => {
  const injectedLogger = createLogger({ level: "info" });
  const program = createCli({ logger: injectedLogger, name: "test-cli" });
  program.exitOverride();

  program.command("noop").action(() => {});

  await program.parseAsync(["--verbose", "noop"], { from: "user" });

  const options = program.opts<GlobalOptions>();
  assertExists(options.logger);
  assertEquals(options.logger, injectedLogger);
});

Deno.test("createCli attaches prompter for commands", async () => {
  const program = createCli({ name: "test-cli" });
  program.exitOverride();

  program.command("noop").action(() => {});

  await program.parseAsync(["noop"], { from: "user" });

  const options = program.opts<GlobalOptions>();
  assertExists(options.prompter);
});
