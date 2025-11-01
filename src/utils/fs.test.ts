import { assertStringIncludes } from "@std/assert";
import { resolveFromCwd } from "./fs.ts";

Deno.test("resolveFromCwd joins segments with cwd", () => {
  const resolved = resolveFromCwd("foo", "bar");
  assertStringIncludes(resolved, "foo");
  assertStringIncludes(resolved, "bar");
});
