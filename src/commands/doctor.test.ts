import { assertEquals } from "@std/assert";
import { checkImportCompatibility } from "./doctor.ts";

type ReadTextFileSync = typeof Deno.readTextFileSync;

async function withReadStub(
  files: Record<string, string>,
  callback: () => void | Promise<void>,
): Promise<void> {
  const original = Deno.readTextFileSync as ReadTextFileSync;
  (Deno as { readTextFileSync: ReadTextFileSync }).readTextFileSync = (path: string) => {
    const value = files[path];
    if (value === undefined) {
      throw new Deno.errors.NotFound(path);
    }
    return value;
  };

  try {
    await callback();
  } finally {
    (Deno as { readTextFileSync: ReadTextFileSync }).readTextFileSync = original;
  }
}

Deno.test("checkImportCompatibility passes when imports and lock align", async () => {
  await withReadStub({
    "deno.json": JSON.stringify({
      imports: {
        "commander": "npm:commander@14.0.1",
        "std/assert": "jsr:@std/assert@1.0.0",
      },
    }),
    "deno.lock": JSON.stringify({
      npm: { "commander@14.0.1": {} },
      jsr: { "@std/assert@1.0.0": {} },
    }),
  }, () => {
    const result = checkImportCompatibility();
    assertEquals(result.status, "pass");
  });
});

Deno.test("checkImportCompatibility warns when specifiers missing", async () => {
  await withReadStub({
    "deno.json": JSON.stringify({ imports: {} }),
    "deno.lock": JSON.stringify({}),
  }, () => {
    const result = checkImportCompatibility();
    assertEquals(result.status, "warn");
  });
});

Deno.test("checkImportCompatibility warns when lockfile discrepancies exist", async () => {
  await withReadStub({
    "deno.json": JSON.stringify({
      imports: {
        "commander": "npm:commander@14.0.1",
      },
    }),
    "deno.lock": JSON.stringify({ jsr: {} }),
  }, () => {
    const result = checkImportCompatibility();
    assertEquals(result.status, "warn");
  });
});
