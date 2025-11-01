# Agent Brief: grammY Template CLI

## Project Vision
- Deliver a Deno-first scaffolding CLI published on JSR that can be executed via `deno run jsr:@scope/grammy-cli`, `npx jsr:@scope/grammy-cli`, and `bunx jsr:@scope/grammy-cli`.
- Generate opinionated grammY bot templates (JavaScript/TypeScript) with optional official plugin integrations, lint/test wiring, and deployment recipes.
- Maintain cross-runtime compatibility without sacrificing type safety or DX for Deno users.

## Research Highlights

### JSR Ecosystem
- Publish using `deno publish`/`jsr publish` with `deno.json` metadata (`name`, `version`, `exports`, `tasks`).
- Ship an ES module entry with an `exports.bin` target so JSR mirrors a runnable npm wrapper (`@jsr` scope) for `npx`/`bunx` usage.
- Avoid bare `https://` imports; depend on `jsr:` and `npm:` specifiers for deterministic dependency graphs.
- Provide installation guidance for `deno add jsr:@scope/grammy-cli` and maintain semver discipline for template stability.

### Template Engine Strategy
- Favor [Eta](https://eta.js.org/) (`npm:eta`) for speed, zero-dep footprint, async rendering, and Deno support; cache compiled templates for repeated scaffolds.
- Support simple token replacement for filename/slug injection and allow future extension hooks for alternative engines if community requests arise.

### grammY Core & Official Plugins to Support
- Core: `grammy` with Bot API 7.0+, middleware composition, context typing.
- Sessions & Data: `@grammyjs/conversations`, `@grammyjs/storage-sqlite`, `@grammyjs/storage-redis`.
- UX & Flows: `@grammyjs/menu`, `@grammyjs/inline-menu`, `@grammyjs/keyboard`, `@grammyjs/parse-mode`.
- Reliability: `@grammyjs/ratelimiter`, `@grammyjs/transformer-throttler`, `@grammyjs/auto-retry`, `@grammyjs/runner` (long-polling fan-out).
- Localization & Formatting: `@grammyjs/i18n`, `@grammyjs/fluent`.
- Testing utilities: `@grammyjs/types`, `@grammyjs/scope`, and plug into `grammy` testing helpers for template validation.

### Commander in Deno/Node Hybrid CLIs
- Import via `import { Command } from "npm:commander@^12";` to leverage mature option parsing, subcommands, and auto-help.
- Wrap `await program.parseAsync(Deno.args);` and gate Node-only features (stand-alone executables) to keep compatibility with Deno runtime.
- Handle terminal width quirks by falling back to 80 cols and use Deno's `Deno.consoleSize` when available.

## Implementation Plan & Backlog
1. **Foundations**
   - Define `deno.json` (tasks, compiler options, fmt/lint) and `deno.lock`.
   - Configure JSR metadata (`name`, `version`, `exports`, `publish` script) and CI stub for `deno fmt/lint/test`.
   - Add shared utilities (logger, path helpers) and select Eta templating helper layer.
2. **CLI Core**
   - Build Commander-based entry (`src/cli.ts`) with commands: `new`, `list`, `doctor`, `upgrade`.
   - Implement interactive prompts (confirm, select) via Deno std or `npm:prompts` while honoring non-interactive flags.
   - Add configuration resolution (project manifest, runtime detection, plugin flags).
3. **Template Packs**
   - Create base grammY templates: minimal TS, minimal JS, conversations-enabled, plugin bundles (ratelimiter+i18n, menu, runner).
   - Use Eta partials for README snippets, environment examples, Docker/deno task files, and tests (Deno + Vitest/lite harness).
   - Provide post-scaffold tasks (install deps, set env) and optional deployment presets (Deno Deploy, Cloudflare Workers, Node).
4. **Quality & Distribution**
   - Author unit/integration tests for command parsing, template rendering, and generated project smoke tests.
   - Add `deno task release` to bump version, run QA, and invoke `deno publish`.
   - Prepare release notes template and verify `npx jsr:@scope/grammy-cli@<version>` works in CI matrix (Deno/Node/Bun).

## Workflow Guardrails
- Prefer `npm:` and `jsr:` specifiers; keep dependencies minimal and audited.
- Run `deno fmt`, `deno lint`, and `deno test` before any release commits.
- Document new templates via in-tool `--help` rather than repo docs unless stakeholders request otherwise.
- Maintain backward compatibility for template options; introduce breaking changes behind feature flags with deprecation warnings.

## Open Questions
- Which deployment targets should ship in v1 templates (Deno Deploy vs Node worker)?
- Should the CLI bundle offer plugin marketplace discovery beyond official packages?
- Determine minimal Node/Bun versions we must support for generated projects.
