import { assertEquals, assertRejects } from "@std/assert";
import { createLogger } from "../utils/index.ts";
import { createPrompter, PromptUnavailableError } from "./index.ts";
import type { PromptDrivers } from "./index.ts";

const quietLogger = createLogger({ level: "debug", sink: () => {} });

function resolved<T>(value: T) {
  const promise = Promise.resolve(value) as Promise<T> & { cancel: () => void };
  promise.cancel = () => {};
  return promise;
}

function rejected<T>(error: Error) {
  const promise = Promise.reject<T>(error) as Promise<T> & { cancel: () => void };
  promise.cancel = () => {};
  promise.catch(() => {});
  return promise;
}

Deno.test("createPrompter returns fallback when non-interactive", async () => {
  const prompter = createPrompter({ interactive: false, logger: quietLogger });
  const value = await prompter.text({ message: "name", fallback: "bot" });
  assertEquals(value, "bot");
});

Deno.test("createPrompter throws when fallback missing", async () => {
  const prompter = createPrompter({ interactive: false, logger: quietLogger });
  await assertRejects(() => prompter.confirm({ message: "confirm" }), PromptUnavailableError);
});

Deno.test("createPrompter resolves interactive drivers", async () => {
  const drivers: PromptDrivers = {
    input: (() => resolved("value")) as PromptDrivers["input"],
    select: (() => resolved("choice")) as PromptDrivers["select"],
    checkbox: (() => resolved(["a", "b"])) as PromptDrivers["checkbox"],
    confirm: (() => resolved(true)) as PromptDrivers["confirm"],
  };

  const prompter = createPrompter({
    interactive: true,
    logger: quietLogger,
    drivers,
  });

  const text = await prompter.text({ message: "text" });
  const selected = await prompter.select({
    message: "select",
    choices: [{ value: "choice" }],
  });
  const multi = await prompter.multiSelect({
    message: "multi",
    choices: [{ value: "a" }, { value: "b" }],
  });
  const confirmed = await prompter.confirm({ message: "confirm" });

  assertEquals(text, "value");
  assertEquals(selected, "choice");
  assertEquals(multi, ["a", "b"]);
  assertEquals(confirmed, true);
});

Deno.test("createPrompter exits with code 130 when aborted", async () => {
  const abortDrivers: PromptDrivers = {
    input: (() => {
      const error = new Error("aborted");
      error.name = "AbortError";
      return rejected<string>(error);
    }) as PromptDrivers["input"],
  };

  const prompter = createPrompter({
    interactive: true,
    logger: quietLogger,
    drivers: abortDrivers,
  });

  const originalExit = Deno.exit;
  let exitCode: number | undefined;
  (Deno as { exit: (code: number) => never }).exit = (code: number) => {
    exitCode = code;
    throw new Error("exit");
  };

  try {
    await assertRejects(() => prompter.text({ message: "test" }));
    assertEquals(exitCode, 130);
  } finally {
    (Deno as { exit: typeof originalExit }).exit = originalExit;
  }
});
