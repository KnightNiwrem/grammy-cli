import { assert, assertEquals } from "@std/assert";
import { detectRuntime, isInteractiveTerminal } from "./runtime.ts";

Deno.test("detectRuntime returns deno when running in Deno", () => {
  assertEquals(detectRuntime(), "deno");
});

Deno.test("isInteractiveTerminal does not throw without tty", () => {
  assert(typeof isInteractiveTerminal() === "boolean");
});
