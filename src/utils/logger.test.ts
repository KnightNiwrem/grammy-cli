import { assertEquals } from "@std/assert";
import { createLogger, type LogEntry } from "./logger.ts";

Deno.test("logger respects configured level", () => {
  const entries: LogEntry[] = [];
  const logger = createLogger({
    level: "warn",
    namespace: "test",
    sink: (entry) => entries.push(entry),
  });

  logger.info("ignored");
  logger.error("captured");

  assertEquals(entries.length, 1);
  assertEquals(entries[0].level, "error");
  assertEquals(entries[0].namespace, "test");
  assertEquals(entries[0].message, "captured");
});

Deno.test("logger child namespaces are concatenated", () => {
  const entries: LogEntry[] = [];
  const logger = createLogger({
    level: "debug",
    namespace: "root",
    sink: (entry) => entries.push(entry),
  });

  logger.child("worker").warn("issue");

  assertEquals(entries.length, 1);
  assertEquals(entries[0].namespace, "root:worker");
});
