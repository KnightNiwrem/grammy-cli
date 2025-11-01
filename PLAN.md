# Project Plan · grammY Template CLI

## 1. Vision & Success Criteria
- **Primary Goal:** Deliver a Deno-first scaffolding CLI, published on JSR, that bootstraps production-grade grammY bot projects with optional plugin presets and deployment recipes.
- **Success Metrics:**
  - CLI runnable via `deno run`, `npx`, and `bunx` using the JSR-distributed package.
  - At least three ready-to-run template variants (TS minimal, JS minimal, conversations + plugins).
  - Automated QA pipeline covering lint, fmt, unit tests, and generated-project smoke tests.
  - Versioned release workflow using `deno publish` with semantic versioning discipline.

## 2. Stakeholders & Target Users
- **Stakeholders:** grammy-cli maintainers, grammY community contributors, Factory agents.
- **Primary Users:** Developers spinning up Telegram bots using grammY who value Deno compatibility but may deploy to Node or Bun environments.

## 3. Scope & Deliverables
- CLI entry point with subcommands: `new`, `list`, `doctor`, `upgrade`.
- Template rendering system powered by Eta with partials and file tokenization.
- Template catalog including:
  1. Minimal TypeScript bot with env config and lint/test tasks.
  2. Minimal JavaScript variant mirroring TS feature set.
  3. Advanced preset featuring `@grammyjs/conversations`, menu helpers, rate limiter, and i18n wiring.
- Deployment recipes for Deno Deploy, Node (npm), and Bun outlined within generated templates.
- Documentation surfaced through CLI help output (not README edits unless requested).
- Release tooling (`deno task release`, changelog stub, publish automation checklist).

## 4. Constraints & Assumptions
- Prefer `jsr:` and `npm:` specifiers; avoid raw HTTP imports per JSR publish rules.
- Keep generated projects free of proprietary secrets; rely on `.env.example` placeholders.
- Support latest stable Deno, Node ≥18 (or LTS under evaluation), Bun ≥1.1.
- CLI should function without requiring interactive prompts (flags for CI usage).

## 5. Research Insights (Summary)
- **JSR:** Requires `deno.json` metadata with `name`, `version`, `exports`, and `publish` commands; `deno publish` handles uploads. JSR mirrors to `@jsr` npm scope enabling `npx`/`bunx` usage.
- **Template Engine:** Eta offers minimal footprint, async rendering, caching, and native Deno support, making it ideal for repeated scaffolding operations.
- **grammY Ecosystem:** Core library plus official plugins for sessions (`@grammyjs/conversations`, `@grammyjs/storage-*`), UX (`@grammyjs/menu`, `@grammyjs/parse-mode`), reliability (`@grammyjs/runner`, `@grammyjs/auto-retry`, `@grammyjs/ratelimiter`), and localization (`@grammyjs/i18n`, `@grammyjs/fluent`).
- **CLI Framework:** Commander (via `npm:commander`) provides mature option parsing; compatible with Deno when imported through npm specifier, with terminal width handling adjustments.

## 6. Architecture Outline
### 6.1 CLI Layer
- Entry module `src/cli.ts` exporting a Commander program.
- Shared utilities for logging, path resolution, template copying, environment detection.
- Subcommand modules under `src/commands/*` to keep logic isolated.

### 6.2 Template System
- Template definitions stored under `templates/<variant>/<files...>` using Eta syntax (`.eta`) for dynamic sections.
- Metadata manifest (`templates/index.ts`) describing template name, description, supported plugins, and compatibility notes.
- Rendering pipeline: load manifest → gather answers (interactive or via flags) → render Eta templates to target directory → execute post-scaffold hooks (instructions, optional dependency installs).

### 6.3 Distribution & Tooling
- `deno.json` tasks: `dev`, `fmt`, `lint`, `test`, `release`.
- Continuous integration workflow (GitHub Actions) executing matrix tests across Deno/Node/Bun for CLI and generated templates.
- Release script ensuring version bump, changelog update, artifact tests, and `deno publish` invocation.

## 7. Implementation Phases
1. **Phase 0 – Foundations**
   - Set up repo structure (`src`, `templates`, `scripts`), configure `deno.json`, lock file, and basic CI stub.
   - Implement logging, config loading, and utilities.
2. **Phase 1 – CLI Core**
   - Build Commander entry, parse global options (verbosity, runtime preference, non-interactive).
   - Implement `list` and `doctor` commands to validate environment and show templates.
3. **Phase 2 – Template Engine Integration**
   - Integrate Eta, create manifest loader, ensure cross-platform file emission.
   - Provide base templates and smoke tests verifying scaffolds run.
4. **Phase 3 – Advanced Templates & Plugins**
   - Add conversations/i18n/rate-limiter presets with configuration prompts.
   - Implement plugin flag parsing for `new` command to compose templates.
5. **Phase 4 – QA & Distribution**
   - Author unit/integration tests, configure CI matrix.
   - Finalize release tooling, dry-run publish, and document upgrade path via CLI help.

## 8. Risks & Mitigations
- **JSR Publishing Errors:** Mitigate by running `deno publish --dry-run` in CI before releases.
- **Template Drift:** Add snapshot tests for rendered outputs; enforce lint/test pipelines on generated projects.
- **Runtime Incompatibilities:** Maintain matrix tests and explicit runtime guards within CLI.
- **Plugin Maintenance:** Document version pinning strategy and centralize plugin metadata for easier updates.

## 9. Open Questions & Follow-Ups
- Determine default deployment target for advanced template (Deno Deploy vs Node Worker) before Phase 3.
- Decide whether to ship a plugin discovery command in v1 or backlog for later.
- Evaluate need for telemetry/analytics respecting privacy requirements.

## 10. Communication & Reporting
- Use `TASKS.md` for day-to-day execution tracking.
- Update `AGENTS.md` when workflows, commands, or conventions change.
- Record major decisions in commit messages referencing plan sections where applicable.
