# Project Plan · grammY Template CLI

## 1. Vision & Success Criteria

- **Primary Goal:** Deliver a Deno-first scaffolding CLI, published on JSR, that bootstraps
  production-grade grammY bot projects with optional plugin presets and deployment recipes.
- **Success Metrics:**
  - CLI runnable via `deno run`, `npx`, and `bunx` using the JSR-distributed package with <500ms
    cold-start time.
  - At least three ready-to-run template variants (TS minimal, JS minimal, conversations + plugins)
    with 100% passing tests.
  - Automated QA pipeline covering lint, fmt, unit tests, and generated-project smoke tests with
    ≥80% code coverage.
  - Versioned release workflow using `deno publish` with semantic versioning discipline.
  - Generated projects must scaffold in <5 seconds and include working `.env.example` files.
  - All templates must pass `deno lint`, `deno fmt --check`, and basic bot instantiation tests.

## 2. Stakeholders & Target Users

- **Stakeholders:** grammy-cli maintainers, grammY community contributors, Factory agents.
- **Primary Users:** Developers spinning up Telegram bots using grammY who value Deno compatibility
  but may deploy to Node or Bun environments.

## 3. Scope & Deliverables

- CLI entry point with subcommands: `new`, `list`, `doctor`, `upgrade`.
- Template rendering system powered by Eta with partials and file tokenization.
- Template catalog including:
  1. Minimal TypeScript bot with env config and lint/test tasks.
  2. Minimal JavaScript variant mirroring TS feature set.
  3. Advanced preset featuring `@grammyjs/conversations`, menu helpers, rate limiter, and i18n
     wiring.
- Deployment recipes for Deno Deploy, Node (npm), and Bun outlined within generated templates.
- Documentation surfaced through CLI help output (not README edits unless requested).
- Release tooling (`deno task release`, changelog stub, publish automation checklist).

## 4. Constraints & Assumptions

- Prefer `jsr:` and `npm:` specifiers; avoid raw HTTP imports per JSR publish rules.
- Keep generated projects free of proprietary secrets; rely on `.env.example` placeholders.
- Support latest stable Deno, Node ≥18 (or LTS under evaluation), Bun ≥1.1.
- CLI should function without requiring interactive prompts (flags for CI usage).

## 5. Research Insights (Summary)

- **JSR:** Requires `deno.json` metadata with `name`, `version`, `exports`, and `publish` commands;
  `deno publish` handles uploads. JSR mirrors to `@jsr` npm scope enabling `npx`/`bunx` usage.
- **Template Engine:** Eta offers minimal footprint, async rendering, caching, and native Deno
  support, making it ideal for repeated scaffolding operations.
- **grammY Ecosystem:** Core library plus official plugins for sessions (`@grammyjs/conversations`,
  `@grammyjs/storage-*`), UX (`@grammyjs/menu`, `@grammyjs/parse-mode`), reliability
  (`@grammyjs/runner`, `@grammyjs/auto-retry`, `@grammyjs/ratelimiter`), and localization
  (`@grammyjs/i18n`, `@grammyjs/fluent`).
- **CLI Framework:** Commander (via `npm:commander`) provides mature option parsing; compatible with
  Deno when imported through npm specifier, with terminal width handling adjustments.

## 6. Architecture Outline

### 6.1 CLI Layer

- Entry module `src/cli.ts` exporting a Commander program.
- Shared utilities for logging, path resolution, template copying, environment detection.
- Subcommand modules under `src/commands/*` to keep logic isolated.

### 6.2 Template System

- Template definitions stored under `templates/<variant>/<files...>` using Eta syntax (`.eta`) for
  dynamic sections.
- Metadata manifest (`templates/index.ts`) describing template name, description, supported plugins,
  and compatibility notes.
- Rendering pipeline: load manifest → gather answers (interactive or via flags) → render Eta
  templates to target directory → execute post-scaffold hooks (instructions, optional dependency
  installs).

### 6.3 Distribution & Tooling

- `deno.json` tasks: `dev`, `fmt`, `lint`, `test`, `release`.
- Continuous integration workflow (GitHub Actions) executing matrix tests across Deno/Node/Bun for
  CLI and generated templates.
- Release script ensuring version bump, changelog update, artifact tests, and `deno publish`
  invocation.

## 7. Implementation Phases & Timeline

### Phase 0 – Foundations ✅ **COMPLETE**
**Estimated: 1-2 days | Actual: Complete**
- Set up repo structure (`src`, `templates`, `scripts`), configure `deno.json`, lock file, and
  basic CI stub.
- Implement logging, config loading, and utilities.
- **Exit Criteria:** Repo structured, dependencies locked, utilities testable, CI runs fmt/lint/test.

### Phase 1 – CLI Core 🚧 **IN PROGRESS**
**Estimated: 3-4 days**
- Build Commander entry, parse global options (verbosity, runtime preference, non-interactive).
- Implement `list` and `doctor` commands to validate environment and show templates.
- Wire interactive prompt layer with non-interactive flags fallback.
- **Exit Criteria:** CLI executable, `list`/`doctor` commands functional, help text complete.
- **Dependencies:** Phase 0 complete.

### Phase 2 – Template Engine Integration
**Estimated: 4-5 days**
- Integrate Eta, create manifest loader, ensure cross-platform file emission.
- Provide base templates (TS/JS minimal) and smoke tests verifying scaffolds run.
- Implement `new` command with basic template scaffolding.
- **Exit Criteria:** Templates generate successfully, pass lint/fmt, basic bot runs without errors.
- **Dependencies:** Phase 1 complete, manifest schema defined.

### Phase 3 – Advanced Templates & Plugins
**Estimated: 5-6 days**
- Add conversations/i18n/rate-limiter presets with configuration prompts.
- Implement plugin flag parsing for `new` command to compose templates.
- Document deployment recipes within generated projects.
- **Exit Criteria:** Advanced template generates with plugins, all presets tested, deployment docs
  included.
- **Dependencies:** Phase 2 complete, plugin selection UX designed.

### Phase 4 – QA & Distribution
**Estimated: 3-4 days**
- Author unit/integration tests, configure CI matrix across Deno/Node/Bun.
- Implement `deno task release` workflow, finalize release tooling.
- Run `deno publish --dry-run` and address validation issues.
- Validate `npx`/`bunx` execution paths.
- Document upgrade path via CLI help output.
- **Exit Criteria:** ≥80% test coverage, CI passing on all runtimes, successful dry-run publish.
- **Dependencies:** All prior phases complete.

**Total Estimated Timeline:** 16-21 days (approx. 3-4 weeks)

## 8. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy | Status |
|------|--------|------------|---------------------|---------|
| **JSR Publishing Errors** | High - blocks release | Medium | Run `deno publish --dry-run` in CI before releases; maintain publish checklist | Mitigated |
| **Template Drift** | Medium - outdated templates | High | Add snapshot tests for rendered outputs; enforce lint/test pipelines on generated projects; version-pin template dependencies | Planned |
| **Runtime Incompatibilities** | High - breaks user experience | Medium | Maintain CI matrix tests across Deno/Node/Bun; explicit runtime guards in CLI; document minimum versions | Active |
| **Plugin Maintenance** | Medium - outdated plugins | Medium | Centralize plugin metadata in manifest; document version pinning strategy; quarterly dependency review | Planned |
| **Breaking Changes in grammY** | Medium - templates fail | Low | Pin grammY versions in templates; subscribe to grammY release notes; test against beta releases | Planned |
| **Eta Template Bugs** | Low - generation issues | Low | Comprehensive template smoke tests; escape user input properly; validate rendered output | Active |
| **Poor CLI UX** | Medium - low adoption | Medium | User testing with early adopters; comprehensive help text; non-interactive mode for CI | Active |

## 9. Testing Strategy

### Unit Tests
- **Coverage Target:** ≥80% for core utilities, template rendering, and command logic
- **Scope:** Individual functions, utility modules, manifest parsing, path resolution
- **Tools:** Deno's built-in test runner, assertion library
- **Frequency:** Run on every commit via CI

### Integration Tests
- **Scope:** End-to-end CLI command execution, template generation workflows
- **Test Cases:**
  - `new` command generates valid project structure
  - `list` command displays all available templates
  - `doctor` command detects runtime environments correctly
  - Generated projects pass lint/fmt without modification
- **Frequency:** Run in CI before merges to main

### Smoke Tests
- **Scope:** Generated project functionality
- **Test Cases:**
  - Template projects instantiate without errors
  - Dependencies resolve correctly across Deno/Node/Bun
  - Basic bot startup succeeds (mock bot token)
  - Deployment recipes contain valid configuration
- **Frequency:** Run in Phase 2+ for each template variant

### Cross-Runtime Testing
- **Matrix:** Deno (latest stable), Node (18, 20, 22 LTS), Bun (latest stable)
- **Scope:** CLI execution, template generation, generated project execution
- **CI Configuration:** GitHub Actions matrix strategy
- **Frequency:** On PR and pre-release

### Regression Tests
- **Snapshot Tests:** Rendered template outputs to catch unintended changes
- **Breaking Change Detection:** Version compatibility tests for grammY and plugins
- **Frequency:** On every release branch

## 10. Open Questions & Decisions

### Resolved Decisions
- **Q1: Default deployment target for advanced template?**
  - **Decision (Target: Phase 3 start):** Provide **both** Deno Deploy and Node deployment recipes
    in generated projects. Default example will use Deno Deploy due to zero-config nature, but
    include commented Node/Bun alternatives.
  - **Rationale:** Flexibility without forcing users into one ecosystem; aligns with multi-runtime
    vision.

### Pending Decisions
- **Q2: Plugin discovery/marketplace command in v1?**
  - **Status:** Backlogged to post-v1.0
  - **Rationale:** Adds complexity; focus v1 on core scaffolding. Evaluate after user feedback.
  - **Action:** Create GitHub issue for v1.1 consideration.

- **Q3: Telemetry/analytics?**
  - **Status:** Not included in v1.0
  - **Rationale:** Privacy-first approach; no telemetry unless explicit user opt-in with clear data
    policy.
  - **Action:** If future versions need usage data, implement opt-in only with transparent
    documentation.

- **Q4: Minimum Node/Bun versions?**
  - **Status:** To be validated during Phase 1 testing
  - **Current assumption:** Node ≥18 LTS, Bun ≥1.1
  - **Action:** Verify during `doctor` command implementation; document in README and CLI help.

- **Q5: License selection?**
  - **Status:** To be decided before Phase 4 release
  - **Options:** MIT (permissive, community standard) or Apache 2.0 (patent protection)
  - **Action:** Consult stakeholders, document in README/LICENSE file before first release.

## 11. Communication & Reporting

### Documentation Updates
- **TASKS.md:** Day-to-day execution tracking with status updates after task completion
- **AGENTS.md:** Update when workflows, commands, conventions, or tooling changes
- **PLAN.md:** Major strategic changes, scope adjustments, or architectural pivots

### Commit Message Standards
- Reference plan sections when implementing planned features (e.g., "Implement doctor command
  [Phase 1, Section 7.1]")
- Link to resolved open questions when making decisions (e.g., "Use Deno Deploy as default
  deployment [Section 10, Q1]")
- Use conventional commits format: `type(scope): description`
  - Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

### Review Checkpoints
- **Phase Completion:** Update phase status in all three docs, conduct retrospective
- **Weekly:** Review TASKS.md, update statuses, identify blockers
- **Pre-Release:** Verify all documentation is current, open questions addressed
