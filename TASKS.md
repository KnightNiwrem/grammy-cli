# Task List · grammY Template CLI

## Legend

- `[ ]` pending `[~]` in progress `[x]` completed
- Priority: (H)igh, (M)edium, (L)ow

## Phase 0 – Foundations

- [ ] (H) Establish repo scaffolding (`src/`, `templates/`, `scripts/`) and baseline `deno.json`.
- [ ] (H) Configure lint/format/test tasks plus `deno.lock` resolution.
- [ ] (M) Draft minimal CI workflow running `deno fmt --check`, `deno lint`, `deno test`.
- [ ] (H) Implement shared utilities (logger, fs helpers, runtime detection).

## Phase 1 – CLI Core

- [ ] (H) Implement Commander-based entry (`src/cli.ts`) with global options.
- [ ] (H) Build `list` command enumerating template catalog from manifest.
- [ ] (H) Build `doctor` command validating environment/runtimes.
- [ ] (M) Wire interactive prompt layer (with non-interactive flags fallback).

## Phase 2 – Template Engine Integration

- [ ] (H) Integrate Eta renderer and file emission pipeline.
- [ ] (H) Define template manifest schema and loader utilities.
- [ ] (H) Author minimal TypeScript template (lint/test/env tasks).
- [ ] (M) Author minimal JavaScript template parity checks.
- [ ] (M) Add automated smoke tests executing generated projects' sanity checks.

## Phase 3 – Advanced Templates & Plugins

- [ ] (H) Implement plugin selection flags and prompt wiring for `new` command.
- [ ] (H) Create conversations + menu + rate limiter preset template.
- [ ] (M) Integrate localization preset with `@grammyjs/i18n`.
- [ ] (M) Document deployment recipes within templates (Deno Deploy, Node, Bun).

## Phase 4 – QA, Release & Distribution

- [ ] (H) Expand test suite (unit + integration + snapshot of rendered outputs).
- [ ] (H) Configure CI matrix across Deno, Node, Bun for CLI commands.
- [ ] (H) Implement `deno task release` (version bump, changelog, publish dry-run).
- [ ] (M) Validate `npx`/`bunx` execution path via automation.
- [ ] (L) Draft release notes template and upgrade guidance surfaced via CLI help.

## Backlog & Exploratory

- [ ] (M) Investigate plugin marketplace/discovery feature for future release.
- [ ] (L) Research telemetry hooks respecting privacy guidelines.
- [ ] (L) Evaluate additional deployment targets (Fly.io, AWS Lambda, Cloudflare Workers).
