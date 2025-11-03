import { assert, assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path/join";
import { EtaError } from "eta";

import { renderTemplateDirectory, TemplateRendererError } from "./renderer.ts";

function toSorted(values: readonly string[]): readonly string[] {
  return [...values].sort();
}

Deno.test({
  name: "renders Eta templates and copies static assets",
  async fn() {
    const templateDir = await Deno.makeTempDir({ prefix: "eta-template-" });
    const destinationDir = await Deno.makeTempDir({ prefix: "eta-out-" });

    try {
      await Deno.writeTextFile(
        join(templateDir, "bot.ts.eta"),
        'export const name = "<%= it.name %>";\n',
      );
      await Deno.writeTextFile(join(templateDir, "static.txt"), "static file\n");

      const result = await renderTemplateDirectory({
        templateRoot: templateDir,
        destinationRoot: destinationDir,
        context: { name: "Grammy" },
      });

      const renderedContent = await Deno.readTextFile(join(destinationDir, "bot.ts"));
      const copiedContent = await Deno.readTextFile(join(destinationDir, "static.txt"));

      assertEquals(renderedContent, 'export const name = "Grammy";\n');
      assertEquals(copiedContent, "static file\n");
      assertEquals(toSorted(result.renderedFiles), ["bot.ts"]);
      assertEquals(toSorted(result.copiedFiles), ["static.txt"]);
    } finally {
      await Deno.remove(templateDir, { recursive: true });
      await Deno.remove(destinationDir, { recursive: true });
    }
  },
});

Deno.test({
  name: "supports partial directories without emitting them",
  async fn() {
    const templateDir = await Deno.makeTempDir({ prefix: "eta-template-" });
    const destinationDir = await Deno.makeTempDir({ prefix: "eta-out-" });

    try {
      const partialDir = join(templateDir, "_partials");
      await Deno.mkdir(partialDir, { recursive: true });
      await Deno.writeTextFile(join(partialDir, "greeting.eta"), "Hello <%= it.name %>\n");
      await Deno.writeTextFile(
        join(templateDir, "README.md.eta"),
        "<%~ include('./_partials/greeting', it) %>\nWelcome!\n",
      );

      await renderTemplateDirectory({
        templateRoot: templateDir,
        destinationRoot: destinationDir,
        context: { name: "Grammy" },
      });

      const readmeContent = await Deno.readTextFile(join(destinationDir, "README.md"));
      assertEquals(readmeContent, "Hello GrammyWelcome!\n");

      await assertRejects(async () => {
        await Deno.stat(join(destinationDir, "_partials"));
      }, Deno.errors.NotFound);
    } finally {
      await Deno.remove(templateDir, { recursive: true });
      await Deno.remove(destinationDir, { recursive: true });
    }
  },
});

Deno.test({
  name: "wraps Eta errors with TemplateRendererError",
  async fn() {
    const templateDir = await Deno.makeTempDir({ prefix: "eta-template-" });
    const destinationDir = await Deno.makeTempDir({ prefix: "eta-out-" });

    try {
      await Deno.writeTextFile(join(templateDir, "broken.ts.eta"), "<%");

      const error = await assertRejects(async () => {
        await renderTemplateDirectory({
          templateRoot: templateDir,
          destinationRoot: destinationDir,
        });
      }, TemplateRendererError);

      assert(error instanceof TemplateRendererError);
      assert(error.cause instanceof EtaError);
    } finally {
      await Deno.remove(templateDir, { recursive: true });
      await Deno.remove(destinationDir, { recursive: true });
    }
  },
});
