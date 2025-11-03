import { assert, assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path/join";

import { TemplateManifestError, validateTemplateCatalog } from "./loader.ts";
import type { TemplateManifest } from "./types.ts";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await Deno.makeTempDir({ prefix: "template-loader-" });
  try {
    return await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

function createManifest(overrides: Partial<TemplateManifest> = {}): TemplateManifest {
  return {
    name: "example-template",
    description: "Example template",
    runtimes: ["deno", "node"],
    plugins: [],
    files: [
      { path: "bot.ts.eta" },
    ],
    ...overrides,
  };
}

Deno.test("validateTemplateCatalog returns normalized templates", async () => {
  await withTempDir(async (baseDir) => {
    const templateDir = join(baseDir, "example-template");
    await Deno.mkdir(templateDir, { recursive: true });
    await Deno.writeTextFile(join(templateDir, "bot.ts.eta"), "// template file\n");

    const manifests = [createManifest()];
    const loaded = await validateTemplateCatalog(manifests, { baseDirectory: baseDir });

    assertEquals(loaded.length, 1);
    const [entry] = loaded;
    assertEquals(entry.manifest.name, "example-template");
    assertEquals(entry.manifest.description, "Example template");
    assertEquals(entry.manifest.runtimes, ["deno", "node"]);
    assertEquals(entry.files.length, 1);
    const [file] = entry.files;
    assert(file.absolutePath.endsWith("bot.ts.eta"));
    assertEquals(file.descriptor.path, "bot.ts.eta");
  });
});

Deno.test("validateTemplateCatalog rejects missing files", async () => {
  await withTempDir(async (baseDir) => {
    const templateDir = join(baseDir, "example-template");
    await Deno.mkdir(templateDir, { recursive: true });

    const manifests = [createManifest()];

    await assertRejects(
      () => validateTemplateCatalog(manifests, { baseDirectory: baseDir }),
      TemplateManifestError,
      "file not found",
    );
  });
});

Deno.test("validateTemplateCatalog rejects unsupported runtimes", async () => {
  await withTempDir(async (baseDir) => {
    const templateDir = join(baseDir, "example-template");
    await Deno.mkdir(templateDir, { recursive: true });
    await Deno.writeTextFile(join(templateDir, "bot.ts.eta"), "// template file\n");

    const manifests = [createManifest({ runtimes: ["deno", "invalid" as never] })];

    await assertRejects(
      () => validateTemplateCatalog(manifests, { baseDirectory: baseDir }),
      TemplateManifestError,
      "unsupported runtime",
    );
  });
});
