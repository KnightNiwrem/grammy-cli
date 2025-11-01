# AGENTS · grammY Template CLI

> This file guides autonomous and human collaborators. Consult `PLAN.md` for strategic roadmap and
> `TASKS.md` for granular execution items.

## Repository Overview

- Build a JSR-published scaffolding CLI that generates grammY bot starters for Deno, Node, and Bun
  runtimes.
- Source layout is expected to evolve into: `src/` (CLI + utilities), `templates/` (Eta-based
  blueprints), `scripts/` (release & QA helpers).

## Tooling & Setup

- **Prerequisites:** Latest stable Deno (>=1.46), Node LTS (>=18) for compatibility tests, Bun
  (>=1.1) if validating bunx path.
- **Installation:** No install step yet; when available use `deno task setup` or `deno cache` over
  `src/cli.ts`.
- **Dependencies:** Prefer `jsr:` and `npm:` specifiers. Avoid raw HTTPS imports to satisfy JSR
  publish rules.

## Build, Lint, Test

- Default commands (configure in `deno.json`):
  - Format: `deno fmt`
  - Lint: `deno lint`
  - Unit tests: `deno test`
  - Generated-project smoke tests will run via dedicated scripts once templates exist.
- Always run `deno task ok` before committing or pushing changes.
- Before releases run `deno publish --dry-run` to catch registry validation errors.

## Coding Conventions

- Use ES modules with TypeScript (`.ts`) for source files; JavaScript templates must pass
  ESLint-equivalent checks shipped with scaffold.
- Match Deno fmt defaults (2-space indentation, trailing commas where valid, double quotes by
  default).
- Keep CLI options consistent with Commander best practices (kebab-case flags, descriptive help
  strings).

## CLI Implementation Notes

- Import Commander via `import { Command } from "npm:commander@14.0.1";` and call
  `await program.parseAsync(Deno.args);`.
- Capture terminal width using `Deno.consoleSize` when available; otherwise fall back to 80 columns
  to avoid wrapping issues noted in Commander x Deno discussions.
- Provide both interactive prompts (likely via `npm:prompts` or similar) and non-interactive flags
  for CI consumption.

## Template Authoring Guidelines

- Use [Eta](https://eta.js.org/) templates (`.eta`) for dynamic file sections; leverage partials for
  shared snippets (env files, README fragments).
- Store template manifests describing name, description, required plugins, runtime notes, and
  post-scaffold instructions.
- Ensure generated projects include `.env.example`, lint/test scripts, and deployment notes for Deno
  Deploy, Node, and Bun where applicable.
- Pin official grammY plugins (`@grammyjs/*`) for sessions, menus, rate limiting, and localization
  based on template preset.

## Release & Distribution

- Maintain semantic versioning; each release path should run fmt/lint/test + generated template
  smoke tests.
- Publish via `deno publish`; confirm CLI executes through `deno run jsr:@scope/grammy-cli`,
  `npx jsr:@scope/grammy-cli`, and `bunx jsr:@scope/grammy-cli`.
- Keep changelog/release notes minimal but clear; surface upgrade tips via CLI help instead of repo
  docs unless requested.

## Security & Compliance

- Do not commit secrets. Generated templates must read environment variables through `.env` loaders
  and document required keys.
- Avoid telemetry by default; if added, require explicit opt-in flags and document data collected.

## Coordination

- Strategic changes belong in `PLAN.md`; update when altering scope, timelines, or major
  architecture choices.
- Use `TASKS.md` to track execution progress; keep statuses current when work completes.
- Log major decisions and rationales in commit messages referencing relevant sections of this file
  or plan/tasks documents.

## Open Questions

- Confirm default deployment target for advanced templates (Deno Deploy vs Node Worker) before Phase
  3 tasks.
- Decide if a plugin discovery/marketplace command should ship in v1 or remain backlog.
- Determine minimum supported Node/Bun versions after initial runtime testing.
