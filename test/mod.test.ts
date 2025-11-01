import { assertEquals } from "@std/testing/asserts";
import { placeholder } from "../src/mod.ts";

Deno.test("placeholder flag", () => {
  assertEquals(placeholder, true);
});
